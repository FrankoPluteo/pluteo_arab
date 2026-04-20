'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/staticpage.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

export default function LegalContent() {
  const { t } = useLanguage();

  return (
    <div>
      <Navbar />

      <div className={styles.pageContainer}>
        <div className={styles.logoContainer}>
          <Image src={logoIcon} alt="Pluteo" width={60} height={60} />
        </div>
        <h1 className={styles.pageTitle}>{t.legal.pageTitle}</h1>

        <div className={styles.contentSection}>
          <p className={styles.leadText}>{t.legal.leadText}</p>

          <div className={styles.legalGrid}>
            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>{t.legal.shippingTitle}</h2>
              <p className={styles.bodyText}>{t.legal.shippingBody1}</p>
              <p className={styles.bodyText}>{t.legal.shippingBody2}</p>
            </div>

            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>{t.legal.returnsTitle}</h2>
              <p className={styles.bodyText}>{t.legal.returnsBody1}</p>
              <p className={styles.bodyText}>
                {t.legal.returnsBody2Prefix}{' '}
                <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>{' '}
                {t.legal.returnsBody2Suffix}
              </p>
            </div>

            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>{t.legal.companyTitle}</h2>
              <p className={styles.bodyText}>{t.legal.companyIntro}</p>
              <ul className={styles.featureList}>
                <li><strong>{t.legal.companyNameLabel}</strong> Vonta Grupa d.o.o.</li>
                <li><strong>{t.legal.companyLocationLabel}</strong> Croatia</li>
                <li>
                  <strong>{t.legal.companyEmailLabel}</strong>{' '}
                  <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>
                </li>
              </ul>
            </div>

            <div className={styles.legalCard}>
              <h2 className={styles.sectionTitle}>{t.legal.contactTitle}</h2>
              <p className={styles.bodyText}>{t.legal.contactBody1}</p>
              <p className={styles.bodyText}>
                <strong>{t.legal.contactEmailLabel}</strong>{' '}
                <a href="mailto:pluteoinfo@gmail.com">pluteoinfo@gmail.com</a>
              </p>
              <p className={styles.bodyText}>
                {t.legal.contactFormPrefix}{' '}
                <Link href="/contact">{t.legal.contactFormLink}</Link>{' '}
                {t.legal.contactFormSuffix}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
