import { unstable_cache } from 'next/cache';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import { SHOP_ORDER } from '@/lib/productOrder';

/**
 * The whole product catalog (a few dozen perfumes), read from the database at most once
 * a minute and shared by every visitor of /products, so browsing and filtering don't each
 * open a database connection. Same 60 s as the home and gift pages.
 *
 * Shown prices and stock can be up to a minute old. Nothing that takes money relies on
 * this: add to cart reserves stock in /api/cart/reserve, and /api/checkout re-reads prices,
 * stock and codes from the database.
 */
export const CATALOG_REVALIDATE_SECONDS = 60;

const readCatalog = unstable_cache(
  async () => {
    const [products, brands] = await Promise.all([
      // Already in shop order, so /products shows it as is when no other sort is picked.
      prisma.product.findMany({ include: { brand: true }, orderBy: SHOP_ORDER }),
      prisma.brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    ]);
    return {
      products: await withReviewAggregates(products),
      brandNames: brands.map((brand) => brand.name),
    };
  },
  ['catalog-v3'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ['catalog'] }
);

export type CatalogProduct = Awaited<ReturnType<typeof readCatalog>>['products'][number];

export async function getCatalog() {
  const catalog = await readCatalog();
  // The cache stores JSON, so dates come back as strings.
  return {
    ...catalog,
    products: catalog.products.map((product) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    })),
  };
}

/** Bestsellers in stock, then featured, then anything in stock: offered when a search finds nothing. */
export function searchSuggestions<T extends { stock: number; isBestSeller: boolean; isFeatured: boolean }>(
  products: T[],
  count: number
): T[] {
  const inStock = products.filter((product) => product.stock > 0);
  const ranked = [
    ...inStock.filter((product) => product.isBestSeller),
    ...inStock.filter((product) => product.isFeatured && !product.isBestSeller),
    ...inStock,
  ];
  return [...new Set(ranked)].slice(0, count);
}
