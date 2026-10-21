'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ALL_DENIED,
  ALL_GRANTED,
  getConsent,
  setConsent,
  type ConsentState,
} from '@/lib/consent';
import styles from '@/styles/consentbanner.module.css';

// Campaign landing pages get a one-row bar while collapsed, so it stays off the products.
const COMPACT_PATHS = ['/jesen'];

interface Props {
  /** Opened from "Postavke kolačića": start with the categories open and take focus. */
  startInSettings: boolean;
  onDone: () => void;
}

/**
 * The one cookie box. "Postavke" opens the categories inside the same box (Meta Pixel is
 * just the Marketing category), so there is never a second popup. "Odbij sve" and
 * "Prihvati sve" share one style so neither is nudged. Fixed to the viewport, so it never
 * shifts the page layout.
 */
export default function ConsentBanner({ startInSettings, onDone }: Props) {
  const { t } = useLanguage();
  const c = t.cookies;
  const [expanded, setExpanded] = useState(startInSettings);
  const [draft, setDraft] = useState<ConsentState>(() => getConsent() ?? ALL_DENIED);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const compact = COMPACT_PATHS.includes(usePathname()) && !expanded;

  useEffect(() => {
    if (startInSettings) headingRef.current?.focus();
  }, [startInSettings]);

  function save(state: ConsentState) {
    setConsent(state);
    onDone();
  }

  return (
    <section
      className={`${styles.banner} ${compact ? styles.compact : ''}`}
      aria-labelledby="consent-heading"
    >
      <h2
        id="consent-heading"
        ref={headingRef}
        tabIndex={-1}
        className={compact ? 'sr-only' : styles.heading}
      >
        {c.heading}
      </h2>
      <p className={styles.text}>
        {compact ? (
          c.compactText
        ) : (
          <>
            {c.bannerText}{' '}
            <Link href="/privatnost" className={styles.link}>
              {c.more}
            </Link>
            {' ·'}
          </>
        )}{' '}
        <button
          type="button"
          className={styles.textButton}
          aria-expanded={expanded}
          aria-controls="consent-categories"
          onClick={() => setExpanded(!expanded)}
        >
          {c.settings}
        </button>
      </p>

      {expanded && (
        <ul id="consent-categories" className={styles.categories}>
          <li className={styles.category}>
            <input id="consent-necessary" type="checkbox" checked disabled className={styles.checkbox} />
            <label htmlFor="consent-necessary">
              <span className={styles.categoryName}>{c.necessaryName}</span>
              <span className={styles.categoryText}>{c.necessaryText}</span>
            </label>
          </li>
          <li className={styles.category}>
            <input
              id="consent-analytics"
              type="checkbox"
              checked={draft.analytics}
              onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })}
              className={styles.checkbox}
            />
            <label htmlFor="consent-analytics">
              <span className={styles.categoryName}>{c.analyticsName}</span>
              <span className={styles.categoryText}>{c.analyticsText}</span>
            </label>
          </li>
          <li className={styles.category}>
            <input
              id="consent-marketing"
              type="checkbox"
              checked={draft.marketing}
              onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })}
              className={styles.checkbox}
            />
            <label htmlFor="consent-marketing">
              <span className={styles.categoryName}>{c.marketingName}</span>
              <span className={styles.categoryText}>{c.marketingText}</span>
            </label>
          </li>
        </ul>
      )}

      <div className={expanded ? styles.actionsThree : styles.actions}>
        <button type="button" className={styles.button} onClick={() => save(ALL_DENIED)}>
          {c.rejectAll}
        </button>
        {expanded && (
          <button type="button" className={styles.button} onClick={() => save(draft)}>
            {c.saveChoice}
          </button>
        )}
        <button type="button" className={styles.button} onClick={() => save(ALL_GRANTED)}>
          {c.acceptAll}
        </button>
      </div>
    </section>
  );
}
