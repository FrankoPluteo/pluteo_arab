/**
 * The one place that builds storefront URLs for the shop, brands, categories and products.
 * Pages, cards, breadcrumbs, JSON-LD and the sitemap all go through these, so the planned
 * move to keyword URLs (SEO-AUDIT.md, phase B) only has to change this file (plus redirects).
 */

export const SITE_URL = 'https://www.pluteo.shop';

export type GenderSlug = 'male' | 'female';

/** The full shop listing. */
export function shopPath(): string {
  return '/products';
}

/** Listing of one brand's perfumes. */
export function brandPath(brandName: string): string {
  return `/products?brand=${encodeURIComponent(brandName)}`;
}

/** Listing of men's or women's perfumes (unisex ones are listed under both). */
export function genderPath(gender: GenderSlug): string {
  return `/products?gender=${gender}`;
}

/** One product's page. */
export function productPath(product: { id: string }): string {
  return `/products/${product.id}`;
}

/** Page N of a listing; page 1 is the listing itself, without a page parameter. */
export function listingPagePath(params: Record<string, string | undefined>, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'page' && value) query.set(key, value);
  }
  if (page > 1) query.set('page', String(page));
  const qs = query.toString();
  return qs ? `${shopPath()}?${qs}` : shopPath();
}

/** Absolute URL for canonicals, JSON-LD and the sitemap. The home page has no trailing slash. */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}
