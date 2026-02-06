import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetailClient from '@/components/ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true },
  });
  return product;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const brandName = product.brand?.name || '';
  const genderLabel = product.gender === 'men' ? "Men's" : product.gender === 'women' ? "Women's" : 'Unisex';
  const title = `${brandName} ${product.name} ${product.concentration} ${product.size}ml — ${genderLabel} Arabian Perfume`;
  const description = `Buy ${brandName} ${product.name} ${product.concentration} ${product.size}ml. ${product.description.slice(0, 120)}. Long-lasting luxury Arabian fragrance. Fast delivery across Croatia.`;

  return {
    title,
    description,
    keywords: `${product.name}, ${brandName}, ${brandName} ${product.name}, arabian perfume, oud perfume, ${product.concentration}, ${genderLabel.toLowerCase()} perfume, luxury fragrance croatia, long lasting perfume, oriental perfume`,
    alternates: {
      canonical: `https://www.pluteo.shop/products/${product.id}`,
    },
    openGraph: {
      title: `${brandName} ${product.name} — Buy Authentic Arabian Perfume | Pluteo`,
      description,
      url: `https://www.pluteo.shop/products/${product.id}`,
      siteName: 'Pluteo',
      images: product.images?.length
        ? product.images.map((img) => ({
            url: img,
            width: 800,
            height: 800,
            alt: `${brandName} ${product.name} ${product.concentration} Arabian perfume`,
          }))
        : [{ url: 'https://www.pluteo.shop/og-image.jpg', width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandName} ${product.name} — Arabian Perfume | Pluteo`,
      description: `${product.description.slice(0, 150)}. Shop now at Pluteo.`,
      images: product.images?.length ? [product.images[0]] : ['https://www.pluteo.shop/og-image.jpg'],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const brandName = product.brand?.name || '';
  const finalPrice = product.price - product.discountAmount;
  const hasDiscount = product.discountAmount > 0;

  // JSON-LD Product structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brandName} ${product.name}`,
    description: product.description,
    image: product.images?.length ? product.images : undefined,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    sku: product.id,
    category: 'Perfume',
    offers: {
      '@type': 'Offer',
      url: `https://www.pluteo.shop/products/${product.id}`,
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

  // Serialize the product data for the client component
  const serializedProduct = JSON.parse(JSON.stringify(product));

  return (
    <div>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={serializedProduct} />
      <Footer />
    </div>
  );
}
