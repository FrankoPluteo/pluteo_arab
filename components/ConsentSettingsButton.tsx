'use client';

import { openConsentSettings } from '@/lib/consent';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/staticpage.module.css';

/** Reopens the cookie banner so a visitor can change or withdraw consent. */
export default function ConsentSettingsButton() {
  const { t } = useLanguage();
  return (
    <button type="button" className={styles.submitButton} onClick={openConsentSettings}>
      {t.cookies.changeSettings}
    </button>
  );
}
