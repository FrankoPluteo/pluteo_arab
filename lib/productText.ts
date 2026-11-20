/**
 * Search-facing text for product pages: the <title>, the meta description and readable
 * labels. Kept apart from the page so the rules (length limits, what may appear) live in
 * one place.
 *
 * Names of the original perfumes a product is inspired by never go into the title or the
 * description: that needs legal sign-off first (SEO-AUDIT.md, question 4).
 */

/** The layout's title template appends " | Pluteo". */
const TITLE_SUFFIX = ' | Pluteo';
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;
const DESCRIPTION_TAIL = 'Dostava diljem Hrvatske.';

type Gender = 'male' | 'female' | 'unisex';

/** Gender as stored, made consistent ("Unisex" and "unisex" are the same thing). */
export function normalizeGender(gender: string): Gender {
  const g = gender.trim().toLowerCase();
  return g === 'male' || g === 'female' ? g : 'unisex';
}

/** Croatian label, e.g. for the product meta line and JSON-LD. */
export function genderLabelHr(gender: string): string {
  const g = normalizeGender(gender);
  return g === 'male' ? 'muški' : g === 'female' ? 'ženski' : 'unisex';
}

/** Short form used in titles: "Eau de Parfum" → "EDP", "Extrait de Parfum" → "Extrait". */
export function shortConcentration(concentration: string): string {
  const c = concentration.trim().toLowerCase();
  if (c === 'eau de parfum' || c === 'edp') return 'EDP';
  if (c === 'eau de toilette' || c === 'edt') return 'EDT';
  if (c === 'extrait de parfum' || c === 'extrait') return 'Extrait';
  return concentration.trim();
}

interface TitleInput {
  name: string;
  concentration: string;
  size: number;
  brand: { name: string };
}

/**
 * "[Brand] [Name] [concentration] [ml]", without the " | Pluteo" the template adds, and
 * short enough that the whole title stays within 60 characters. Drops the size, then the
 * concentration; a name that is still too long is cut at a word boundary.
 */
export function productTitle(product: TitleInput): string {
  const budget = TITLE_MAX - TITLE_SUFFIX.length;
  const base = `${product.brand.name} ${product.name}`.replace(/\s+/g, ' ').trim();
  const candidates = [
    `${base} ${shortConcentration(product.concentration)} ${product.size}ml`,
    `${base} ${shortConcentration(product.concentration)}`,
    base,
  ];
  const fits = candidates.find((c) => c.length <= budget);
  if (fits) return fits;
  const cut = base.lastIndexOf(' ', budget);
  return cut > 0 ? base.slice(0, cut) : base.slice(0, budget);
}

/** Visible heading: brand and name, e.g. "Lattafa Khamrah Dukhan". */
export function productHeading(product: { name: string; brand: { name: string } }): string {
  return `${product.brand.name} ${product.name}`.replace(/\s+/g, ' ').trim();
}

interface DescriptionInput extends TitleInput {
  gender: string;
  description: string;
  descriptionHr: string | null;
  inspiration: string | null;
  topNotesHr: string[];
  heartNotesHr: string[];
  baseNotesHr: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-ZČĆĐŠŽ])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True when a sentence names the original perfume (any distinctive word of it). */
function mentionsInspiration(sentence: string, product: DescriptionInput): boolean {
  if (!product.inspiration) return false;
  const own = `${product.brand.name} ${product.name}`.toLowerCase();
  const lower = sentence.toLowerCase();
  return product.inspiration
    .toLowerCase()
    .split(/[^a-z0-9à-ž']+/i)
    .filter((word) => word.length > 3 && !own.includes(word))
    .some((word) => lower.includes(word));
}

/**
 * Meta description (≤155 characters) that doesn't repeat the title and ends on a whole
 * sentence: the first sentence of the Croatian description when it fits, otherwise the
 * product's notes, followed by the delivery line when there is room.
 */
export function productMetaDescription(product: DescriptionInput): string {
  const withTail = (text: string) =>
    text.length + 1 + DESCRIPTION_TAIL.length <= DESCRIPTION_MAX ? `${text} ${DESCRIPTION_TAIL}` : text;

  const first = sentences(product.descriptionHr || product.description || '')[0];
  if (first && first.length <= DESCRIPTION_MAX && !mentionsInspiration(first, product)) {
    return withTail(first);
  }

  const notes = [
    ...(product.topNotesHr.length ? product.topNotesHr : product.topNotes),
    ...(product.heartNotesHr.length ? product.heartNotesHr : product.heartNotes),
    ...(product.baseNotesHr.length ? product.baseNotesHr : product.baseNotes),
  ].map((n) => n.trim().toLowerCase());
  const gender = genderLabelHr(product.gender);
  const lead = `${gender.charAt(0).toUpperCase()}${gender.slice(1)} parfem, ${shortConcentration(product.concentration)} ${product.size} ml.`;

  // As many notes as fit, always whole ones.
  let text = lead;
  const picked: string[] = [];
  for (const note of [...new Set(notes)]) {
    const next = `${lead} Note: ${[...picked, note].join(', ')}.`;
    if (next.length + 1 + DESCRIPTION_TAIL.length > DESCRIPTION_MAX) break;
    picked.push(note);
    text = next;
  }
  return withTail(text);
}

interface SimilarCandidate {
  id: string;
  name: string;
  stock: number;
  gender: string;
  brandId: string;
  fragranceProfiles: string[];
  fragranceProfilesHr: string[];
}

/**
 * Perfumes in stock most like the given one: the same line (first word of the name, e.g.
 * "Yara" for Yara Elixir), shared fragrance profiles, the same brand and a gender that
 * fits. Unrelated perfumes (score 0) are left out.
 */
export function similarProducts<T extends SimilarCandidate>(product: SimilarCandidate, catalog: T[], count = 4): T[] {
  const profiles = (p: SimilarCandidate) =>
    new Set([...p.fragranceProfiles, ...p.fragranceProfilesHr].map((x) => x.trim().toLowerCase()));
  const own = profiles(product);
  const line = product.name.trim().split(/\s+/)[0].toLowerCase();
  const gender = normalizeGender(product.gender);

  return catalog
    .filter((p) => p.id !== product.id && p.stock > 0)
    .map((p) => {
      const pGender = normalizeGender(p.gender);
      const genderFits = gender === 'unisex' || pGender === 'unisex' || pGender === gender;
      let score = 0;
      if (p.name.trim().split(/\s+/)[0].toLowerCase() === line) score += 4;
      for (const x of profiles(p)) if (own.has(x)) score += 2;
      if (p.brandId === product.brandId) score += 1;
      if (!genderFits) score -= 3;
      return { p, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ p }) => p);
}
