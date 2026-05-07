'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/home.module.css';
import logolong from '../public/Pluteo Logo Long.svg';
import lattafaimg from '../public/lattafa.webp';
import frenchavenueimg from '../public/frenchavenue.webp';
import armafimg from '../public/armaf.webp';
import wallpaperhome from '../public/wallpaperhome.webp';

interface HomeContentProps {
  featuredProducts: Product[];
  bestSellers: Product[];
}

export default function HomeContent({ featuredProducts, bestSellers }: HomeContentProps) {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero */}
      <div className={styles.homeBackground}>
        <Image
          fill
          src={wallpaperhome}
          alt="Premium Arabian perfumes and oud fragrances — Pluteo Croatia"
          priority
          quality={65}
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          className={styles.wallpaperhome}
        />
        <h1 className="sr-only">Pluteo — Premium Arabian Perfumes &amp; Oud Fragrances in Croatia</h1>
        <Image
          className={styles.logolongimg}
          src={logolong}
          alt="Pluteo — Arabian Perfume Shop Croatia"
          width={493}
          height={310}
          priority
        />
        <Link href="/products" className={styles.goToShop}>{t.home.shop}</Link>

        <div className={styles.taglines}>
          <span className={styles.tagline}>{t.home.tagline1}</span>
          <span className={styles.taglineDot}>&middot;</span>
          <span className={styles.tagline}>{t.home.tagline2}</span>
          <span className={styles.taglineDot}>&middot;</span>
          <span className={styles.tagline}>{t.home.tagline3}</span>
        </div>

        <div className={styles.filterLinkBox}>
          <Link href="/products?gender=male" className={styles.filterLink}>
            {t.home.mensPerfumes}
          </Link>
          <Link href="/products?gender=female" className={styles.filterLink}>
            {t.home.womensPerfumes}
          </Link>
        </div>
      </div>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>{t.home.featuredTitle}</h2>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Brand panels */}
      <div className={styles.brandSection}>
        <div className={styles.brandBox}>
          <Image
            fill
            src={lattafaimg}
            alt="Lattafa perfumes — luxury Arabian fragrances"
            style={{ objectFit: 'cover', filter: 'brightness(0.5)' }}
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Lattafa" className={styles.brandLink}>LATTAFA</Link>
        </div>

        <div className={styles.brandBox}>
          <Image
            fill
            src={armafimg}
            alt="Armaf perfumes — premium oriental fragrances"
            style={{ objectFit: 'cover', filter: 'brightness(0.5)' }}
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Armaf" className={styles.brandLink}>ARMAF</Link>
        </div>

        <div className={styles.brandBox}>
          <Image
            fill
            src={frenchavenueimg}
            alt="French Avenue perfumes — modern luxury scents"
            style={{ objectFit: 'cover', filter: 'brightness(0.5)' }}
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=French Avenue" className={styles.brandLink}>FRENCH AVENUE</Link>
        </div>

        <div className={styles.brandBox}>
          <div className={styles.categoryOverlay} />
          <Link href="/products?brand=Ahmed Al Maghribi" className={styles.brandLink}>AHMED AL MAGHRIBI</Link>
        </div>
      </div>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <div className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>{t.home.bestSellers}</h2>
          <div className={styles.productsGrid}>
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
