import { prisma, withReviewAggregates } from '@/lib/prisma';
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
  const [rawFeatured, rawBestSellers, spotlight] = await Promise.all([
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
    // Picked in admin (Stock & Price → Spotlight). Without one, HomeContent falls back
    // to the first best seller.
    prisma.product.findFirst({
      where: { isSpotlight: true },
      include: { brand: true },
    }),
  ]);

  const [featuredProducts, bestSellers] = await Promise.all([
    withReviewAggregates(rawFeatured),
    withReviewAggregates(rawBestSellers),
  ]);

  return (
    <>
      <HomeJsonLd />
      <HomeContent
        featuredProducts={featuredProducts}
        bestSellers={bestSellers}
        spotlight={spotlight}
      />
    </>
  );
}
