'use client';

import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/poklon.module.css';

interface PoklonContentProps {
  recipient: 'her' | 'him';
  products: Product[];
}

export default function PoklonContent({ recipient, products }: PoklonContentProps) {
  const { t } = useLanguage();
  const forHer = recipient === 'her';

  const gender = forHer ? 'female' : 'male';
  const otherHref = forHer ? '/poklon/za-njega' : '/poklon/za-nju';

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {t.gift.label} {forHer ? t.gift.forHer : t.gift.forHim}
          </h1>
          <p className={styles.intro}>{forHer ? t.gift.introHer : t.gift.introHim}</p>
        </header>

        {/* ── Gift selection ─────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{t.gift.count(products.length)}</span>
            <Link href={otherHref} className={styles.switchLink}>
              {forHer ? t.gift.switchToHim : t.gift.switchToHer}
              <span className={styles.switchArrow} aria-hidden="true" />
            </Link>
          </div>

          {products.length > 0 ? (
            <div className={styles.productsGrid}>
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  giftBow
                  list={forHer ? 'gift-her' : 'gift-him'}
                  position={index}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyText}>{t.gift.empty}</p>
              <Link href={`/products?gender=${gender}`} className={styles.emptyCta}>
                {t.gift.browseAll}
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
