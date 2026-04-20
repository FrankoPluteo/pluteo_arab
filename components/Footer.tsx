'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/footer.module.css';
import logoicon from '../public/pluteo_logo_short_white.svg';
import { useLanguage } from '@/lib/languageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <Link className={styles.logoiconimg} href="/">
            <Image src={logoicon} alt="Pluteo logo" width={100} height={57} />
          </Link>
          <p className={styles.footerDescription}>{t.footer.description}</p>
        </div>

        <div className={styles.footerSection}>
          <h4 className={styles.footerHeading}>{t.footer.quickLinks}</h4>
          <nav className={styles.footerNav}>
            <Link href="/products">{t.footer.shopAll}</Link>
            <Link href="/about">{t.footer.aboutUs}</Link>
            <Link href="/contact">{t.footer.contact}</Link>
          </nav>
        </div>

        <div className={styles.footerSection}>
          <h4 className={styles.footerHeading}>{t.footer.customerService}</h4>
          <nav className={styles.footerNav}>
            <Link href="/contact">{t.footer.helpAndSupport}</Link>
            <Link href="/legal">{t.footer.legalAndShipping}</Link>
            <span>Email: pluteoinfo@gmail.com</span>
          </nav>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} Pluteo. {t.footer.allRightsReserved}</p>
      </div>
    </footer>
  );
}
