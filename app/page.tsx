import { prisma, withReviewAggregates } from '@/lib/prisma';
import HomeContent from './HomeContent';

export const revalidate = 60;

function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pluteo',
    url: 'https://www.pluteo.shop',
    description: 'Premium Arabian perfumes and oud fragrances shipped across Croatia. Authentic Lattafa, Armaf, and French Avenue luxury fragrances.',
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
  const [rawFeatured, rawBestSellers] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { brand: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isBestSeller: true },
      include: { brand: true },
      take: 4,
    }),
  ]);

  const [featuredProducts, bestSellers] = await Promise.all([
    withReviewAggregates(rawFeatured),
    withReviewAggregates(rawBestSellers),
  ]);

  return (
    <>
      <HomeJsonLd />
      <HomeContent featuredProducts={featuredProducts} bestSellers={bestSellers} />
    </>
  );
}
