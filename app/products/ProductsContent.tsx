'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import ProductFilters from '@/components/ProductFilters';
import SearchBar from '@/components/SearchBar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import { brandList, trackSearch } from '@/lib/analytics';
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
  /** Bestsellers to show when a search found nothing. */
  suggestions?: Product[];
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
  suggestions = [],
}: ProductsContentProps) {
  const { t } = useLanguage();
  const ITEMS_PER_PAGE = 12;

  // A submitted search (navbar Enter, "view all", the search bar here) lands on this page.
  useEffect(() => {
    if (search) trackSearch(search, totalProducts, 'results_page');
  }, [search, totalProducts]);

  const brandFilter = searchParams.brand;
  const genderFilter = searchParams.gender;

  let pageHeading: string;
  if (brandFilter && !genderFilter) {
    pageHeading = `${brandFilter} parfemi`;
  } else if (genderFilter === 'male' && !brandFilter) {
    pageHeading = 'Muški arapski parfemi';
  } else if (genderFilter === 'female' && !brandFilter) {
    pageHeading = 'Ženski arapski parfemi';
  } else {
    pageHeading = 'Arapski parfemi';
  }

  // Analytics list name; a search wins over filters, then brand, then gender.
  const list = search
    ? 'search'
    : brandFilter
      ? brandList(brandFilter)
      : genderFilter
        ? `gender-${genderFilter}`
        : 'catalog';

  return (
    <div className={styles.productsContainer}>
      <h1 className="sr-only">{pageHeading}</h1>
      <div className={styles.logoContainer}>
        <Image src={logoIcon} alt="Pluteo – arapski parfemi online shop" width={60} height={60} />
      </div>

      <SearchBar initialValue={search || ''} />

      <ProductFilters options={filterOptions} />

      {search && (
        <p className={styles.searchInfo}>{t.products.searchInfo(search)}</p>
      )}

      {products.length > 0 ? (
        <>
          <div className={styles.productsGrid}>
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} list={list} position={skip + index} />
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
      ) : search ? (
        <div className={styles.noResults}>
          <p className={styles.noResultsHeading}>{t.products.noProductsSearch(search)}</p>
          <p className={styles.noResultsHint}>{t.products.noProductsSearchHint}</p>
          {suggestions.length > 0 && (
            <>
              <p className={styles.noResultsSuggestionsLabel}>{t.products.searchSuggestions}</p>
              <div className={styles.productsGrid}>
                {suggestions.map((product, index) => (
                  <ProductCard key={product.id} product={product} list="search-no-results" position={index} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className={styles.noProducts}>{t.products.noProductsFilter}</div>
      )}
    </div>
  );
}
