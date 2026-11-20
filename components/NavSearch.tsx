'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import { productCaptureAttributes, trackSearch } from '@/lib/analytics';
import styles from '@/styles/navsearch.module.css';
import { productPath } from '@/lib/urls';

// search_performed fires once per search, with the final query: when the customer opens a
// result, closes the dropdown or leaves the page, or after this long without typing.
// It used to fire on every short pause, so "narci" and "narciso ro" were counted as
// searches of their own. Enter / "view all" are reported by the results page instead.
const SEARCH_SETTLED_MS = 3000;

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
  // Bestsellers the API offers when nothing matched, so the dropdown is never a dead end
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // The latest query with its result count, waiting to be reported as search_performed.
  const pendingSearch = useRef<{ query: string; total: number } | null>(null);
  const settledTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flushSearch = useCallback(() => {
    clearTimeout(settledTimer.current);
    const pending = pendingSearch.current;
    pendingSearch.current = null;
    if (pending) trackSearch(pending.query, pending.total, 'instant');
  }, []);

  const dropPendingSearch = useCallback(() => {
    clearTimeout(settledTimer.current);
    pendingSearch.current = null;
  }, []);
  const router = useRouter();
  const { t } = useLanguage();

  const closeDropdown = useCallback(() => {
    flushSearch();
    setOpen(false);
    setActiveIndex(-1);
  }, [flushSearch]);

  const clearQuery = useCallback(() => {
    flushSearch();
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [flushSearch]);

  // Leaving the page (tab closed or hidden) still reports a search in progress.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushSearch();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flushSearch();
    };
  }, [flushSearch]);

  // Debounced fetch
  useEffect(() => {
    // Still typing: the earlier partial query is not a search of its own.
    clearTimeout(settledTimer.current);
    if (query.trim().length < 2) {
      // Deleted back to nothing: whatever was typed before was abandoned, not searched.
      pendingSearch.current = null;
      setResults([]);
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (cancelled) return;
        setResults(data.products || []);
        setSuggestions(data.suggestions || []);
        const total = typeof data.total === 'number' ? data.total : (data.products || []).length;
        // Replaces any earlier partial query; reported once the search ends (see flushSearch).
        pendingSearch.current = { query, total };
        settledTimer.current = setTimeout(flushSearch, SEARCH_SETTLED_MS);
      } catch {
        setResults([]);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, flushSearch]);

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
    router.push(productPath({ id }));
    clearQuery();
    closeDropdown();
  }

  function goToAllResults() {
    if (!query.trim()) return;
    // The results page reports this search itself (source: results_page).
    dropPendingSearch();
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
              <>
                <div className={styles.status}>{t.nav.searchNotFound(query.trim())}</div>
                {suggestions.length > 0 && (
                  <>
                    <div className={styles.suggestionsLabel}>{t.nav.searchSuggestions}</div>
                    {suggestions.map((p, i) => (
                      <Link
                        key={p.id}
                        href={productPath(p)}
                        className={styles.result}
                        onClick={() => { clearQuery(); closeDropdown(); }}
                        {...productCaptureAttributes(p, 'nav-search-suggestions', i)}
                      >
                        <div className={styles.resultImage}>
                          {p.images[0] && <Image src={p.images[0]} alt={p.name} width={44} height={44} />}
                        </div>
                        <div className={styles.resultInfo}>
                          <span className={styles.resultBrand}>{p.brand.name}</span>
                          <span className={styles.resultName}>{p.name}</span>
                        </div>
                        <span className={styles.resultPrice}>€{(p.price - p.discountAmount).toFixed(2)}</span>
                      </Link>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                {results.map((p, i) => {
                  const finalPrice = p.price - p.discountAmount;
                  return (
                    <Link
                      key={p.id}
                      href={productPath(p)}
                      className={`${styles.result} ${i === activeIndex ? styles.resultActive : ''}`}
                      onClick={() => { clearQuery(); closeDropdown(); }}
                      onMouseEnter={() => setActiveIndex(i)}
                      {...productCaptureAttributes(p, 'nav-search', i)}
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
