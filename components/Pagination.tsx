'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from '@/styles/products.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: {
    gender?: string;
    brand?: string;
    category?: string;
  };
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const router = useRouter();
  
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    
    if (searchParams.gender) params.set('gender', searchParams.gender);
    if (searchParams.brand) params.set('brand', searchParams.brand);
    if (searchParams.category) params.set('category', searchParams.category);
    
    return `/products?${params.toString()}`;
  };
  
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    router.push(buildUrl(page));
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageButton}
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      <div className={styles.pageNumbers}>
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              className={`${styles.pageNumber} ${currentPage === page ? styles.active : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ) : (
            <span key={index} className={styles.pageNumber} style={{ cursor: 'default', border: 'none' }}>
              {page}
            </span>
          )
        ))}
      </div>
      
      <button
        className={styles.pageButton}
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}