import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import LjetoClient from './LjetoClient';
import styles from '@/styles/ljeto.module.css';

export const metadata: Metadata = {
  title: 'Ljetna kampanja — 15% popusta | Pluteo',
  description: 'Pronađi svoj ljetni miris. Upiši email i dobij 15% popusta na prvu narudžbu u Pluteo parfumeriji.',
  robots: { index: false, follow: false },
};

// Campaign: Mon 19 May 2026 17:00 CEST → Mon 2 Jun 2026 17:00 CEST (= 15:00 UTC)
const CAMPAIGN_ENDS_AT = '2026-06-02T15:00:00.000Z';
const FALLBACK_ENDS_AT = CAMPAIGN_ENDS_AT;
const CAMPAIGN_PRODUCTS = ['Club de Nuit Woman', 'The Kingdom For Women', 'Yara'];

export default async function LjetoPage() {
  const [promo, products] = await Promise.all([
    prisma.promoCode.findUnique({ where: { code: 'LJETO15' } }),
    prisma.product.findMany({
      where: { name: { in: CAMPAIGN_PRODUCTS } },
      include: { brand: true },
      take: 3,
    }),
  ]);

  const promoEndsAt = promo?.endsAt?.toISOString() ?? FALLBACK_ENDS_AT;

  // Sort products to match the requested order.
  const sortedProducts = CAMPAIGN_PRODUCTS
    .map((name) => products.find((p) => p.name === name))
    .filter(Boolean) as typeof products;

  return (
    <div className={styles.page}>
      {/* Logo */}
      <div className={styles.logoBar}>
        <Link href="/">
          <Image
            src="/Pluteo Logo Long.svg"
            alt="Pluteo"
            width={160}
            height={44}
            className={styles.logoImg}
            priority
          />
        </Link>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.headline}>Pronađi svoj ljetni miris</h1>
        <p className={styles.subheadline}>
          Upiši email i dobij 15% popusta na prvu narudžbu
        </p>

        {/* Client part: countdown + email form */}
        <Suspense fallback={null}>
          <LjetoClient promoEndsAt={promoEndsAt} />
        </Suspense>
      </section>

      <div className={styles.divider} />

      {/* Featured products */}
      {sortedProducts.length > 0 && (
        <section className={styles.productsSection}>
          <p className={styles.productsSectionTitle}>Ljetni favoriti</p>
          <div className={styles.productsGrid}>
            {sortedProducts.map((product) => {
              const finalPrice = product.price - product.discountAmount;
              return (
                <article key={product.id}>
                  <Link href={`/products/${product.id}`} className={styles.productCard}>
                    <div className={styles.productImageWrap}>
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={`${product.brand.name} ${product.name}`}
                          fill
                          className={styles.productImg}
                          sizes="(max-width: 640px) 90vw, (max-width: 960px) 45vw, 30vw"
                        />
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <p className={styles.productBrand}>{product.brand.name}</p>
                      <p className={styles.productName}>{product.name}</p>
                      <p className={styles.productPrice}>€{finalPrice.toFixed(2)}</p>
                    </div>
                  </Link>
                  <Link href={`/products/${product.id}`} className={styles.productCta}>
                    Pogledaj miris
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
