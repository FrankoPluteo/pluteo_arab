import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/footer.module.css';
import logoicon from '../public/pluteo_logo_short_white.svg'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
        <Link className={styles.logoiconimg} href="/"><Image src={logoicon} alt="Pluteo logo" width={100} height={57} /></Link>
          <p className={styles.footerDescription}>
            Premium Arabian perfumes for the modern connoisseur. 
            Discover authentic fragrances from the finest brands.
          </p>
        </div>

        <div className={styles.footerSection}>
          <h4 className={styles.footerHeading}>Quick Links</h4>
          <nav className={styles.footerNav}>
            <Link href="/products">Shop All</Link>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>

                <div className={styles.footerSection}>
          <h4 className={styles.footerHeading}>Customer Service</h4>
          <nav className={styles.footerNav}>
            <Link href="/contact">Help & Support</Link>
            <Link href="/legal">Legal & Shipping Info</Link>
            <span>Email: pluteoinfo@gmail.com</span>
          </nav>
        </div>

        
      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} Pluteo. All rights reserved.</p>
      </div>
    </footer>
  );
}
