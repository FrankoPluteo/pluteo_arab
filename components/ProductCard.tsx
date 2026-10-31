'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import { productCaptureAttributes, productProps, track } from '@/lib/analytics';
import StarRating from './StarRating';
import styles from '@/styles/productcard.module.css';
import giftBow from '../public/gift-bow.svg';

interface ProductCardProps {
  product: Product;
  /** Gift pages: tie a bow on the top-right corner of the image. */
  giftBow?: boolean;
  /** Where the card is shown, for analytics, e.g. "homepage-bestsellers" or "brand-lattafa". */
  list: string;
  /** 0-based index in that list. */
  position: number;
}

export default function ProductCard({ product, giftBow: showGiftBow = false, list, position }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const cartSessionId = useCart((state) => state.cartSessionId);
  const { t } = useLanguage();

  const finalPrice = product.price - product.discountAmount;
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountAmount > 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const [added, setAdded] = useState(false);
  const [outOfStock, setOutOfStock] = useState(isOutOfStock);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (outOfStock || added) return;

    const res = await fetch('/api/cart/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartSessionId, productId: product.id, delta: 1 }),
    });

    if (!res.ok) {
      setOutOfStock(true);
      return;
    }

    addItem(product);
    track('add_to_cart', { ...productProps(product), quantity: 1, source: 'card', list, position });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className={`${styles.productCard} ${outOfStock ? styles.outOfStock : ''} ${showGiftBow ? styles.giftCard : ''}`}
      {...productCaptureAttributes(product, list, position)}
    >
      {showGiftBow && (
        <Image src={giftBow} alt="" aria-hidden="true" className={styles.giftBow} />
      )}

      <Link href={`/products/${product.id}`} className={styles.productLink}>
        <div className={styles.productImage}>
          {product.images[0] ? (
            <div className={styles.productImageWrap}>
              <Image
                src={product.images[0]}
                alt={`${product.brand.name} ${product.name} – arapski parfem`}
                fill
                style={{ objectFit: 'contain' }}
                loading="lazy"
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
          ) : (
            <div className={styles.noImage}>{t.product.noImage}</div>
          )}

          {product.brand.logoUrl && (
            <div className={`${styles.brandLogo} ${showGiftBow ? styles.brandLogoBelowBow : ''}`}>
              {/* Keep plain <img> — brand logo URLs may be from any domain */}
              <img src={product.brand.logoUrl} alt={product.brand.name} loading="lazy" />
            </div>
          )}

          <div className={styles.badgeContainer}>
            {hasDiscount && !outOfStock && (
              <div className={styles.saleBadge}>{t.product.sale}</div>
            )}
          </div>

          {outOfStock && (
            <div className={styles.outOfStockBadge}>{t.product.outOfStock}</div>
          )}
        </div>

        <div className={styles.productInfo}>
          <p className={styles.productBrand}>{product.brand.name}</p>
          <h3 className={styles.productName}>{product.name}</h3>
          <p className={styles.productDetails}>
            {product.concentration} - {product.size}ml
          </p>

          {(product.reviewCount ?? 0) > 0 && (
            <div className={styles.productRating}>
              <StarRating rating={product.averageRating ?? 0} size="small" />
              <span className={styles.reviewCount}>({product.reviewCount})</span>
            </div>
          )}

          <div className={styles.productPricing}>
            {product.discountAmount > 0 && (
              <span className={styles.originalPrice}>€{product.price.toFixed(2)}</span>
            )}
            <span className={styles.finalPrice}>€{finalPrice.toFixed(2)}</span>
          </div>

          {isLowStock && !outOfStock && (
            <p className={styles.lowStockText}>{t.product.almostGone}</p>
          )}
        </div>
      </Link>

      <button
        className={`${styles.addToCartBtn} ${added ? styles.addedToCart : ''}`}
        onClick={handleAddToCart}
        disabled={outOfStock}
      >
        {outOfStock ? t.product.outOfStock : added ? t.product.addedToCart : t.product.addToCart}
      </button>
    </div>
  );
}
