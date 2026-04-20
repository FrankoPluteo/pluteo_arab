'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/products.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && value) params.set(key, value);
    });
    return `/products?${params.toString()}`;
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    router.push(buildUrl(page));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
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
        {t.pagination.previous}
      </button>

      <div className={styles.pageNumbers}>
        {getPageNumbers().map((page, index) =>
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
        )}
      </div>

      <button
        className={styles.pageButton}
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t.pagination.next}
      </button>
    </div>
  );
}
