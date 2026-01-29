import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import styles from '@/styles/products.module.css';

const ITEMS_PER_PAGE = 9;

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    gender?: string;
    brand?: string;
    category?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Await searchParams
  const params = await searchParams;
  
  const currentPage = parseInt(params.page || '1');
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  
  // Build where clause based on filters
  const where: any = {};
  
  if (params.gender) {
    where.gender = params.gender;
  }
  
  if (params.brand) {
    where.brand = {
      name: params.brand,
    };
  }
  
  // Get total count for pagination
  const totalProducts = await prisma.product.count({ where });
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  
  // Get products for current page
  const products = await prisma.product.findMany({
    where,
    include: { brand: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take: ITEMS_PER_PAGE,
  });
  
  return (
    <div>
      <Navbar />
      
      <div className={styles.productsContainer}>
        <h1 className={styles.pageTitle}>ALL PRODUCTS</h1>
        
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
}