'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/navsearch.module.css';

interface SearchProduct {
  id: string;
  name: string;
  price: number;
  discountAmount: number;
  images: string[];
  brand: { name: string };
}

export default function NavSearch({ inverted }: { inverted: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useLanguage();

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeDropdown();
        inputRef.current?.blur();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, closeDropdown]);

  function goToProduct(id: string) {
    router.push(`/products/${id}`);
    clearQuery();
    closeDropdown();
  }

  function goToAllResults() {
    if (!query.trim()) return;
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    closeDropdown();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        goToProduct(results[activeIndex].id);
      } else {
        goToAllResults();
      }
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={`${styles.rect} ${inverted ? styles.rectInverted : ''} ${open ? styles.rectActive : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.icon}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t.nav.searchPlaceholder}
          className={styles.input}
          autoComplete="off"
          aria-label={t.nav.search}
        />
        {query && (
          <button className={styles.clearBtn} onClick={clearQuery} aria-label="Clear">×</button>
        )}
      </div>

      {showDropdown && (
        <div className={styles.panel}>
          <div className={styles.results}>
            {loading ? (
              <div className={styles.status}>…</div>
            ) : results.length === 0 ? (
              <div className={styles.status}>
                {t.nav.searchNoResults} &ldquo;{query}&rdquo;
              </div>
            ) : (
              <>
                {results.map((p, i) => {
                  const finalPrice = p.price - p.discountAmount;
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className={`${styles.result} ${i === activeIndex ? styles.resultActive : ''}`}
                      onClick={() => { clearQuery(); closeDropdown(); }}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <div className={styles.resultImage}>
                        {p.images[0] && (
                          <Image src={p.images[0]} alt={p.name} width={44} height={44} />
                        )}
                      </div>
                      <div className={styles.resultInfo}>
                        <span className={styles.resultBrand}>{p.brand.name}</span>
                        <span className={styles.resultName}>{p.name}</span>
                      </div>
                      <span className={styles.resultPrice}>€{finalPrice.toFixed(2)}</span>
                    </Link>
                  );
                })}
                <button className={styles.viewAll} onClick={goToAllResults}>
                  {t.nav.searchViewAll} →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
