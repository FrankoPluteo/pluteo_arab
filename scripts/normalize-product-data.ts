/**
 * Makes product and brand data consistent (SEO-AUDIT.md, V6 and V7):
 *
 *   1. gender: "Unisex" → "unisex", "Men" → "male", "Women" → "female"
 *      (values the old admin form saved; the shop compares against male/female/unisex)
 *   2. concentration: "Eau de Parfum" → "EDP", "Eau de Toilette" → "EDT", "Eau de Cologne" → "EDC"
 *   3. fragrance profiles: where the Croatian and English lists were entered the wrong
 *      way round (English words in fragranceProfilesHr), swap them; both lists end up
 *      lowercase, the Croatian one in the same words the other products use
 *   4. Croatian notes: one Croatian form per note, merging only spelling and language
 *      variants of the same note (e.g. "Cedar" → "Cedrovina", "Tonka" → "Tonka grah");
 *      no stray spaces, no duplicates within a product
 *   5. brand logos (only with --logos): logoUrl from third-party hosts → the copies in
 *      public/brands/. Each file is checked on the live site first and skipped while it
 *      isn't served yet, so a logo can never point at a missing file.
 *
 * DRY RUN BY DEFAULT: prints every row it would change and writes nothing.
 * Writing needs the explicit flag, in one transaction:
 *
 *   npx tsx scripts/normalize-product-data.ts                    # dry run, products
 *   npx tsx scripts/normalize-product-data.ts --logos            # dry run incl. logos
 *   npx tsx scripts/normalize-product-data.ts --apply            # writes the product changes
 *   npx tsx scripts/normalize-product-data.ts --apply --logos    # logos too (after deploy)
 *
 * Note: the local .env points at the LIVE database.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const LOGOS = process.argv.includes('--logos');
const LIVE_SITE = 'https://www.pluteo.shop';

// 3. English profile words → the Croatian words the rest of the catalog already uses.
const PROFILE_EN_TO_HR: Record<string, string> = {
  woody: 'drvenasto',
  leather: 'kožno',
  oriental: 'orijentalno',
  spicy: 'začinsko',
  fresh: 'svježe',
  aromatic: 'aromatično',
  citrus: 'citrusno',
  sweet: 'slatko',
  floral: 'cvjetno',
  fruity: 'voćno',
  vanilla: 'vanilija',
  smoky: 'dimno',
  aquatic: 'vodenasto',
  icy: 'ledeno',
};
const ENGLISH_PROFILE_WORDS = new Set(Object.keys(PROFILE_EN_TO_HR));

// 4. Spelling and language variants of the SAME note in the Croatian lists → one Croatian
// form. Only true variants are merged: notes that are different materials stay apart, in
// particular amber/jantar (a resinous accord) and ambergris/ambra (a different material),
// and "Ambra", "Ambergris", "Amberwood", "Jantar smola", "Bijela ambra" are left alone.
const NOTE_ALIASES: Record<string, string> = {
  // English word or spelling → the Croatian word for the same note
  Amber: 'Jantar',
  Cedar: 'Cedrovina',
  'Guaiac drvo': 'Gvajakovo drvo',
  'Damask ruža': 'Damastna ruža',
  'Cassis (crni ribiz)': 'Crni ribiz',
  'Olibanum (tamjan)': 'Tamjan',
  'Agarwood (Oud)': 'Oud',
  Ambroxan: 'Ambroksan',
  // Two Croatian spellings of one note
  Bergamota: 'Bergamot',
  Tonka: 'Tonka grah',
  'Tonka zrno': 'Tonka grah',
  Menta: 'Metvica',
  'Bijeli misk': 'Bijeli mošus',
  'Lišće ljubičice': 'List ljubičice',
  'Vodenaste note': 'Vodene note',
  'Hrastovina (mahovina)': 'Hrastova mahovina',
  // Typo
  Ambregris: 'Ambergris',
};

// 5. Brand name → logo copy in public/brands/ (downloaded from the URLs used until now).
const LOCAL_LOGOS: Record<string, string> = {
  Lattafa: '/brands/lattafa.svg',
  Armaf: '/brands/armaf.webp',
  'French Avenue': '/brands/french-avenue.webp',
  'Ahmed Al Maghribi': '/brands/ahmed-al-maghribi.webp',
  Riiffs: '/brands/riiffs.webp',
};

function normalizeNotes(notes: string[]): string[] {
  const out: string[] = [];
  for (const raw of notes) {
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    if (!trimmed) continue;
    const note = NOTE_ALIASES[trimmed] ?? trimmed;
    if (!out.includes(note)) out.push(note);
  }
  return out;
}

interface NormalizableProduct {
  gender: string;
  concentration: string;
  fragranceProfiles: string[];
  fragranceProfilesHr: string[];
  topNotesHr: string[];
  heartNotesHr: string[];
  baseNotesHr: string[];
}

/**
 * The normalized form of one product's fields: pure, no database access. Exported so a
 * test can check that the shop behaves the same on the data before and after --apply.
 */
