'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { listingPagePath } from '@/lib/urls';
import styles from '@/styles/products.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

/**
 * Real links, not buttons: search engines follow them to every page of a listing, and
 * the pages work without JavaScript. The ends ("previous" on page 1, "next" on the last
 * page) are plain text, since there is nowhere to go.
 */
export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  const { t } = useLanguage();

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

  const href = (page: number) => listingPagePath(searchParams, page);

  return (
    <nav className={styles.pagination} aria-label={t.pagination.label}>
      {currentPage > 1 ? (
        <Link className={styles.pageButton} href={href(currentPage - 1)} rel="prev">
          {t.pagination.previous}
        </Link>
      ) : (
        <span className={`${styles.pageButton} ${styles.pageButtonDisabled}`} aria-disabled="true">
          {t.pagination.previous}
        </span>
      )}

      <div className={styles.pageNumbers}>
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <Link
              key={index}
              href={href(page)}
              className={`${styles.pageNumber} ${currentPage === page ? styles.active : ''}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Link>
          ) : (
            <span key={index} className={styles.pageNumber} style={{ cursor: 'default', border: 'none' }}>
              {page}
            </span>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <Link className={styles.pageButton} href={href(currentPage + 1)} rel="next">
          {t.pagination.next}
        </Link>
      ) : (
        <span className={`${styles.pageButton} ${styles.pageButtonDisabled}`} aria-disabled="true">
          {t.pagination.next}
        </span>
      )}
    </nav>
  );
}
