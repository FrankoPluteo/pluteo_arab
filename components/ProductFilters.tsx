'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
  
  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    brand: searchParams.get('brand') || '',
    concentration: searchParams.get('concentration') || '',
    fragranceProfile: searchParams.get('fragranceProfile') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt-asc',
  });

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    router.push(`/products?${params.toString()}`);
    setIsOpen(false); // Close filters after applying
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
      sortBy: 'createdAt-asc',
    });
    router.push('/products');
    setIsOpen(false);
  };

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  // Count active filters
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
          Filters & Sort
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
            <h3>Filters & Sort</h3>
            <button onClick={clearFilters} className={styles.clearButton}>
              Clear All
            </button>
          </div>

          <div className={styles.filtersGrid}>
            {/* Sort By */}
            <div className={styles.filterGroup}>
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleChange('sortBy', e.target.value)}
              >
                <option value="createdAt-asc">Oldest First</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
              </select>
            </div>

            {/* Gender */}
            <div className={styles.filterGroup}>
              <label>Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="">All</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>

            {/* Brand */}
            <div className={styles.filterGroup}>
              <label>Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
              >
                <option value="">All Brands</option>
                {options.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Concentration */}
            <div className={styles.filterGroup}>
              <label>Concentration</label>
              <select
                value={filters.concentration}
                onChange={(e) => handleChange('concentration', e.target.value)}
              >
                <option value="">All</option>
                {options.concentrations.map((conc) => (
                  <option key={conc} value={conc}>
                    {conc}
                  </option>
                ))}
              </select>
            </div>

            {/* Fragrance Profile */}
            <div className={styles.filterGroup}>
              <label>Fragrance Profile</label>
              <select
                value={filters.fragranceProfile}
                onChange={(e) => handleChange('fragranceProfile', e.target.value)}
              >
                <option value="">All</option>
                {options.fragranceProfiles.map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className={styles.filterGroup}>
              <label>Min Price ($)</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Max Price ($)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
                placeholder="1000"
                min="0"
              />
            </div>

            {/* In Stock */}
            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.inStock === 'true'}
                  onChange={(e) => handleChange('inStock', e.target.checked ? 'true' : '')}
                />
                In Stock Only
              </label>
            </div>
          </div>

          <button onClick={applyFilters} className={styles.applyButton}>
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}