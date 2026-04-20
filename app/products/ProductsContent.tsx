'use client';

import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import ProductFilters from '@/components/ProductFilters';
import SearchBar from '@/components/SearchBar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/products.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

interface FilterOptions {
  brands: string[];
  concentrations: string[];
  fragranceProfiles: string[];
}

interface ProductsContentProps {
  products: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  skip: number;
  filterOptions: FilterOptions;
  searchParams: Record<string, string | undefined>;
  search?: string;
}

export default function ProductsContent({
  products,
  totalProducts,
  currentPage,
  totalPages,
  skip,
  filterOptions,
  searchParams,
  search,
}: ProductsContentProps) {
  const { t } = useLanguage();
  const ITEMS_PER_PAGE = 9;

  return (
    <div className={styles.productsContainer}>
      <div className={styles.logoContainer}>
        <Image src={logoIcon} alt="Pluteo" width={60} height={60} />
      </div>

      <SearchBar initialValue={search || ''} />

      <ProductFilters options={filterOptions} />

      {search && (
        <p className={styles.searchInfo}>{t.products.searchInfo(search)}</p>
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
              searchParams={searchParams}
            />
          )}

          <p className={styles.pageInfo}>
            {t.products.pageInfo(
              skip + 1,
              Math.min(skip + ITEMS_PER_PAGE, totalProducts),
              totalProducts
            )}
          </p>
        </>
      ) : (
        <div className={styles.noProducts}>
          {search
            ? t.products.noProductsSearch(search)
            : t.products.noProductsFilter}
        </div>
      )}
    </div>
  );
}
