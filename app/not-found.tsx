import type { Metadata } from 'next';
import Link from 'next/link';
import { brandPath, genderPath, shopPath } from '@/lib/urls';
import Footer from '@/components/Footer';
import styles from '@/styles/staticpage.module.css';

// No canonical (the home page's is no longer inherited) and no robots setting: Next.js adds
// "noindex" to every 404 itself, so that stays the only robots tag.
export const metadata: Metadata = {
  title: 'Stranica nije pronađena',
};

/**
 * The brands we sell. Kept in code on purpose: the 404 page must not read the database.
 * Next.js renders this page as the fallback of every route, so any cached data read here
 * gives every static page (cart and checkout included) a revalidation timer.
 * Add a brand here when one is added in the admin.
 */
const BRANDS = ['Lattafa', 'Armaf', 'French Avenue', 'Ahmed Al Maghribi', 'Riiffs'];

/**
 * Any unknown URL and every notFound() (e.g. a product id that doesn't exist) lands here,
 * with a 404 status. Instead of a dead end it offers every brand and the main listings.
 */
export default function NotFound() {
  return (
    <>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Stranica nije pronađena</h1>
        <div className={styles.contentSection}>
          <p className={styles.leadText}>
            Stranica koju tražite ne postoji ili je premještena. Pogledajte naše parfeme po brendu
            ili se vratite na <Link href="/">početnu stranicu</Link>.
          </p>

          <h2 className={styles.sectionTitle}>Brendovi</h2>
          <ul className={styles.featureList}>
            {BRANDS.map((brand) => (
              <li key={brand}>
                <Link href={brandPath(brand)}>{brand} parfemi</Link>
              </li>
            ))}
          </ul>

          <h2 className={styles.sectionTitle}>Parfemi</h2>
          <ul className={styles.featureList}>
            <li>
              <Link href={shopPath()}>Svi parfemi</Link>
            </li>
            <li>
              <Link href={genderPath('male')}>Muški parfemi</Link>
            </li>
            <li>
              <Link href={genderPath('female')}>Ženski parfemi</Link>
            </li>
            <li>
              <Link href="/poklon/za-nju">Poklon za nju</Link>
            </li>
            <li>
              <Link href="/poklon/za-njega">Poklon za njega</Link>
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </>
  );
}
