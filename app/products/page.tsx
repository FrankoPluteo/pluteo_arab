import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import ProductsContent from './ProductsContent';

const BASE_URL = 'https://pluteo.shop';

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;

  // Canonical strips sort/pagination — only brand and gender are "category" params
  const canonicalParams = new URLSearchParams();
  if (params.brand) canonicalParams.set('brand', params.brand);
  if (params.gender) canonicalParams.set('gender', params.gender);
  const canonicalSuffix = canonicalParams.toString() ? `?${canonicalParams.toString()}` : '';
  const canonical = `${BASE_URL}/products${canonicalSuffix}`;

  let title: string;
  let description: string;

  if (params.brand && !params.gender) {
    title = `${params.brand} parfemi – kupite online | Pluteo`;
    description = `Otkrijte kolekciju ${params.brand} parfema. Originalni arabijski i orijentalni mirisi uz brzu dostavu diljem Hrvatske.`;
  } else if (params.gender === 'male' && !params.brand) {
    title = 'Muški arabijski parfemi – kupite online | Pluteo';
    description = 'Istražite našu ponudu muških arabijskih parfema. Premium orijentalni mirisi uz brzu dostavu diljem Hrvatske.';
  } else if (params.gender === 'female' && !params.brand) {
    title = 'Ženski arabijski parfemi – kupite online | Pluteo';
    description = 'Istražite našu ponudu ženskih arabijskih parfema. Premium orijentalni mirisi uz brzu dostavu diljem Hrvatske.';
  } else if (params.search) {
    title = `Rezultati pretrage: "${params.search}" | Pluteo`;
    description = `Rezultati pretrage arabijskih parfema za "${params.search}". Pronađite savršeni miris uz brzu dostavu diljem Hrvatske.`;
  } else {
    title = 'Arabijski parfemi – kupite online | Pluteo';
    description = 'Pregledajte našu kolekciju autentičnih arabijskih parfema, oud mirisa i luksuznih orijentalnih mirisa. Lattafa, Armaf i French Avenue — brza dostava diljem Hrvatske.';
  }

  return {
    title,
    description,
    keywords: 'arabski parfemi, oud parfemi, Lattafa parfemi, Armaf parfemi, French Avenue parfemi, luksuzni orijentalni mirisi, dugotrajni parfemi hrvatska, niche parfemi online',
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

const ITEMS_PER_PAGE = 9;
const BRAND_ORDER = ['Lattafa', 'French Avenue', 'Armaf'];

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    gender?: string;
    brand?: string;
    concentration?: string;
    fragranceProfile?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    search?: string;
    onSale?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const currentPage = parseInt(params.page || '1');
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: any = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { brand: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  if (params.gender) where.gender = { in: [params.gender, 'unisex'] };
  if (params.brand) where.brand = { name: params.brand };
  if (params.concentration) where.concentration = params.concentration;
  if (params.fragranceProfile) where.fragranceProfiles = { has: params.fragranceProfile };

  const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;

  if (params.inStock === 'true') where.stock = { gt: 0 };
  if (params.onSale === 'true') where.discountAmount = { gt: 0 };

  let orderBy: any = null;
  if (params.sortBy && params.sortBy !== 'brand-order') {
    const [field, direction] = params.sortBy.split('-');
    orderBy = { [field]: direction };
  }

  const filterByDiscountedPrice = <T extends { price: number; discountAmount: number }>(items: T[]): T[] => {
    if (minPrice === null && maxPrice === null) return items;
    return items.filter((p) => {
      const discounted = p.price - p.discountAmount;
      if (minPrice !== null && discounted < minPrice) return false;
      if (maxPrice !== null && discounted > maxPrice) return false;
      return true;
    });
  };

  try {
    const [brandsData, concentrationsData, allProducts] = await Promise.all([
      prisma.brand.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.product.findMany({
        select: { concentration: true },
        distinct: ['concentration'],
        orderBy: { concentration: 'asc' },
      }),
      prisma.product.findMany({ select: { fragranceProfiles: true } }),
    ]);

    const allProfiles = new Set<string>();
    allProducts.forEach((p) => {
      if (p.fragranceProfiles && Array.isArray(p.fragranceProfiles)) {
        p.fragranceProfiles.forEach((profile) => allProfiles.add(profile));
      }
    });

    const filterOptions = {
      brands: brandsData.map((b) => b.name),
      concentrations: concentrationsData.map((c) => c.concentration),
      fragranceProfiles: Array.from(allProfiles).sort(),
    };

    let products;
    let totalProducts: number;

    if (!orderBy) {
      const allFiltered = filterByDiscountedPrice(
        await prisma.product.findMany({ where, include: { brand: true } })
      );
      allFiltered.sort((a, b) => {
        const aIdx = BRAND_ORDER.indexOf(a.brand.name);
        const bIdx = BRAND_ORDER.indexOf(b.brand.name);
        return (aIdx === -1 ? BRAND_ORDER.length : aIdx) - (bIdx === -1 ? BRAND_ORDER.length : bIdx);
      });
      totalProducts = allFiltered.length;
      products = await withReviewAggregates(allFiltered.slice(skip, skip + ITEMS_PER_PAGE));
    } else {
      const allFiltered = filterByDiscountedPrice(
        await prisma.product.findMany({ where, include: { brand: true }, orderBy })
      );
      totalProducts = allFiltered.length;
      products = await withReviewAggregates(allFiltered.slice(skip, skip + ITEMS_PER_PAGE));
    }

    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const breadcrumbItems: { name: string; item: string }[] = [
      { name: 'Početna', item: BASE_URL },
      { name: 'Parfemi', item: `${BASE_URL}/products` },
    ];
    if (params.brand) {
      breadcrumbItems.push({ name: params.brand, item: `${BASE_URL}/products?brand=${encodeURIComponent(params.brand)}` });
    } else if (params.gender === 'male') {
      breadcrumbItems.push({ name: 'Muški parfemi', item: `${BASE_URL}/products?gender=male` });
    } else if (params.gender === 'female') {
      breadcrumbItems.push({ name: 'Ženski parfemi', item: `${BASE_URL}/products?gender=female` });
    }

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    };

    return (
      <div>
        <Navbar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <ProductsContent
          products={products}
          totalProducts={totalProducts}
          currentPage={currentPage}
          totalPages={totalPages}
          skip={skip}
          filterOptions={filterOptions}
          searchParams={params}
          search={params.search}
        />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    return (
      <div>
        <Navbar />
        <div style={{ padding: '120px 40px' }}>
          <p>Error loading products. Please try again later.</p>
        </div>
      </div>
    );
  }
}
