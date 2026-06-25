'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/home.module.css';
import logolong from '../public/Pluteo Logo Long.svg';
import lattafaimg from '../public/lattafa.webp';
import ahmedimg from '../public/ahmedalmaghribi.webp';
import frenchavenueimg from '../public/frenchavenue.webp';
import armafimg from '../public/armaf.webp';
import wallpaperhome from '../public/homewallpapertest.webp';

interface HomeContentProps {
  featuredProducts: Product[];
  bestSellers: Product[];
}

export default function HomeContent({ featuredProducts, bestSellers }: HomeContentProps) {
  const { t } = useLanguage();

  const spotlightProduct = bestSellers[0] ?? null;

  useEffect(() => {
    const els = document.querySelectorAll('[data-fade]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <Image
            fill
            src={wallpaperhome}
            alt="Premium arabijski parfemi i oud mirisi – Pluteo Hrvatska"
            priority
            quality={70}
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className={styles.heroOverlay} />
        <h1 className="sr-only">Pluteo — Premium Arabian Perfumes &amp; Oud Fragrances in Croatia</h1>

        <div className={styles.heroContent}>
          <Image
            className={styles.heroLogo}
            src={logolong}
            alt="Pluteo — arabijska parfumerija, Hrvatska"
            width={493}
            height={310}
            priority
          />
          <div className={styles.heroRule} />
          <p className={styles.heroTagline}>{t.home.tagline1}</p>
          <p className={styles.heroTagline2}>{t.home.tagline2}</p>
          <Link href="/products" className={styles.heroCta}>{t.home.shop}</Link>
        </div>
      </section>

      {/* ── Category strip ───────────────────────────────── */}
      <nav className={styles.categoryStrip} data-fade>
        <Link href="/products?gender=male" className={styles.categoryLink}>
          {t.home.mensPerfumes}
        </Link>
        <Link href="/products?gender=female" className={styles.categoryLink}>
          {t.home.womensPerfumes}
        </Link>
      </nav>

      {/* ── Bestseller spotlight ─────────────────────────── */}
      {spotlightProduct && spotlightProduct.images[0] && (
        <section className={styles.spotlight} data-fade>
          <Link
            href={`/products/${spotlightProduct.id}`}
            className={styles.spotlightImageCol}
            aria-label={spotlightProduct.name}
          >
            <div className={styles.spotlightImageWrap}>
              <Image
                src={spotlightProduct.images[0]}
                alt={`${spotlightProduct.brand.name} ${spotlightProduct.name} – arabijski parfem`}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </div>
          </Link>
          <div className={styles.spotlightContent}>
            <p className={styles.spotlightLabel}>{t.home.spotlightLabel}</p>
            <h2 className={styles.spotlightName}>{spotlightProduct.name}</h2>
            <p className={styles.spotlightBrand}>{spotlightProduct.brand.name}</p>
            <p className={styles.spotlightDetails}>
              {spotlightProduct.concentration} · {spotlightProduct.size}ml
            </p>
            <p className={styles.spotlightPrice}>
              €{(spotlightProduct.price - spotlightProduct.discountAmount).toFixed(2)}
            </p>
            <Link href={`/products/${spotlightProduct.id}`} className={styles.spotlightCta}>
              {t.home.spotlightCta}
            </Link>
          </div>
        </section>
      )}

      {/* ── Featured products ────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className={styles.section} data-fade>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{t.home.featuredTitle}</span>
            <Link href="/products" className={styles.sectionViewAll}>{t.home.viewAll}</Link>
          </div>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Brand panels ─────────────────────────────────── */}
      <div className={styles.brandSection} data-fade>
        {[
          { src: lattafaimg, alt: 'Lattafa parfemi – luksuzni arabijski mirisi', name: 'Lattafa', href: '/products?brand=Lattafa' },
          { src: armafimg, alt: 'Armaf parfemi – premium orijentalni mirisi', name: 'Armaf', href: '/products?brand=Armaf' },
          { src: frenchavenueimg, alt: 'French Avenue parfemi – moderni luksuzni mirisi', name: 'French Avenue', href: '/products?brand=French+Avenue' },
          { src: ahmedimg, alt: 'Ahmed Al Maghribi parfemi – luksuzni orijentalni mirisi', name: 'Ahmed Al Maghribi', href: '/products?brand=Ahmed+Al+Maghribi' },
        ].map((brand) => (
          <div key={brand.name} className={styles.brandBox}>
            <div className={styles.brandBoxImage}>
              <Image
                fill
                src={brand.src}
                alt={brand.alt}
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 50vw, 50vw"
              />
            </div>
            <Link href={brand.href} className={styles.brandLink}>
              <span className={styles.brandLinkName}>{brand.name}</span>
              <span className={styles.brandLinkLine} />
            </Link>
          </div>
        ))}
      </div>

      {/* ── Best sellers ─────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className={styles.section} data-fade>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{t.home.bestSellers}</span>
            <Link href="/products" className={styles.sectionViewAll}>{t.home.viewAll}</Link>
          </div>
          <div className={styles.productsGrid}>
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
