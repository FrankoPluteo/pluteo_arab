'use client';

import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import { COMPANY } from '@/lib/company';
import styles from '@/styles/staticpage.module.css';
import logoIcon from '@/public/Pluteo Logo Icon.svg';

export default function LegalContent() {
  const { t } = useLanguage();

  return (
    <div>

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

            {/* TODO(owner): the returns text below is unchanged. Replace it with the confirmed
                policy (withdrawal period, who pays the return, condition of the perfume) and
                add hasMerchantReturnPolicy to the product JSON-LD (SEO-AUDIT.md, K4). */}
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
              {/* Filled from lib/company.ts; a detail shows up here once it is filled in there. */}
              <ul className={styles.featureList}>
                <li><strong>{t.legal.companyNameLabel}</strong> {COMPANY.legalName}</li>
                {COMPANY.address ? (
                  <li>
                    <strong>{t.legal.companyAddressLabel}</strong> {COMPANY.address.street},{' '}
                    {COMPANY.address.postalCode} {COMPANY.address.city}
                  </li>
                ) : (
                  <li><strong>{t.legal.companyLocationLabel}</strong> {t.legal.companyCountry}</li>
                )}
                {COMPANY.oib && <li><strong>{t.legal.companyOibLabel}</strong> {COMPANY.oib}</li>}
                {COMPANY.registry && <li><strong>{t.legal.companyRegistryLabel}</strong> {COMPANY.registry}</li>}
                {COMPANY.phone && (
                  <li>
                    <strong>{t.legal.companyPhoneLabel}</strong>{' '}
                    <a href={`tel:${COMPANY.phone.replace(/\s+/g, '')}`}>{COMPANY.phone}</a>
                  </li>
                )}
                <li>
                  <strong>{t.legal.companyEmailLabel}</strong>{' '}
                  <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
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
