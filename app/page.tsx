import { prisma, withReviewAggregates } from '@/lib/prisma';
import { SHOP_ORDER } from '@/lib/productOrder';
import HomeContent from './HomeContent';

export const revalidate = 60;

function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pluteo',
    url: 'https://www.pluteo.shop',
    description: 'Premium arapski parfemi i oud mirisi uz brzu dostavu diljem Hrvatske. Originalni Lattafa, Armaf i French Avenue parfemi.',
    inLanguage: 'hr-HR',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.pluteo.shop/products?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function HomePage() {
  const [rawFeatured, rawBestSellers, logoBrands] = await Promise.all([
    // Every product ticked in admin, in the shop order set in /admin/products/order.
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { brand: true },
      orderBy: SHOP_ORDER,
    }),
    prisma.product.findMany({
      where: { isBestSeller: true },
      include: { brand: true },
      orderBy: SHOP_ORDER,
    }),
    // Logo track: brands we actually stock that have a logo, most products first.
    prisma.brand.findMany({
      where: { logoUrl: { not: null }, products: { some: {} } },
      select: { id: true, name: true, logoUrl: true },
      orderBy: [{ products: { _count: 'desc' } }, { name: 'asc' }],
    }),
  ]);

  // In stock first: a sold-out perfume shouldn't lead the row.
  const inStockFirst = <T extends { stock: number }>(products: T[]) =>
    [...products].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));

  const [featuredProducts, bestSellers] = await Promise.all([
    withReviewAggregates(inStockFirst(rawFeatured)),
    withReviewAggregates(inStockFirst(rawBestSellers)),
  ]);

  return (
    <>
      <HomeJsonLd />
      <HomeContent
        featuredProducts={featuredProducts}
        bestSellers={bestSellers}
        logoBrands={logoBrands.map((b) => ({ id: b.id, name: b.name, logoUrl: b.logoUrl! }))}
      />
    </>
  );
}
