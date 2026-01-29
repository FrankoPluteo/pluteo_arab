import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import styles from '@/styles/home.module.css';
import logolong from '../public/Pluteo Logo Long.svg';
import lattafaimg from '../public/lattafa.jpg';
import frenchavenueimg from '../public/frenchavenue.jpg';
import armafimg from '../public/armaf.jpg';
import wallapaperhome from '../public/wallpaperhome.jpg';

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { isFeatured: true },
    include: { brand: true },
    take: 4,
  });

  const bestSellers = await prisma.product.findMany({
    where: { isBestSeller: true },
    include: { brand: true },
    take: 4,
  });

  return (
    <div>
      <Navbar />

      <div className={styles.homeBackground}>
        <img className={styles.wallpaperhome} src={wallapaperhome.src} alt="Pluteo logo" />
        <img className={styles.logolongimg} src={logolong.src} alt="Pluteo logo" />
        <Link href="/products" className={styles.goToShop}>SHOP</Link>

        <div className={styles.filterLinkBox}>
          <Link href="/products?gender=Men" className={styles.filterLink}>
            MEN&apos;S
          </Link>
          <Link href="/products?gender=Women" className={styles.filterLink}>
            WOMEN&apos;S
          </Link>
        </div>
      </div>

      <div className={styles.home2}>
        <div className={styles.brandBox}>
          <img className={styles.brandimage} src={lattafaimg.src} alt="Pluteo logo" />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Lattafa" className={styles.brandLink}>
            LATTAFA
          </Link>
        </div>

        <div className={styles.brandBox}>
          <div className={styles.categoryOverlay} />
          <img className={styles.brandimage} src={armafimg.src} alt="Pluteo logo" />
          <Link href="/products?brand=Armaf" className={styles.brandLink}>
            ARMAF
          </Link>
        </div>

        <div className={styles.brandBox}>
          <div className={styles.categoryOverlay} />
          <img className={styles.brandimage} src={frenchavenueimg.src} alt="Pluteo logo" />
          <Link href="/products?brand=French Avenue" className={styles.brandLink}>
            FRENCH AVENUE
          </Link>
        </div>
      </div>

      {featuredProducts.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>FEATURED PERFUMES</h2>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {bestSellers.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>BEST SELLERS</h2>
          <div className={styles.productsGrid}>
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
