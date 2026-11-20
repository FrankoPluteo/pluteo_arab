import { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SHOW_REVIEWS } from '@/lib/reviews';
import { getCatalog } from '@/lib/catalog';
import { ORGANIZATION_ID } from '@/lib/company';
import { BOXNOW_SHIPPING_COST, FREE_SHIPPING_THRESHOLD, GLS_SHIPPING_COST } from '@/lib/shipping';
import { absoluteUrl, brandPath, productPath, shopPath } from '@/lib/urls';
import {
  genderLabelHr,
  productHeading,
  productMetaDescription,
  productTitle,
  similarProducts,
} from '@/lib/productText';
import Footer from '@/components/Footer';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Product pages are rendered on the first visit and then served from cache, refreshed at
// most once a minute (like the home and gift pages), instead of querying the database on
// every view. Stock and price are checked again at add to cart and at checkout.
export const revalidate = 60;

// No pages are built ahead; each product page is cached after its first visit.
export async function generateStaticParams() {
  return [];
}

// Shared by generateMetadata and the page, so one render reads the product once.
const getProduct = cache(async (id: string) => {
  return prisma.product.findUnique({
    where: { id },
    include: { brand: true },
  });
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    // The 404 page carries Next.js's own "noindex".
    return { title: 'Parfem nije pronađen' };
  }

  const title = productTitle(product);
  const description = productMetaDescription(product);
  const url = absoluteUrl(productPath(product));
  const heading = productHeading(product);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | Pluteo`,
      description,
      url,
      siteName: 'Pluteo',
      // Without product images, the site-wide app/opengraph-image is used
      ...(product.images?.length && {
        images: product.images.map((img) => ({ url: img, alt: heading })),
      }),
      locale: 'hr_HR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Pluteo`,
      description,
      ...(product.images?.length && { images: [product.images[0]] }),
    },
  };
}

/** Delivery from the 1–2 day handling and 2–5 day transit stated on /legal. */
function shippingOption(rate: number, label: string) {
  return {
    '@type': 'OfferShippingDetails',
    shippingLabel: label,
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'HR' },
    shippingRate: { '@type': 'MonetaryAmount', value: rate.toFixed(2), currency: 'EUR' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Reviews switched off (lib/reviews.ts): no query, the product reads as unrated.
  const reviewStats = SHOW_REVIEWS
    ? await prisma.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : { _avg: { rating: null }, _count: { rating: 0 } };

  // "Similar scents" and, for a sold-out perfume, the alternatives: from the cached catalog.
  const { products: catalog } = await getCatalog();
  const related = similarProducts(product, catalog, 4);

  const brandName = product.brand?.name || '';
  const heading = productHeading(product);
  const finalPrice = product.price - product.discountAmount;
  const productUrl = absoluteUrl(productPath(product));

  // A single perfume over the threshold already ships free to a BOX NOW locker.
  const boxNowRate = finalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : BOXNOW_SHIPPING_COST;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: heading,
    description: product.descriptionHr || product.description,
    url: productUrl,
    image: product.images?.length ? product.images : undefined,
    brand: { '@type': 'Brand', name: brandName },
    sku: product.id,
    category: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
    ...(SHOW_REVIEWS && reviewStats._count.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (reviewStats._avg.rating ?? 0).toFixed(1),
        reviewCount: reviewStats._count.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: finalPrice.toFixed(2),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORGANIZATION_ID },
      shippingDetails: [
        shippingOption(GLS_SHIPPING_COST, 'GLS dostava na adresu'),
        shippingOption(boxNowRate, 'BOX NOW paketomat'),
      ],
      // TODO(owner): hasMerchantReturnPolicy once the return policy is confirmed
      // (SEO-AUDIT.md, question 6). Left out rather than guessed.
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Koncentracija', value: product.concentration },
      { '@type': 'PropertyValue', name: 'Volumen', value: `${product.size} ml` },
      { '@type': 'PropertyValue', name: 'Spol', value: genderLabelHr(product.gender) },
      ...(product.topNotesHr?.length
        ? [{ '@type': 'PropertyValue', name: 'Prve note', value: product.topNotesHr.join(', ') }]
        : []),
      ...(product.heartNotesHr?.length
        ? [{ '@type': 'PropertyValue', name: 'Srednje note', value: product.heartNotesHr.join(', ') }]
        : []),
      ...(product.baseNotesHr?.length
        ? [{ '@type': 'PropertyValue', name: 'Bazne note', value: product.baseNotesHr.join(', ') }]
        : []),
    ],
  };

  // Same trail as the visible breadcrumbs in ProductDetailClient.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Početna', item: absoluteUrl('/') },
      { name: 'Parfemi', item: absoluteUrl(shopPath()) },
      ...(brandName ? [{ name: brandName, item: absoluteUrl(brandPath(brandName)) }] : []),
      { name: heading, item: productUrl },
    ].map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
  };

  // Serialize the product data for the client component
  // Review stats go with the product so the reviews block renders complete, no client fetch.
  const serializedProduct = JSON.parse(
    JSON.stringify({
      ...product,
      averageRating: reviewStats._avg.rating ?? 0,
      reviewCount: reviewStats._count.rating,
    })
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={serializedProduct} related={JSON.parse(JSON.stringify(related))} />
      <Footer />
    </div>
  );
}
