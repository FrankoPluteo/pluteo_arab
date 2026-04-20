'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
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

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/products?${params.toString()}`);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      gender: '',
      brand: '',
      concentration: '',
      fragranceProfile: '',
      minPrice: '',
      maxPrice: '',
      inStock: '',
      sortBy: 'brand-order',
    });
    router.push('/products');
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
        onClick={() => setIsOpen(!isOpen)}
        className={styles.toggleButton}
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
        <div className={styles.filtersContainer}>
          <div className={styles.filtersHeader}>
            <h3>{t.filters.filtersAndSort}</h3>
            <button onClick={clearFilters} className={styles.clearButton}>
              {t.filters.clearAll}
            </button>
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label>{t.filters.sortBy}</label>
              <select
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
                  checked={filters.inStock === 'true'}
                  onChange={(e) => handleChange('inStock', e.target.checked ? 'true' : '')}
                />
                {t.filters.inStockOnly}
              </label>
            </div>
          </div>

          <button onClick={applyFilters} className={styles.applyButton}>
            {t.filters.applyFilters}
          </button>
        </div>
      )}
    </div>
  );
}
