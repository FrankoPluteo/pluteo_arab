/**
 * Sets each product's wholesale price from our Bjutip purchase documents (invoices and
 * order confirmations, as PDFs). Re-runnable: drop a new invoice into the folder and run it
 * again; it reports which of our products changed price.
 *
 * Our DB is the source of truth: it loops over OUR products and looks each one up in the
 * documents. It never creates products, and invoice lines for products we don't sell are
 * only counted, not acted on. Each product gets the price from its most recent document.
 *
 * Matching is by brand + normalized name (case, accents, punctuation, EDP/EDT/U/M/W and
 * "(horse)"-style notes ignored). Bottle size is deliberately ignored: invoices sometimes
 * state a slightly different ml for the same bottle. When names differ only by extra words
 * (e.g. "Pride Vintage Radio" vs our "Vintage Radio") it is a fuzzy match that must be
 * approved once with --approve; approvals are saved in scripts/wholesale-aliases.json.
 *
 *   npx tsx scripts/import-wholesale-prices.ts                       # dry run (default)
 *   npx tsx scripts/import-wholesale-prices.ts --approve SKU1,SKU2   # dry run + save approvals
 *   npx tsx scripts/import-wholesale-prices.ts --apply               # write to the DB
 *   npx tsx scripts/import-wholesale-prices.ts --dir path/to/pdfs    # default: data/
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALIASES_FILE = path.join(__dirname, 'wholesale-aliases.json');
const STOP_WORDS = new Set(['edp', 'edt', 'u', 'm', 'w', 'eau', 'de', 'parfum', 'toilette', 'extrait', 'perfume', 'ml']);

interface DocLine {
  description: string;
  unitPrice: number;
  quantity: number;
  ean: string | null;
}

interface PurchaseDoc {
  file: string;
  number: string;
  kind: 'invoice' | 'order confirmation';
  date: Date;
  lines: DocLine[];
}

interface Candidate extends DocLine {
  doc: PurchaseDoc;
  key: string; // normalized name, brand removed
}

// ---------- PDF parsing ----------

async function pdfText(file: string): Promise<string> {
  // Same loading order as lib/minimax/invoice.ts: the worker provides pdfjs's canvas polyfills.
  const { CanvasFactory, getData } = await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  PDFParse.setWorker(getData());
  const parser = new PDFParse({ data: fs.readFileSync(file), CanvasFactory });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

// "1,922.62" and "19,00" both occur: a comma is a decimal separator only when there's no dot.
function parseAmount(s: string): number {
  return Number(s.includes('.') ? s.replace(/,/g, '') : s.replace(',', '.'));
}

function parseDate(ddmmyyyy: string): Date {
  const [d, m, y] = ddmmyyyy.split('.').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Item rows end in fixed numeric columns; in the EAN layout the description wraps onto
// preceding lines, so description text is buffered until a row's numbers appear.
//   plain: "<desc> [pcs] <total>\t<unit>\t<qty>"
//   EAN:   "<desc> <vat> <price>\t<total>\t<unit>\t<qty>\t<ean>"
const EAN_ROW = /^(.*?)\s*[\d.,]+ [\d.,]+\t([\d.,]+)\t([\d.,]+)\t(\d+)\t(\d{8,14})$/;
const PLAIN_ROW = /^(.*?)\s+(?:pcs\s+)?([\d.,]+)\t([\d.,]+)\t(\d+)$/;

function parseLines(text: string, file: string): DocLine[] {
  const lines: DocLine[] = [];
  let inItems = false;
  let buffer: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^We invoice you/i.test(line)) {
      inItems = true;
      continue;
    }
    if (!inItems) continue;
    if (/^(Total amount|TOTAL DUE)|\tTOTAL DUE$/.test(line)) break;

    const ean = line.match(EAN_ROW);
    const plain = ean ? null : line.match(PLAIN_ROW);
    if (!ean && !plain) {
      buffer.push(line);
      continue;
    }

    // descTail is "" when the whole description wrapped onto the preceding lines.
    const [, descTail = '', totalStr, unitStr, qtyStr, eanStr]: (string | undefined)[] = ean ?? plain!;
    const description = [...buffer, descTail].join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (/^shipping cost\b/i.test(description)) continue;

    const total = parseAmount(totalStr!);
    const unitPrice = parseAmount(unitStr!);
    const quantity = Number(qtyStr);
    if (Math.abs(unitPrice * quantity - total) > 0.011) {
      throw new Error(`${file}: "${description}" — ${quantity} × ${unitPrice} ≠ ${total}; the PDF layout may have changed`);
    }
    lines.push({ description, unitPrice, quantity, ean: eanStr ?? null });
  }

  if (lines.length === 0) throw new Error(`${file}: no item lines found`);
  return lines;
}

async function parseDoc(file: string): Promise<PurchaseDoc> {
  const text = await pdfText(file);
  const name = path.basename(file);

  const invoiceNo = text.match(/INVOICE(?: - TAX DOCUMENT)? No\.\s*(\S+)/);
  const invoiceDate = text.match(/(\d\d\.\d\d\.\d{4})\tInvoice date:/);
  if (invoiceNo && invoiceDate) {
    return { file: name, number: invoiceNo[1], kind: 'invoice', date: parseDate(invoiceDate[1]), lines: parseLines(text, name) };
  }

  const recorded = text.match(/(\d\d\.\d\d\.\d{4})\tDate of record:\s*\n\s*(\d+)/);
  if (/CONFIRMATION OF RECEIPT/.test(text) && recorded) {
    return { file: name, number: recorded[2], kind: 'order confirmation', date: parseDate(recorded[1]), lines: parseLines(text, name) };
  }

  throw new Error(`${name}: could not find an invoice/order number and date`);
}

// ---------- Matching ----------

function tokens(s: string): string[] {
  return s
    .replace(/\d+\s*ml\b/gi, ' ') // size is not used for matching
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Éter -> Eter
    .toLowerCase()
    .replace(/[´'’`]/g, '') // D´Emotion -> demotion
    .replace(/(\d)\.(\d)/g, '$1$2') // Francique 107.9 -> 1079
    .replace(/\([^)]*\)/g, ' ') // "(horse)", "(Bike)"
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !STOP_WORDS.has(t));
}

const keyOf = (toks: string[]) => [...new Set(toks)].sort().join(' ');
const isSubset = (a: string[], b: Set<string>) => a.every((t) => b.has(t));

// Strips our brand from the start of an invoice description; null if it's another brand.
function stripBrand(description: string, brandTokens: string[]): string[] | null {
  const toks = tokens(description);
  return brandTokens.every((t, i) => toks[i] === t) ? toks.slice(brandTokens.length) : null;
}

function latest(cands: Candidate[]): Candidate {
  return cands.reduce((a, b) => (b.doc.date >= a.doc.date ? b : a));
}

// ---------- Main ----------

const fmt = (v: number | null) => (v === null ? '—' : v.toFixed(2));

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dir = argValue('--dir') ?? path.join(process.cwd(), 'data');
  const approve = (argValue('--approve') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
  const docs: PurchaseDoc[] = [];
  for (const f of files) docs.push(await parseDoc(path.join(dir, f)));
  docs.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log(`Read ${docs.length} document(s) from ${dir}:`);
  for (const d of docs) {
    console.log(`  ${d.date.toISOString().slice(0, 10)}  ${d.kind.padEnd(18)} ${d.number.padEnd(10)} ${d.lines.length} lines  (${d.file})`);
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, size: true, minimaxSku: true, brand: { select: { name: true } }, cost: true },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  const aliases: Record<string, string> = fs.existsSync(ALIASES_FILE)
    ? JSON.parse(fs.readFileSync(ALIASES_FILE, 'utf8'))
    : {};

  // Every document line, keyed per brand of ours it could belong to.
  const brandNames = [...new Set(products.map((p) => p.brand.name))];
  const candidatesByBrand = new Map<string, Candidate[]>(brandNames.map((b) => [b, []]));
  const unusedLines = new Set<string>();
  for (const doc of docs) {
    for (const line of doc.lines) {
      let placed = false;
      for (const brand of brandNames) {
        const rest = stripBrand(line.description, tokens(brand));
        if (rest) {
          candidatesByBrand.get(brand)!.push({ ...line, doc, key: keyOf(rest) });
          placed = true;
        }
      }
      if (!placed) unusedLines.add(line.description);
    }
  }

  // A line whose name exactly matches one of our products is never a fuzzy candidate for
  // another (otherwise "Yara" would be offered as a price for our "Yara Candy").
  const ourKeys = new Set(products.map((p) => `${p.brand.name}|${keyOf(tokens(p.name))}`));

  type Result =
    | { kind: 'exact' | 'alias'; pick: Candidate }
    | { kind: 'fuzzy'; pick: Candidate }
    | { kind: 'ambiguous'; options: Candidate[] }
    | { kind: 'none' };

  const results = new Map<string, Result>();
  const usedKeys = new Set<string>();
  for (const p of products) {
    const cands = candidatesByBrand.get(p.brand.name)!;
    const ourToks = tokens(p.name);
    const ourKey = keyOf(ourToks);
    const sku = p.minimaxSku ?? p.id;

    let result: Result;
    const alias = aliases[sku];
    const aliasKey = alias ? keyOf(stripBrand(alias, tokens(p.brand.name)) ?? tokens(alias)) : null;
    const aliasMatches = aliasKey ? cands.filter((c) => c.key === aliasKey) : [];
    const exact = cands.filter((c) => c.key === ourKey);

    if (aliasMatches.length) {
      result = { kind: 'alias', pick: latest(aliasMatches) };
    } else if (exact.length) {
      result = { kind: 'exact', pick: latest(exact) };
    } else {
      const ourSet = new Set(ourToks);
      const fuzzy = cands.filter((c) => {
        if (ourKeys.has(`${p.brand.name}|${c.key}`)) return false;
        const theirs = c.key.split(' ');
        return theirs.length > 0 && (isSubset(ourToks, new Set(theirs)) || isSubset(theirs, ourSet));
      });
      const distinct = [...new Map(fuzzy.map((c) => [c.key, c])).keys()];
      if (distinct.length === 1) {
        result = approve.includes(sku)
          ? { kind: 'alias', pick: latest(fuzzy) }
          : { kind: 'fuzzy', pick: latest(fuzzy) };
        if (approve.includes(sku)) aliases[sku] = latest(fuzzy).description;
      } else if (distinct.length > 1) {
        result = { kind: 'ambiguous', options: distinct.map((k) => latest(fuzzy.filter((c) => c.key === k))) };
      } else {
        result = { kind: 'none' };
      }
    }

    if ('pick' in result) usedKeys.add(`${p.brand.name}|${result.pick.key}`);
    if (result.kind === 'ambiguous') result.options.forEach((c) => usedKeys.add(`${p.brand.name}|${c.key}`));
    results.set(p.id, result);
  }

  const label = (p: (typeof products)[number]) => `${p.brand.name} ${p.name} ${p.size}ml [${p.minimaxSku ?? p.id}]`;
  const oldPrice = (p: (typeof products)[number]) => (p.cost?.wholesalePrice == null ? null : Number(p.cost.wholesalePrice));
  const source = (c: Candidate) => `${c.doc.number} ${c.doc.date.toISOString().slice(0, 10)}  "${c.description}"`;

  const matched = products.filter((p) => ['exact', 'alias'].includes(results.get(p.id)!.kind));
  const fuzzy = products.filter((p) => results.get(p.id)!.kind === 'fuzzy');
  const ambiguous = products.filter((p) => results.get(p.id)!.kind === 'ambiguous');
  const none = products.filter((p) => results.get(p.id)!.kind === 'none');

  console.log(`\n(1) MATCHED (${matched.length}) — old → new wholesale price, from the latest document:`);
  for (const p of matched) {
    const r = results.get(p.id) as { kind: 'exact' | 'alias'; pick: Candidate };
    const before = oldPrice(p);
    const flag = before !== null && before !== r.pick.unitPrice ? '  CHANGED' : '';
    const tag = r.kind === 'alias' ? ' (approved)' : '';
    console.log(`  ${label(p).padEnd(70)} ${fmt(before).padStart(6)} → ${fmt(r.pick.unitPrice).padStart(6)}${flag}${tag}\n      ← ${source(r.pick)}`);
  }

  if (fuzzy.length) {
    console.log(`\n(1b) FUZZY MATCHES NEEDING APPROVAL (${fuzzy.length}) — approve with --approve <SKU,...>:`);
    for (const p of fuzzy) {
      const r = results.get(p.id) as { kind: 'fuzzy'; pick: Candidate };
      console.log(`  ${label(p).padEnd(70)} would be ${fmt(r.pick.unitPrice)}\n      ← ${source(r.pick)}`);
    }
  }

  console.log(`\n(2) NO MATCH IN ANY DOCUMENT (${none.length}):`);
  for (const p of none) console.log(`  ${label(p)}${oldPrice(p) !== null ? `  (keeps existing price ${fmt(oldPrice(p))})` : ''}`);

  console.log(`\n(3) AMBIGUOUS — several different document lines (${ambiguous.length}):`);
  for (const p of ambiguous) {
    console.log(`  ${label(p)}`);
    for (const c of (results.get(p.id) as { kind: 'ambiguous'; options: Candidate[] }).options) {
      console.log(`      ${fmt(c.unitPrice).padStart(6)}  ← ${source(c)}`);
    }
  }

  // Lines for products we don't sell are expected; list them only while there are few.
  for (const [brand, cands] of candidatesByBrand) {
    for (const c of cands) if (!usedKeys.has(`${brand}|${c.key}`)) unusedLines.add(c.description);
  }
  console.log(`\n${unusedLines.size} document line(s) are for products not in our shop and were ignored.`);
  if (unusedLines.size <= 20) for (const d of unusedLines) console.log(`  ${d}`);

  const changed = matched.filter((p) => {
    const before = oldPrice(p);
    return before !== null && before !== (results.get(p.id) as { pick: Candidate }).pick.unitPrice;
  });
  const added = matched.filter((p) => oldPrice(p) === null);
  console.log(`\nSummary: ${matched.length}/${products.length} products priced — ${added.length} new, ${changed.length} changed, ${matched.length - added.length - changed.length} unchanged; ${fuzzy.length} awaiting approval, ${ambiguous.length} ambiguous, ${none.length} without a price.`);

  if (approve.length) {
    fs.writeFileSync(ALIASES_FILE, JSON.stringify(aliases, null, 2) + '\n');
    console.log(`Saved approvals to ${path.relative(process.cwd(), ALIASES_FILE)}.`);
  }

  if (!apply) {
    console.log('\nDry run — nothing written. Re-run with --apply to save these prices.');
    return;
  }

  await prisma.$transaction(
    matched.map((p) => {
      const { pick } = results.get(p.id) as { pick: Candidate };
      const data = { wholesalePrice: pick.unitPrice, sourceDocument: pick.doc.number, sourceDate: pick.doc.date };
      return prisma.productCost.upsert({ where: { productId: p.id }, create: { productId: p.id, ...data }, update: data });
    })
  );
  console.log(`\nWrote ${matched.length} wholesale price(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
