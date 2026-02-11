import { Metadata } from 'next';
import Image from 'next/image';
import { prisma, withReviewAggregates } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import ProductFilters from '@/components/ProductFilters';
import SearchBar from '@/components/SearchBar';
import styles from '@/styles/products.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

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
  
  // Build where clause based on filters
  const where: any = {};
  
  // Search functionality
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { brand: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }
  
  if (params.gender) {
    where.gender = {
      in: [params.gender, 'unisex'],
    };
  }
  
  if (params.brand) {
    where.brand = {
      name: params.brand,
    };
  }
  
  if (params.concentration) {
    where.concentration = params.concentration;
  }
  
  if (params.fragranceProfile) {
    where.fragranceProfiles = {
      has: params.fragranceProfile,
    };
  }
  
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) {
      where.price.gte = parseFloat(params.minPrice);
    }
    if (params.maxPrice) {
      where.price.lte = parseFloat(params.maxPrice);
    }
  }
  
  if (params.inStock === 'true') {
    where.stock = {
      gt: 0,
    };
  }
  
  // Build orderBy based on sortBy parameter
  let orderBy: any = { createdAt: 'asc' };
  
  if (params.sortBy) {
    const [field, direction] = params.sortBy.split('-');
    orderBy = { [field]: direction };
  }
  
  // Get filter options
  try {
    const [brandsData, concentrationsData, allProducts] = await Promise.all([
      prisma.brand.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        select: { concentration: true },
        distinct: ['concentration'],
        orderBy: { concentration: 'asc' },
      }),
      prisma.product.findMany({
        select: { fragranceProfiles: true },
      }),
    ]);
    
    // Extract unique fragrance profiles
    const allProfiles = new Set<string>();
    allProducts.forEach(p => {
      if (p.fragranceProfiles && Array.isArray(p.fragranceProfiles)) {
        p.fragranceProfiles.forEach(profile => allProfiles.add(profile));
      }
    });
    
    const filterOptions = {
      brands: brandsData.map(b => b.name),
      concentrations: concentrationsData.map(c => c.concentration),
      fragranceProfiles: Array.from(allProfiles).sort(),
    };
    
    // Get total count for pagination
    const totalProducts = await prisma.product.count({ where });
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    
    // Get products for current page
    const products = await withReviewAggregates(
      await prisma.product.findMany({
        where,
        include: { brand: true },
        orderBy,
        skip,
        take: ITEMS_PER_PAGE,
      })
    );

    
    return (
      <div>
        <Navbar />
        
        <div className={styles.productsContainer}>
          <div className={styles.logoContainer}>
            <Image src={logoIcon} alt="Pluteo" width={60} height={60} />
          </div>
          <h1 className={styles.pageTitle}>ARABIAN PERFUMES &amp; OUD FRAGRANCES</h1>
          
          <SearchBar initialValue={params.search || ''} />
          
          <ProductFilters options={filterOptions} />
          
          {params.search && (
            <p className={styles.searchInfo}>
              Showing results for: <strong>&quot;{params.search}&quot;</strong>
            </p>
          )}
          
          {products.length > 0 ? (
            <>
              <div className={styles.productsGrid}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchParams={params}
                />
              )}
              
              <p className={styles.pageInfo}>
                Showing {skip + 1}-{Math.min(skip + ITEMS_PER_PAGE, totalProducts)} of {totalProducts} products
              </p>
            </>
          ) : (
            <div className={styles.noProducts}>
              {params.search ? (
                <>
                  No products found for &quot;{params.search}&quot;. Try adjusting your search or filters.
                </>
              ) : (
                'No products found. Try adjusting your filters.'
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    return (
      <div>
        <Navbar />
        <div className={styles.productsContainer}>
          <h1 className={styles.pageTitle}>Error loading products</h1>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }
}
