import { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
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
    return {
      title: 'Parfem nije pronađen',
    };
  }

  const brandName = product.brand?.name || '';
  const genderLabel =
    product.gender === 'male' ? 'muški' : product.gender === 'female' ? 'ženski' : 'unisex';
  const title = `${brandName} ${product.name} ${product.concentration} ${product.size}ml - ${genderLabel} arapski parfem`;
  const rawDesc = product.descriptionHr || product.description || '';

  const trimToWord = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    const cut = text.lastIndexOf(' ', limit);
    return (cut > 0 ? text.slice(0, cut) : text.slice(0, limit)) + '…';
  };

  const prefix = `${brandName} ${product.name} ${product.concentration} ${product.size}ml - ${genderLabel} arapski parfem. `;
  const suffix = '. Brza dostava diljem Hrvatske.';
  const descBudget = 155 - prefix.length - suffix.length;
  const description = `${prefix}${trimToWord(rawDesc, Math.max(descBudget, 20))}${suffix}`;

  return {
    title,
    description,
    keywords: `${product.name}, ${brandName}, ${brandName} ${product.name}, arapski parfem, arabski parfem, premium arapski parfem, oud parfem, ${product.concentration}, ${genderLabel} parfem, luksuzni parfem hrvatska, dugotrajni parfem, orijentalni parfem`,
    alternates: {
      canonical: `https://www.pluteo.shop/products/${product.id}`,
    },
    openGraph: {
      title: `${brandName} ${product.name} - originalni arapski parfem | Pluteo`,
      description,
      url: `https://www.pluteo.shop/products/${product.id}`,
      siteName: 'Pluteo',
      // Without product images, the site-wide app/opengraph-image is used
      ...(product.images?.length && {
        images: product.images.map((img) => ({
          url: img,
          width: 800,
          height: 800,
          alt: `${brandName} ${product.name} ${product.concentration} - arapski parfem`,
        })),
      }),
      locale: 'hr_HR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandName} ${product.name} - arapski parfem | Pluteo`,
      description: `${trimToWord(rawDesc, 140)}. Kupite na Pluteo.`,
      ...(product.images?.length && { images: [product.images[0]] }),
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const reviewStats = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const brandName = product.brand?.name || '';
  const finalPrice = product.price - product.discountAmount;
  const hasDiscount = product.discountAmount > 0;

  const productUrl = `https://www.pluteo.shop/products/${product.id}`;

  // JSON-LD Product structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brandName} ${product.name}`,
    description: product.descriptionHr || product.description,
    url: productUrl,
    image: product.images?.length ? product.images : undefined,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    sku: product.id,
    category: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
    ...(reviewStats._count.rating > 0 && {
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
      ...(hasDiscount && {
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Pluteo',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'HR',
        },
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '4.99',
          currency: 'EUR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Concentration',
        value: product.concentration,
      },
      {
        '@type': 'PropertyValue',
        name: 'Size',
        value: `${product.size}ml`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Gender',
        value: product.gender,
      },
      ...(product.topNotes?.length
        ? [{ '@type': 'PropertyValue', name: 'Top Notes', value: product.topNotes.join(', ') }]
        : []),
      ...(product.heartNotes?.length
        ? [{ '@type': 'PropertyValue', name: 'Heart Notes', value: product.heartNotes.join(', ') }]
        : []),
      ...(product.baseNotes?.length
        ? [{ '@type': 'PropertyValue', name: 'Base Notes', value: product.baseNotes.join(', ') }]
        : []),
    ],
  };

  const genderCrumb =
    product.gender === 'male'
      ? { name: 'Muški parfemi', item: 'https://www.pluteo.shop/products?gender=male' }
      : product.gender === 'female'
        ? { name: 'Ženski parfemi', item: 'https://www.pluteo.shop/products?gender=female' }
        : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Početna', item: 'https://www.pluteo.shop' },
      { name: 'Parfemi', item: 'https://www.pluteo.shop/products' },
      ...(genderCrumb ? [genderCrumb] : []),
      { name: `${brandName} ${product.name}`, item: productUrl },
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
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={serializedProduct} />
      <Footer />
    </div>
  );
}
