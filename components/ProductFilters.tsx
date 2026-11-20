'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { shopPath } from '@/lib/urls';
import styles from '@/styles/filters.module.css';

interface FilterOptions {
  brands: string[];
  concentrations: string[];
  fragranceProfiles: string[];
}

interface ProductFiltersProps {
  options: FilterOptions;
}

export default function ProductFilters({ options }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    brand: searchParams.get('brand') || '',
    concentration: searchParams.get('concentration') || '',
    fragranceProfile: searchParams.get('fragranceProfile') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') || '',
    sortBy: searchParams.get('sortBy') || 'brand-order',
  });

  // A real GET form (works without JavaScript); with JavaScript the empty fields are left
  // out of the URL and the page changes without a full reload.
  const applyFilters = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === 'sortBy' && value === 'brand-order')) params.set(key, value);
    });
    const qs = params.toString();
    router.push(qs ? `${shopPath()}?${qs}` : shopPath());
    setIsOpen(false);
  };

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) =>
    value && key !== 'sortBy'
  ).length;

  return (
    <div className={styles.filtersWrapper}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.toggleButton}
        aria-expanded={isOpen}
      >
        <span>
          {t.filters.filtersAndSort}
          {activeFiltersCount > 0 && (
            <span className={styles.filterBadge}>{activeFiltersCount}</span>
          )}
        </span>
        <span className={styles.toggleIcon}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <form className={styles.filtersContainer} action={shopPath()} method="get" onSubmit={applyFilters}>
          <div className={styles.filtersHeader}>
            <p className={styles.filtersTitle}>{t.filters.filtersAndSort}</p>
            <Link href={shopPath()} onClick={() => setIsOpen(false)} className={styles.clearButton}>
              {t.filters.clearAll}
            </Link>
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label>{t.filters.sortBy}</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={(e) => handleChange('sortBy', e.target.value)}
              >
                <option value="brand-order">{t.filters.byBrand}</option>
                <option value="createdAt-asc">{t.filters.oldestFirst}</option>
                <option value="createdAt-desc">{t.filters.newestFirst}</option>
                <option value="price-asc">{t.filters.priceLowToHigh}</option>
                <option value="price-desc">{t.filters.priceHighToLow}</option>
                <option value="name-asc">{t.filters.nameAZ}</option>
                <option value="name-desc">{t.filters.nameZA}</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>{t.filters.gender}</label>
              <select
                name="gender"
                value={filters.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="">{t.filters.all}</option>
                <option value="male">{t.filters.men}</option>
                <option value="female">{t.filters.women}</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>{t.filters.brand}</label>
              <select
                name="brand"
                value={filters.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
              >
                <option value="">{t.filters.allBrands}</option>
                {options.brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>{t.filters.fragranceProfile}</label>
              <select
                name="fragranceProfile"
                value={filters.fragranceProfile}
                onChange={(e) => handleChange('fragranceProfile', e.target.value)}
              >
                <option value="">{t.filters.all}</option>
                {options.fragranceProfiles.map((profile) => (
                  <option key={profile} value={profile}>{profile}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>{t.filters.minPrice}</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>{t.filters.maxPrice}</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                placeholder="1000"
                min="0"
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="inStock"
                  value="true"
                  checked={filters.inStock === 'true'}
                  onChange={(e) => handleChange('inStock', e.target.checked ? 'true' : '')}
                />
                {t.filters.inStockOnly}
              </label>
            </div>
          </div>

          <button type="submit" className={styles.applyButton}>
            {t.filters.applyFilters}
          </button>
        </form>
      )}
    </div>
  );
}
