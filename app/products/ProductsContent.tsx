'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import ProductFilters from '@/components/ProductFilters';
import SearchBar from '@/components/SearchBar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import { brandList, trackSearch } from '@/lib/analytics';
import { brandPath, genderPath, shopPath } from '@/lib/urls';
import styles from '@/styles/products.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

// 3 columns above 1024px, 2 below; the image is 80% of the card.
const PRODUCTS_GRID_SIZES = '(max-width: 1024px) 42vw, 26vw';

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
    pageHeading = 'Svi parfemi';
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
      <div className={styles.logoContainer}>
        <Image src={logoIcon} alt="" width={60} height={60} />
      </div>
      <h1 className={styles.pageTitle}>{pageHeading}</h1>

      <SearchBar initialValue={search || ''} />

      {/* Plain links to every brand and to men's/women's: the way in for search engines,
          which don't use the filter form below. */}
      <nav className={styles.quickLinks} aria-label={t.products.quickLinksLabel}>
        <Link href={shopPath()} aria-current={!brandFilter && !genderFilter && !search ? 'page' : undefined}>
          {t.products.allPerfumes}
        </Link>
        <Link href={genderPath('male')} aria-current={genderFilter === 'male' && !brandFilter ? 'page' : undefined}>
          {t.products.forHim}
        </Link>
        <Link href={genderPath('female')} aria-current={genderFilter === 'female' && !brandFilter ? 'page' : undefined}>
          {t.products.forHer}
        </Link>
        {filterOptions.brands.map((brand) => (
          <Link
            key={brand}
            href={brandPath(brand)}
            aria-current={brandFilter === brand && !genderFilter ? 'page' : undefined}
          >
            {brand}
          </Link>
        ))}
      </nav>

      {/* Keyed on the URL so the form starts from the current filters after a link is followed */}
      <ProductFilters key={JSON.stringify(searchParams)} options={filterOptions} />

      {search && (
        <p className={styles.searchInfo}>{t.products.searchInfo(search)}</p>
      )}

      {products.length > 0 ? (
        <>
          <div className={styles.productsGrid}>
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                list={list}
                position={skip + index}
                // First row (3 across on desktop, 2 on phones) holds the largest paint
                eager={index < 3}
                sizes={PRODUCTS_GRID_SIZES}
              />
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
