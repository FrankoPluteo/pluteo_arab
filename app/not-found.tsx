import type { Metadata } from 'next';
import Link from 'next/link';
import { getCatalog, searchSuggestions } from '@/lib/catalog';
import { brandPath, genderPath, shopPath } from '@/lib/urls';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import styles from '@/styles/staticpage.module.css';
import homeStyles from '@/styles/home.module.css';

// No canonical (the home page's is no longer inherited) and no robots setting: Next.js adds
// "noindex" to every 404 itself, so that stays the only robots tag.
export const metadata: Metadata = {
  title: 'Stranica nije pronađena',
};

/**
 * Any unknown URL and every notFound() (e.g. a product id that doesn't exist) lands here,
 * with a 404 status. Instead of a dead end it offers the brands and the bestsellers.
 */
export default async function NotFound() {
  const { products, brandNames } = await getCatalog();
  const bestsellers = products.filter((p) => p.isBestSeller && p.stock > 0).slice(0, 4);
  const shown = bestsellers.length > 0 ? bestsellers : searchSuggestions(products, 4);

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
            {brandNames.map((brand) => (
              <li key={brand}>
                <Link href={brandPath(brand)}>{brand} parfemi</Link>
              </li>
            ))}
            <li>
              <Link href={genderPath('male')}>Muški parfemi</Link>
            </li>
            <li>
              <Link href={genderPath('female')}>Ženski parfemi</Link>
            </li>
            <li>
              <Link href={shopPath()}>Svi parfemi</Link>
            </li>
          </ul>
        </div>

        {shown.length > 0 && (
          <section className={homeStyles.section}>
            <h2 className={styles.sectionTitle}>Najprodavaniji</h2>
            <div className={homeStyles.productsGrid}>
              {shown.map((product, index) => (
                <ProductCard key={product.id} product={product} list="not-found" position={index} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