export function normalizedProductFields(p: NormalizableProduct): NormalizableProduct {
  // 1. gender
  const g = p.gender.trim().toLowerCase();
  const gender = g === 'men' || g === 'man' ? 'male' : g === 'women' || g === 'woman' ? 'female' : g;

  // 2. concentration
  const conc = p.concentration.trim();
  const short: Record<string, string> = { 'eau de parfum': 'EDP', 'eau de toilette': 'EDT', 'eau de cologne': 'EDC' };
  const concentration = short[conc.toLowerCase()] ?? conc;

  // 3. fragrance profiles
  const hrLooksEnglish =
    p.fragranceProfilesHr.length > 0 &&
    p.fragranceProfilesHr.every((x) => ENGLISH_PROFILE_WORDS.has(x.trim().toLowerCase()));
  const englishSource = hrLooksEnglish ? p.fragranceProfilesHr : p.fragranceProfiles;
  const croatianSource = hrLooksEnglish ? p.fragranceProfiles : p.fragranceProfilesHr;
  const fragranceProfiles = englishSource.map((x) => x.trim().toLowerCase());
  const fragranceProfilesHr = hrLooksEnglish
    ? // The English words carry the meaning; map them onto the shared Croatian vocabulary.
      fragranceProfiles.map((x) => PROFILE_EN_TO_HR[x] ?? x)
    : croatianSource.map((x) => x.trim().toLowerCase());

  // 4. Croatian notes
  return {
    gender,
    concentration,
    fragranceProfiles,
    fragranceProfilesHr,
    topNotesHr: normalizeNotes(p.topNotesHr),
    heartNotesHr: normalizeNotes(p.heartNotesHr),
    baseNotesHr: normalizeNotes(p.baseNotesHr),
  };
}

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function show(value: unknown) {
  return Array.isArray(value) ? `[${value.join(', ')}]` : JSON.stringify(value);
}

async function main() {
  console.log(APPLY ? '*** APPLY: writing changes ***\n' : '--- DRY RUN: nothing is written (add --apply to write) ---\n');

  const products = await prisma.product.findMany({
    include: { brand: { select: { name: true } } },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  const productUpdates: { id: string; label: string; data: Prisma.ProductUpdateInput }[] = [];

  for (const p of products) {
    const data: Prisma.ProductUpdateInput = {};
    const changes: string[] = [];
    const set = <K extends keyof Prisma.ProductUpdateInput>(field: K, before: unknown, after: Prisma.ProductUpdateInput[K]) => {
      data[field] = after;
      changes.push(`    ${String(field)}: ${show(before)}  →  ${show(after)}`);
    };

    const next = normalizedProductFields(p);
    if (next.gender !== p.gender) set('gender', p.gender, next.gender);
    if (next.concentration !== p.concentration) set('concentration', p.concentration, next.concentration);
    for (const field of ['fragranceProfiles', 'fragranceProfilesHr', 'topNotesHr', 'heartNotesHr', 'baseNotesHr'] as const) {
      if (!sameList(next[field], p[field])) set(field, p[field], next[field]);
    }

    if (changes.length > 0) {
      const label = `${p.brand.name} ${p.name} (${p.id})`;
      console.log(`PRODUCT ${label}\n${changes.join('\n')}\n`);
      productUpdates.push({ id: p.id, label, data });
    }
  }

  // 5. brand logos, only with --logos
  const brands = await prisma.brand.findMany({ select: { id: true, name: true, logoUrl: true } });
  const brandUpdates: { id: string; logoUrl: string }[] = [];
  if (LOGOS) {
    for (const b of brands) {
      const local = LOCAL_LOGOS[b.name];
      if (!local || b.logoUrl === local) continue;
      // The live site must already serve the file, or the shop would show a broken image.
      const res = await fetch(`${LIVE_SITE}${local}`, { method: 'HEAD' }).catch(() => null);
      const live = res?.ok ?? false;
      console.log(
        `BRAND ${b.name} (${b.id})\n    logoUrl: ${show(b.logoUrl)}  →  ${show(local)}\n` +
          `    ${LIVE_SITE}${local}: ${live ? 'live, OK' : `NOT LIVE (${res?.status ?? 'no response'}), skipped until deployed`}\n`
      );
      if (live) brandUpdates.push({ id: b.id, logoUrl: local });
    }
  } else {
    console.log('Brand logos: not included (add --logos once the deploy with public/brands/ is live).\n');
  }

  console.log(`Summary: ${productUpdates.length} of ${products.length} products and ${brandUpdates.length} of ${brands.length} brands would change.`);

  if (!APPLY) {
    console.log('\nDry run only. Nothing was written.');
    return;
  }

  await prisma.$transaction([
    ...productUpdates.map((u) => prisma.product.update({ where: { id: u.id }, data: u.data })),
    ...brandUpdates.map((u) => prisma.brand.update({ where: { id: u.id }, data: { logoUrl: u.logoUrl } })),
  ]);
  console.log('\nWritten. The shop picks the changes up within a minute (catalog cache).');
}

// Runs only when executed (npx tsx scripts/normalize-product-data.ts), not when imported.
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
