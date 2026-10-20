'use client';

import Footer from '@/components/Footer';
import ConsentSettingsButton from '@/components/ConsentSettingsButton';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/staticpage.module.css';

export default function PrivacyContent() {
  const { t } = useLanguage();
  const p = t.privacyPage;
  const listClass = `${styles.bodyText} ${styles.policyList}`;

  return (
    <div>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>{p.title}</h1>

        <div className={styles.contentSection}>
          <p className={styles.bodyText}>{p.lastUpdated}</p>

          <h2 className={styles.sectionTitle}>{p.controllerTitle}</h2>
          <p className={styles.bodyText}>{p.controllerBody}</p>

          <h2 className={styles.sectionTitle}>{p.dataTitle}</h2>
          <ul className={listClass}>
            {p.dataItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className={styles.sectionTitle}>{p.basisTitle}</h2>
          <ul className={listClass}>
            {p.basisItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className={styles.sectionTitle}>{p.cookiesTitle}</h2>
          <p className={styles.bodyText}>{p.cookiesIntro}</p>
          <p className={styles.bodyText}>{p.cookiesNecessary}</p>
          <p className={styles.bodyText}>{p.cookiesAnalytics}</p>
          <p className={styles.bodyText}>{p.cookiesMarketing}</p>
          <ConsentSettingsButton />

          <h2 className={styles.sectionTitle}>{p.sharingTitle}</h2>
          <ul className={listClass}>
            {p.sharingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.bodyText}>{p.sharingTransfers}</p>

          <h2 className={styles.sectionTitle}>{p.retentionTitle}</h2>
          <ul className={listClass}>
            {p.retentionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className={styles.sectionTitle}>{p.rightsTitle}</h2>
          <p className={styles.bodyText}>{p.rightsBody}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
