'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/store';
import styles from '@/styles/navbar.module.css';
import logoicon from '../public/Pluteo Logo Icon.svg'

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCart((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLinks}>
        <Link href="/" className={styles.navbarLink}>HOME</Link>
        <Link href="/products" className={styles.navbarLink}>SHOP</Link>
        <Link href="/about" className={styles.navbarLink}>ABOUT</Link>
        <Link href="/contact" className={styles.navbarLink}>CONTACT</Link>
      </div>

      <Link className={styles.logoiconimg} href="/"><img src={logoicon.src} alt="Pluteo logo" /></Link>

      <Link href="/cart" className={`${styles.navbarLink} ${styles.cartLink}`}>
        CART
        {mounted && totalItems > 0 && (
          <span className={styles.cartBadge}>{totalItems}</span>
        )}
      </Link>
    </nav>
  );
}
