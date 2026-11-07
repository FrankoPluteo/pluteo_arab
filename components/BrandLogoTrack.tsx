'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/brandtrack.module.css';

export interface TrackBrand {
  id: string;
  name: string;
  logoUrl: string;
}

/** This brand sits in the middle of the track and is scrolled into the centre on load. */
const CENTER_BRAND = 'lattafa';

/**
 * Swipeable row of brand logos. Shows 3 on phones and more as the screen widens
 * (see --visible in brandtrack.module.css); the rest are reached by swiping or the arrows.
 */
export default function BrandLogoTrack({ brands }: { brands: TrackBrand[] }) {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Brands arrive most-stocked first; Lattafa is pulled out and put back in the middle.
  const ordered = useMemo(() => {
    const center = brands.find((b) => b.name.toLowerCase() === CENTER_BRAND);
    if (!center) return brands;
    const rest = brands.filter((b) => b !== center);
    const mid = Math.floor(rest.length / 2);
    return [...rest.slice(0, mid), center, ...rest.slice(mid)];
  }, [brands]);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Start with Lattafa centred, then keep the arrows in sync with scroll and resize.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const center = el.querySelector<HTMLElement>('[data-center]');
    if (center) {
      el.scrollLeft = center.offsetLeft - (el.clientWidth - center.offsetWidth) / 2;
    }
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ordered, updateArrows]);

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    const item = el?.firstElementChild as HTMLElement | null;
    if (!el || !item) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * (item.offsetWidth + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  if (ordered.length === 0) return null;

  return (
    // No data-fade: on phones only the top of the track peeks above the fold,
    // too little to trip the fade-in observer, so it would stay invisible.
    <section className={styles.brandTrack} aria-label={t.home.brandsLabel}>
      <p className={styles.label}>{t.home.brandsLabel}</p>

      <div className={styles.viewport}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => step(-1)}
          disabled={!canPrev}
          aria-label={t.home.brandsPrev}
        />

        <ul
          ref={trackRef}
          className={`${styles.track} ${canPrev ? styles.fadeStart : ''} ${canNext ? styles.fadeEnd : ''}`}
          onScroll={updateArrows}
        >
          {ordered.map((brand) => (
            <li
              key={brand.id}
              className={styles.item}
              data-center={brand.name.toLowerCase() === CENTER_BRAND ? '' : undefined}
            >
              <Link
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className={styles.link}
                draggable={false}
              >
                <span className={styles.logo}>
                  {/* Plain <img>: brand logo URLs come from many different hosts */}
                  <img src={brand.logoUrl} alt={`${brand.name} parfemi`} loading="lazy" draggable={false} />
                </span>
                <span className={styles.name}>{brand.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => step(1)}
          disabled={!canNext}
          aria-label={t.home.brandsNext}
        />
      </div>
    </section>
  );
}
