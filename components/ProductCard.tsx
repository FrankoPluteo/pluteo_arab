'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import { productCaptureAttributes, productProps, track } from '@/lib/analytics';
import { SHOW_REVIEWS } from '@/lib/reviews';
import { productPath } from '@/lib/urls';
import StarRating from './StarRating';
import BlackFridayTape from './BlackFridayTape'; // BLACK FRIDAY — remove after campaign
import BlackFridayDiscountBadge from './BlackFridayDiscountBadge'; // BLACK FRIDAY — remove after campaign
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
  /**
   * Cards in the first visible row: load the image right away instead of lazily, since one
   * of them is usually the page's largest paint (LCP).
   */
  eager?: boolean;
  /**
   * The one card whose image gets fetchPriority="high" (the first card of a page). Only one
   * per page, so it doesn't compete with the rest of the first row.
   */
  priority?: boolean;
  /** The image's rendered width per breakpoint, matching the grid the card sits in. */
  sizes?: string;
}

// Phones show two cards per row and the image is inset 10% inside its card.
const DEFAULT_SIZES = '(max-width: 768px) 45vw, (max-width: 1200px) 30vw, 25vw';

export default function ProductCard({
  product,
  giftBow: showGiftBow = false,
  list,
  position,
  eager = false,
  priority = false,
  sizes = DEFAULT_SIZES,
}: ProductCardProps) {
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

    let res: Response;
    try {
      res = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartSessionId, productId: product.id, delta: 1 }),
      });
    } catch {
      // Network dropped: nothing was reserved, so leave the button as it was for another try.
      return;
    }

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

      <Link href={productPath(product)} className={styles.productLink}>
        <div className={styles.productImage}>
          {product.images[0] ? (
            <div className={styles.productImageWrap}>
              <Image
                src={product.images[0]}
                alt={`${product.brand.name} ${product.name} – arapski parfem`}
                fill
                style={{ objectFit: 'contain' }}
                loading={eager || priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                sizes={sizes}
              />
            </div>
          ) : (
            <div className={styles.noImage}>{t.product.noImage}</div>
          )}

          <BlackFridayTape placement="card" /> {/* BLACK FRIDAY — remove after campaign */}
          {!outOfStock && ( /* BLACK FRIDAY — remove after campaign */
            <BlackFridayDiscountBadge price={product.price} discountAmount={product.discountAmount} size="card" />
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

          {SHOW_REVIEWS && (product.reviewCount ?? 0) > 0 && (
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
