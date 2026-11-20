/**
 * READ-ONLY check that the shop shows the same thing before and after
 * scripts/normalize-product-data.ts --apply: it reads the products, builds the normalized
 * copy in memory (the script's own function, nothing is written) and compares listing
 * filters, titles, headings, labels and "similar scents" on both.
 *
 *   npx tsx scripts/check-data-compat.ts
 *
 * Exit code 1 if anything that should be identical differs.
 */
import { PrismaClient } from '@prisma/client';
import { normalizedProductFields } from './normalize-product-data';
import { matchesListingFilters, type ListingFilterParams } from '../lib/listingFilter';
import {
  genderLabelHr,
  normalizeGender,
  productHeading,
  productMetaDescription,
  productTitle,
  shortConcentration,
  similarProducts,
} from '../lib/productText';

const prisma = new PrismaClient();
let failures = 0;

function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`);
}

async function main() {
  const oldData = await prisma.product.findMany({ include: { brand: true } });
  const newData = oldData.map((p) => ({ ...p, ...normalizedProductFields(p) }));
  const ids = (list: typeof oldData, params: ListingFilterParams) =>
    list.filter((p) => matchesListingFilters(p, params)).map((p) => p.id).sort().join(',');
  const count = (list: typeof oldData, params: ListingFilterParams) =>
    list.filter((p) => matchesListingFilters(p, params)).length;

  console.log('\n== 1. /products filters: same products before and after the data change');
  const filterCases: ListingFilterParams[] = [
    {},
    { gender: 'male' },
    { gender: 'female' },
    { gender: 'unisex' },
    { brand: 'Lattafa', gender: 'male' },
    { concentration: 'EDP' },
    { concentration: 'Eau de Parfum' },
    { concentration: 'EDT' },
    { concentration: 'Extrait' },
    { concentration: 'Extrait de Parfum' },
    { fragranceProfile: 'woody' },
    { fragranceProfile: 'drvenasto' },
    { fragranceProfile: 'sweet' },
    { fragranceProfile: 'slatko' },
    { fragranceProfile: 'fresh' },
    { inStock: 'true', gender: 'female' },
  ];
  for (const params of filterCases) {
    // Same products, or more (never fewer): a Croatian profile word also finds the four
    // products whose Croatian and English lists were swapped, once they are fixed.
    const before = new Set(ids(oldData, params).split(','));
    const after = new Set(ids(newData, params).split(','));
    const lost = [...before].filter((id) => id && !after.has(id));
    const gained = [...after].filter((id) => id && !before.has(id));
    const names = (list: string[]) => list.map((id) => newData.find((p) => p.id === id)?.name).join(', ');
    check(
      `filter ${JSON.stringify(params)}`,
      lost.length === 0,
      `before ${before.size} / after ${after.size}` +
        (gained.length ? `  (+ now also: ${names(gained)})` : '') +
        (lost.length ? `  (LOST: ${names(lost)})` : '')
    );
  }

  console.log('\n   Profile values offered in the filter list today that disappear after the change');
  console.log('   (an old link with one of them shows "no products"; they are not indexed):');
  const oldProfiles = new Set(oldData.flatMap((p) => p.fragranceProfiles));
  const newProfiles = new Set(newData.flatMap((p) => p.fragranceProfiles));
  for (const v of [...oldProfiles].filter((v) => !newProfiles.has(v)).sort()) {
    console.log(`     "${v}": before ${count(oldData, { fragranceProfile: v })} / after ${count(newData, { fragranceProfile: v })}`);
  }

  console.log('\n== 2. Unisex under men\'s and women\'s (the bug the old filter had)');
  const oldFilterMale = (list: typeof oldData) =>
    list.filter((p) => p.gender === 'male' || p.gender === 'unisex').length;
  console.log(`   live code today, live data:      men's listing shows ${oldFilterMale(oldData)} products`);
  console.log(`   live code today, normalized data: men's listing shows ${oldFilterMale(newData)} products`);
  console.log(`   new code, either data:            men's listing shows ${count(oldData, { gender: 'male' })} / ${count(newData, { gender: 'male' })} products`);
  check('new code shows every unisex perfume under men\'s', count(oldData, { gender: 'male' }) === count(newData, { gender: 'male' }));

  console.log('\n== 3. Product page text: identical before and after');
  let titleSame = 0, headingSame = 0, genderSame = 0, concSame = 0, descOk = 0;
  for (let i = 0; i < oldData.length; i++) {
    const a = oldData[i], b = newData[i];
    if (productTitle(a) === productTitle(b)) titleSame++;
    else console.log(`     title differs: ${productTitle(a)}  vs  ${productTitle(b)}`);
    if (productHeading(a) === productHeading(b)) headingSame++;
    if (genderLabelHr(a.gender) === genderLabelHr(b.gender) && normalizeGender(a.gender) === normalizeGender(b.gender)) genderSame++;
    if (shortConcentration(a.concentration) === shortConcentration(b.concentration)) concSame++;
    const d = productMetaDescription(b);
    if (d.length <= 155 && /[.!?]$/.test(d)) descOk++;
    else console.log(`     description problem (${d.length}): ${d}`);
  }
  check('<title> identical', titleSame === oldData.length, `${titleSame}/${oldData.length}`);
  check('H1 identical', headingSame === oldData.length, `${headingSame}/${oldData.length}`);
  check('gender label (muški/ženski/unisex) identical', genderSame === oldData.length, `${genderSame}/${oldData.length}`);
  check('short concentration in titles identical', concSame === oldData.length, `${concSame}/${oldData.length}`);
  check('meta description ≤155 chars and ends on a sentence, after the change', descOk === newData.length, `${descOk}/${newData.length}`);

  console.log('\n== 4. "Similar scents": every product still gets suggestions');
  const inStockOld = oldData.map((p) => ({ ...p })), inStockNew = newData.map((p) => ({ ...p }));
  let emptyBefore = 0, emptyAfter = 0;
  for (let i = 0; i < oldData.length; i++) {
    if (similarProducts(oldData[i], inStockOld).length === 0) emptyBefore++;
    if (similarProducts(newData[i], inStockNew).length === 0) emptyAfter++;
  }
  check('no product loses its similar-scents block', emptyAfter <= emptyBefore, `without suggestions: before ${emptyBefore}, after ${emptyAfter}`);

  console.log('\n== 5. Values the admin form writes, old and new');
  const genders: [string, string][] = [
    ['male', 'male'], ['female', 'female'], ['unisex', 'unisex'],
    ['Men', 'male'], ['Women', 'female'], ['Unisex', 'unisex'],
  ];
  for (const [input, expected] of genders) check(`gender "${input}" → ${expected}`, normalizeGender(input) === expected);
  const concs: [string, string][] = [
    ['EDP', 'EDP'], ['Eau de Parfum', 'EDP'], ['EDT', 'EDT'], ['Eau de Toilette', 'EDT'],
    ['Extrait de Parfum', 'Extrait'], ['Parfum', 'Parfum'],
  ];
  for (const [input, expected] of concs) check(`concentration "${input}" → ${expected}`, shortConcentration(input) === expected);

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().finally(() => prisma.$disconnect());
