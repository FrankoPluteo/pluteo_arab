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
  const [menuOpen, setMenuOpen] = useState(false);
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
      setIsScrolledPastHero(window.scrollY >= window.innerHeight - 80);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isTransparent = isHome && !isScrolledPastHero;

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/products', label: t.nav.shop },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];

  return (
    <>
      <nav className={`${styles.navbar} ${isTransparent ? styles.navbarTransparent : styles.navbarSolid}`}>
        {/* Desktop nav links — left */}
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navbarLink}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger — left */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(true)}
          aria-label="Otvori izbornik"
          aria-expanded={menuOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>

        {/* Logo — center */}
        <Link className={styles.logoiconimg} href="/">
          <Image
            src={logoicon}
            alt="Pluteo logo"
            width={70}
            height={40}
            className={isTransparent ? styles.logoInverted : ''}
          />
        </Link>

        {/* Icons — right */}
        <div className={styles.navRight}>
          <button
            className={styles.langToggle}
            onClick={() => setLanguage(language === 'hr' ? 'en' : 'hr')}
            aria-label={t.languageSwitcher.label}
          >
            {language === 'hr' ? 'EN' : 'HR'}
          </button>

          <Link href="/cart" className={`${styles.navbarLink} ${styles.cartLink}`} aria-label={t.nav.cart}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {mounted && totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems}</span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Navigacija">
            <div className={styles.drawerHeader}>
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <Image src={logoicon} alt="Pluteo" width={56} height={32} />
              </Link>
              <button
                className={styles.drawerClose}
                onClick={() => setMenuOpen(false)}
                aria-label="Zatvori izbornik"
              >
                ✕
              </button>
            </div>

            <nav className={styles.drawerNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.drawerLink}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              <button
                className={styles.drawerLangToggle}
                onClick={() => {
                  setLanguage(language === 'hr' ? 'en' : 'hr');
                  setMenuOpen(false);
                }}
              >
                {language === 'hr' ? 'English' : 'Hrvatski'}
              </button>

              <Link href="/cart" className={styles.drawerLink} style={{ border: 'none', padding: '0' }} onClick={() => setMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
