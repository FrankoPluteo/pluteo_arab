'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/navbar.module.css';
import logoicon from '../public/Pluteo Logo Icon.svg';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const totalItems = useCart((state) => state.getTotalItems());
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setIsScrolledPastHero(true);
      return;
    }

    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setIsScrolledPastHero(window.scrollY >= heroHeight - 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const isTransparent = isHome && !isScrolledPastHero;

  return (
    <nav className={`${styles.navbar} ${isTransparent ? styles.navbarTransparent : styles.navbarSolid}`}>
      <div className={styles.navLinks}>
        <Link href="/" className={styles.navbarLink}>{t.nav.home}</Link>
        <Link href="/products" className={styles.navbarLink}>{t.nav.shop}</Link>
        <Link href="/about" className={styles.navbarLink}>{t.nav.about}</Link>
        <Link href="/contact" className={styles.navbarLink}>{t.nav.contact}</Link>
      </div>

      <Link className={styles.logoiconimg} href="/">
        <Image
          src={logoicon}
          alt="Pluteo logo"
          width={70}
          height={40}
          className={isTransparent ? styles.logoInverted : ''}
        />
      </Link>

      <div className={styles.navRight}>
        <button
          className={styles.langToggle}
          onClick={() => setLanguage(language === 'hr' ? 'en' : 'hr')}
          aria-label={t.languageSwitcher.label}
        >
          {language === 'hr' ? 'EN' : 'HR'}
        </button>

        <Link href="/cart" className={`${styles.navbarLink} ${styles.cartLink}`}>
          {t.nav.cart}
          {mounted && totalItems > 0 && (
            <span className={styles.cartBadge}>{totalItems}</span>
          )}
        </Link>
      </div>
    </nav>
  );
}
