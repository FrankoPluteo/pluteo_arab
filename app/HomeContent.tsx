'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import BrandLogoTrack, { TrackBrand } from '@/components/BrandLogoTrack';
import BlackFridayTape from '@/components/BlackFridayTape'; // BLACK FRIDAY — remove after campaign
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/home.module.css';
import logolong from '../public/Pluteo Logo Long.svg';
import wallpaperhome from '../public/homewallpapertest.webp';
import giftBow from '../public/gift-ribbon-bow.svg';
import signatureBg from '../public/signaturebg.png';

interface HomeContentProps {
  featuredProducts: Product[];
  bestSellers: Product[];
  /** Brands with a logo, for the swipeable logo track. */
  logoBrands: TrackBrand[];
}

export default function HomeContent({ featuredProducts, bestSellers, logoBrands }: HomeContentProps) {
  const { t } = useLanguage();

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
        <h1 className="sr-only">Pluteo - arapski parfemi i oud mirisi u Hrvatskoj</h1>

        <div className={styles.heroMedia}>
          <div className={styles.heroImage}>
            <Image
              fill
              src={wallpaperhome}
              alt="Arapski parfemi i oud mirisi - Pluteo Hrvatska"
              priority
              quality={70}
              // Zoomed 1.35x on phones (see .heroImage), so fetch a wider image to stay sharp
              sizes="(max-width: 768px) 135vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className={styles.heroOverlay} />
          <BlackFridayTape placement="hero" /> {/* BLACK FRIDAY — remove after campaign */}

          <div className={styles.heroContent}>
            <Image
              className={styles.heroLogo}
              src={logolong}
              alt="Pluteo - arapska parfumerija, Hrvatska"
              width={493}
              height={310}
              priority
            />
            <div className={styles.heroRule} />
            <Link href="/products" className={styles.heroCta}>{t.home.shop}</Link>
          </div>
        </div>

        {/* Gift panel — right half on desktop, below the image on mobile */}
        <nav className={styles.giftPanel} aria-label={t.home.giftLabel}>
          {[
            { href: '/poklon/za-nju', label: t.home.giftForHer },
            { href: '/poklon/za-njega', label: t.home.giftForHim },
          ].map((gift) => (
            <Link key={gift.href} href={gift.href} className={styles.giftLink}>
              <span className={styles.giftTitle}>
                {t.home.giftLabel}
                <br />
                {gift.label}
              </span>
              <span className={styles.giftMore} aria-hidden="true">
                {t.home.giftCta}
                <span className={styles.giftArrow} />
              </span>
            </Link>
          ))}
          <BlackFridayTape placement="gift" /> {/* BLACK FRIDAY — remove after campaign */}
          <div className={styles.giftRibbon} aria-hidden="true">
            <span className={styles.giftStripV} />
            <span className={styles.giftStripH} />
            <Image src={giftBow} alt="" className={styles.giftRibbonImage} priority />
          </div>
        </nav>
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

      {/* ── Brand logo track ─────────────────────────────── */}
      <BrandLogoTrack brands={logoBrands} />

      {/* ── Best sellers ─────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className={styles.section} data-fade>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{t.home.bestSellers}</span>
            <Link href="/products" className={styles.sectionViewAll}>{t.home.viewAll}</Link>
          </div>
          <div className={styles.productsGrid}>
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} list="homepage-bestsellers" position={index} />
            ))}
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
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} list="homepage-featured" position={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── Find your signature scent (AI recommendation) ── */}
      <section className={styles.scentCta} data-fade>
        <div className={styles.scentCtaMedia} aria-hidden="true">
          <Image
            fill
            src={signatureBg}
            alt=""
            // Full width on phones, an 880px box on desktop (see .scentCtaMedia)
            sizes="(min-width: 900px) 880px, 100vw"
            quality={70}
            placeholder="blur"
            className={styles.scentCtaImage}
          />
        </div>
        <div className={styles.scentCtaOverlay} aria-hidden="true" />
        <div className={styles.scentCtaInner}>
          <p className={styles.scentCtaLabel}>{t.home.scentCtaLabel}</p>
          <h2 className={styles.scentCtaTitle}>{t.home.scentCtaTitle}</h2>
          <p className={styles.scentCtaText}>{t.home.scentCtaText}</p>
          <Link href="/find-your-scent" className={styles.scentCtaBtn}>
            {t.home.scentCtaBtn}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
