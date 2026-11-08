'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { captureError } from '@/lib/analytics';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/staticpage.module.css';

// Shown in place of a page that threw while rendering. The root layout (navbar, cookie
// banner) stays, so the visitor can still get around.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    captureError(error, { digest: error.digest, boundary: 'page' });
  }, [error]);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>{t.errorPage.title}</h1>
      <div className={styles.contentSection}>
        <p className={styles.leadText}>{t.errorPage.body}</p>
        <div style={{ maxWidth: 320, margin: '0 auto', textAlign: 'center' }}>
          <button type="button" className={styles.submitButton} onClick={reset}>
            {t.errorPage.retry}
          </button>
          <p className={styles.bodyText} style={{ marginTop: 24 }}>
            <Link href="/">{t.errorPage.home}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
