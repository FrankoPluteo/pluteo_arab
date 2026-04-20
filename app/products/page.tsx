import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import ProductsContent from './ProductsContent';

export const metadata: Metadata = {
  title: 'Shop Arabian Perfumes & Oud Fragrances — Lattafa, Armaf, French Avenue',
  description: 'Browse our curated collection of authentic Arabian perfumes, oud fragrances, and luxury oriental scents. Lattafa, Armaf & French Avenue — long-lasting perfumes shipped across Croatia.',
  keywords: 'buy arabian perfumes, oud perfumes shop, lattafa perfumes, armaf perfumes, french avenue perfumes, luxury oriental fragrances, long lasting perfumes croatia, niche perfumes online',
  alternates: {
    canonical: 'https://www.pluteo.shop/products',
  },
  openGraph: {
    title: 'Shop Arabian & Oud Perfumes | Pluteo — Croatia',
    description: 'Browse authentic Lattafa, Armaf & French Avenue fragrances. Long-lasting luxury Arabian perfumes delivered across Croatia.',
    url: 'https://www.pluteo.shop/products',
  },
};

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

  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) where.price.gte = parseFloat(params.minPrice);
    if (params.maxPrice) where.price.lte = parseFloat(params.maxPrice);
  }

  if (params.inStock === 'true') where.stock = { gt: 0 };

  let orderBy: any = null;
  if (params.sortBy && params.sortBy !== 'brand-order') {
    const [field, direction] = params.sortBy.split('-');
    orderBy = { [field]: direction };
  }

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

    const totalProducts = await prisma.product.count({ where });
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    let products;
    if (!orderBy) {
      const allFiltered = await prisma.product.findMany({ where, include: { brand: true } });
      allFiltered.sort((a, b) => {
        const aIdx = BRAND_ORDER.indexOf(a.brand.name);
        const bIdx = BRAND_ORDER.indexOf(b.brand.name);
        return (aIdx === -1 ? BRAND_ORDER.length : aIdx) - (bIdx === -1 ? BRAND_ORDER.length : bIdx);
      });
      products = await withReviewAggregates(allFiltered.slice(skip, skip + ITEMS_PER_PAGE));
    } else {
      products = await withReviewAggregates(
        await prisma.product.findMany({ where, include: { brand: true }, orderBy, skip, take: ITEMS_PER_PAGE })
      );
    }

    return (
      <div>
        <Navbar />
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
