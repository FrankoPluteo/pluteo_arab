/**
 * Product search that forgives typos, accents and brand misspellings, shared by the navbar
 * dropdown (/api/search) and the results page (/products?search=). It runs over the
 * cached catalog (lib/catalog.ts), a few dozen products, so plain JavaScript is fast enough
 * and nothing extra ships to the browser.
 *
 * A customer searched "Lataffa fakhar rose", got nothing and left with a full cart.
 */

/** Lowercase, no diacritics (č→c, đ→d), punctuation as spaces, single spaces. */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Common misspellings of our brands, applied to the normalized query (whole words only).
const BRAND_ALIASES: [RegExp, string][] = [
  [/\b(lataffa|latafa|lattaffa|latafah|lattafah|latffa|lataf|lattaf)\b/g, 'lattafa'],
  [/\b(armaff|armav|armafe|armah)\b/g, 'armaf'],
  [/\bfrench\s?(avenu|avenuee|avanue|avenye|aveneu)\b/g, 'french avenue'],
  [/\bfrenchavenue\b/g, 'french avenue'],
];

export function normalizeQuery(query: string): string {
  let normalized = normalizeSearchText(query);
  for (const [pattern, brand] of BRAND_ALIASES) normalized = normalized.replace(pattern, brand);
  return normalized.replace(/\s+/g, ' ').trim();
}

/** Edit distance where swapping two neighbouring letters counts as one edit. */
function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** How many typos a word of this length may have: none up to 3 letters, then 1, then 2. */
function allowedTypos(length: number): number {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

/** 1 exact, 0.9 the start of a word ("fakh" → fakhar), lower for typos, 0 no match. */
function wordScore(token: string, word: string): number {
  if (token === word) return 1;
  if (token.length >= 3 && word.startsWith(token)) return 0.9;
  const allowed = allowedTypos(Math.min(token.length, word.length));
  if (allowed === 0 || Math.abs(token.length - word.length) > allowed) return 0;
  const distance = editDistance(token, word);
  return distance <= allowed ? 0.8 - 0.1 * distance : 0;
}

export interface Searchable {
  name: string;
  description?: string | null;
  brand: { name: string };
  fragranceProfiles?: string[];
}

/**
 * How well a product matches, 0 = not at all. Every word of the query must match a word of
 * the brand, name or scent profile (with typos allowed); with three or more words one may
 * miss. A query found word for word in the description still matches, ranked low.
 */
export function scoreProduct(product: Searchable, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;
  const brand = normalizeSearchText(product.brand.name);
  const name = normalizeSearchText(product.name);
  const profiles = normalizeSearchText((product.fragranceProfiles ?? []).join(' '));
  const title = `${brand} ${name}`;

  const words = [...new Set(`${title} ${profiles}`.split(' ').filter(Boolean))];
  const tokens = normalizedQuery.split(' ').filter((token) => token.length >= 2);

  let matched = 0;
  let total = 0;
  for (const token of tokens) {
    const best = Math.max(0, ...words.map((word) => wordScore(token, word)));
    if (best > 0) {
      matched++;
      // Name words count a little more than scent profiles
      total += best * (title.split(' ').includes(token) || name.includes(token) ? 1.2 : 1);
    }
  }

  const required = tokens.length >= 3 ? tokens.length - 1 : tokens.length;
  if (tokens.length > 0 && matched >= required) {
    let score = total * 10;
    if (title.includes(normalizedQuery)) score += 20;
    if (name.startsWith(normalizedQuery)) score += 10;
    return score;
  }

  if (normalizedQuery.length >= 3 && normalizeSearchText(product.description ?? '').includes(normalizedQuery)) {
    return 1;
  }
  return 0;
}

/** The matching products, best match first. */
export function searchProducts<T extends Searchable>(products: T[], query: string): T[] {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) return [];
  return products
    .map((product, index) => ({ product, index, score: scoreProduct(product, normalizedQuery) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((hit) => hit.product);
}
