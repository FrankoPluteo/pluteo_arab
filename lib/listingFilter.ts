import { normalizeGender, shortConcentration } from '@/lib/productText';

export interface ListingFilterParams {
  gender?: string;
  brand?: string;
  concentration?: string;
  fragranceProfile?: string;
  inStock?: string;
  onSale?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface FilterableProduct {
  gender: string;
  concentration: string;
  fragranceProfiles: string[];
  fragranceProfilesHr?: string[] | null;
  stock: number;
  price: number;
  discountAmount: number;
  brand: { name: string };
}

/**
 * Whether a product belongs on a /products listing with these filters. Every comparison is
 * independent of how a value happens to be stored ("Unisex"/"unisex", "Eau de Parfum"/"EDP",
 * profiles in either list or case), so results are the same before and after
 * scripts/normalize-product-data.ts runs, and old links keep working.
 */
export function matchesListingFilters(p: FilterableProduct, params: ListingFilterParams): boolean {
  // Unisex perfumes belong under both men's and women's.
  if (params.gender) {
    const gender = normalizeGender(p.gender);
    if (gender !== normalizeGender(params.gender) && gender !== 'unisex') return false;
  }
  if (params.brand && p.brand.name !== params.brand) return false;
  if (params.concentration && shortConcentration(p.concentration) !== shortConcentration(params.concentration)) {
    return false;
  }
  if (params.fragranceProfile) {
    // Both lists, ignoring case: four products had the Croatian and English lists swapped.
    const wanted = params.fragranceProfile.trim().toLowerCase();
    const profiles = [...p.fragranceProfiles, ...(p.fragranceProfilesHr ?? [])].map((x) => x.trim().toLowerCase());
    if (!profiles.includes(wanted)) return false;
  }
  if (params.inStock === 'true' && p.stock <= 0) return false;
  if (params.onSale === 'true' && p.discountAmount <= 0) return false;
  // Price filters use the price after the product's own discount
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
  const discounted = p.price - p.discountAmount;
  if (minPrice !== null && !Number.isNaN(minPrice) && discounted < minPrice) return false;
  if (maxPrice !== null && !Number.isNaN(maxPrice) && discounted > maxPrice) return false;
  return true;
}
