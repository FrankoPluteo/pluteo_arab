/**
 * Makes product and brand data consistent (SEO-AUDIT.md, V6 and V7):
 *
 *   1. gender: "Unisex" → "unisex", "Men" → "male", "Women" → "female"
 *      (values the old admin form saved; the shop compares against male/female/unisex)
 *   2. concentration: "Eau de Parfum" → "EDP", "Eau de Toilette" → "EDT", "Eau de Cologne" → "EDC"
 *   3. fragrance profiles: where the Croatian and English lists were entered the wrong
 *      way round (English words in fragranceProfilesHr), swap them; both lists end up
 *      lowercase, the Croatian one in the same words the other products use
 *   4. Croatian notes: one spelling per note (e.g. "Bergamota" → "Bergamot",
 *      "Tonka grah" → "Tonka"), no stray spaces, no duplicates within a product
 *   5. brand logos: logoUrl from third-party hosts → the copies in public/brands/
 *
 * DRY RUN BY DEFAULT: prints every row it would change and writes nothing.
 * Writing needs the explicit flag, in one transaction:
 *
 *   npx tsx scripts/normalize-product-data.ts            # dry run, shows the changes
 *   npx tsx scripts/normalize-product-data.ts --apply    # writes them
 *
 * Note: the local .env points at the LIVE database.
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

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

// 4. Variant spellings of the same note (Croatian lists) → the most used form.
const NOTE_ALIASES: Record<string, string> = {
  Bergamota: 'Bergamot',
  'Tonka grah': 'Tonka',
  'Tonka zrno': 'Tonka',
  Cedrovina: 'Cedar',
  Ambroxan: 'Ambroksan',
  Ambregris: 'Ambergris',
  Amber: 'Ambra',
  Jantar: 'Ambra',
  'Bijeli misk': 'Bijeli mošus',
  'Gvajakovo drvo': 'Guaiac drvo',
  Metvica: 'Menta',
  'Lišće ljubičice': 'List ljubičice',
  'Damask ruža': 'Damastna ruža',
  'Vodenaste note': 'Vodene note',
  'Olibanum (tamjan)': 'Tamjan',
  'Agarwood (Oud)': 'Oud',
  'Cassis (crni ribiz)': 'Crni ribiz',
  'Hrastovina (mahovina)': 'Hrastova mahovina',
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

    // 1. gender
    const g = p.gender.trim().toLowerCase();
    const gender = g === 'men' || g === 'man' ? 'male' : g === 'women' || g === 'woman' ? 'female' : g;
    if (gender !== p.gender) set('gender', p.gender, gender);

    // 2. concentration
    const conc = p.concentration.trim();
    const short: Record<string, string> = { 'eau de parfum': 'EDP', 'eau de toilette': 'EDT', 'eau de cologne': 'EDC' };
    const concentration = short[conc.toLowerCase()] ?? conc;
    if (concentration !== p.concentration) set('concentration', p.concentration, concentration);

    // 3. fragrance profiles
    const hrLooksEnglish =
      p.fragranceProfilesHr.length > 0 &&
      p.fragranceProfilesHr.every((x) => ENGLISH_PROFILE_WORDS.has(x.trim().toLowerCase()));
    const englishSource = hrLooksEnglish ? p.fragranceProfilesHr : p.fragranceProfiles;
    const croatianSource = hrLooksEnglish ? p.fragranceProfiles : p.fragranceProfilesHr;
    const newEn = englishSource.map((x) => x.trim().toLowerCase());
    const newHr = hrLooksEnglish
      ? // The English words carry the meaning; map them onto the shared Croatian vocabulary.
        newEn.map((x) => PROFILE_EN_TO_HR[x] ?? x)
      : croatianSource.map((x) => x.trim().toLowerCase());
    if (!sameList(newEn, p.fragranceProfiles)) set('fragranceProfiles', p.fragranceProfiles, newEn);
    if (!sameList(newHr, p.fragranceProfilesHr)) set('fragranceProfilesHr', p.fragranceProfilesHr, newHr);

    // 4. Croatian notes
    for (const field of ['topNotesHr', 'heartNotesHr', 'baseNotesHr'] as const) {
      const after = normalizeNotes(p[field]);
      if (!sameList(after, p[field])) set(field, p[field], after);
    }

    if (changes.length > 0) {
      const label = `${p.brand.name} ${p.name} (${p.id})`;
      console.log(`PRODUCT ${label}\n${changes.join('\n')}\n`);
      productUpdates.push({ id: p.id, label, data });
    }
  }

  // 5. brand logos
  const brands = await prisma.brand.findMany({ select: { id: true, name: true, logoUrl: true } });
  const brandUpdates: { id: string; logoUrl: string }[] = [];
  for (const b of brands) {
    const local = LOCAL_LOGOS[b.name];
    if (local && b.logoUrl !== local) {
      console.log(`BRAND ${b.name} (${b.id})\n    logoUrl: ${show(b.logoUrl)}  →  ${show(local)}\n`);
      brandUpdates.push({ id: b.id, logoUrl: local });
    }
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
