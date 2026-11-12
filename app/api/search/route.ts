import { NextResponse } from 'next/server';
import { getCatalog, searchSuggestions } from '@/lib/catalog';
import { searchProducts } from '@/lib/search';

type CatalogProduct = Awaited<ReturnType<typeof getCatalog>>['products'][number];

function toResult(product: CatalogProduct) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    discountAmount: product.discountAmount,
    images: product.images,
    brand: { name: product.brand.name },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (q.length < 2) {
    return NextResponse.json({ products: [], total: 0, suggestions: [] });
  }

  const { products: catalog } = await getCatalog();
  const matches = searchProducts(catalog, q);

  return NextResponse.json({
    products: matches.slice(0, 6).map(toResult),
    // All matches, not just the 6 shown: search_performed reports it as results_count.
    total: matches.length,
    // Never a dead end: with no match the dropdown offers bestsellers instead.
    suggestions: matches.length === 0 ? searchSuggestions(catalog, 3).map(toResult) : [],
  });
}
