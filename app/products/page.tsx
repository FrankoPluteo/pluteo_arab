import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import ProductFilters from '@/components/ProductFilters';
import styles from '@/styles/products.module.css';

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
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  
  const currentPage = parseInt(params.page || '1');
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  
  // Build where clause based on filters
  const where: any = {};
  
  if (params.gender) {
    where.gender = {
      in: [params.gender, 'unisex'], // Include Unisex with Men or Women
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
    const products = await prisma.product.findMany({
      where,
      include: { brand: true },
      orderBy,
      skip,
      take: ITEMS_PER_PAGE,
    });
    
    return (
      <div>
        <Navbar />
        
        <div className={styles.productsContainer}>
          <h1 className={styles.pageTitle}>ALL PRODUCTS</h1>
          
          <ProductFilters options={filterOptions} />
          
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
              No products found. Try adjusting your filters.
            </div>
          )}
        </div>
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