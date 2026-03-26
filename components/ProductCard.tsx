'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import StarRating from './StarRating';
import styles from '@/styles/productcard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const cartSessionId = useCart((state) => state.cartSessionId);

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
      // Stock was taken between page load and click
      setOutOfStock(true);
      return;
    }

    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className={`${styles.productCard} ${outOfStock ? styles.outOfStock : ''}`}>
      <Link href={`/products/${product.id}`} className={styles.productLink}>
        <div className={styles.productImage}>
          {product.images[0] ? (
            <div className={styles.productImageWrap}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                style={{ objectFit: 'contain' }}
                loading="lazy"
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
          ) : (
            <div className={styles.noImage}>No image</div>
          )}

          {product.brand.logoUrl && (
            <div className={styles.brandLogo}>
              {/* Keep plain <img> — brand logo URLs may be from any domain */}
              <img src={product.brand.logoUrl} alt={product.brand.name} loading="lazy" />
            </div>
          )}

          <div className={styles.badgeContainer}>
            {hasDiscount && !outOfStock && (
              <div className={styles.saleBadge}>SALE</div>
            )}
            {isLowStock && !outOfStock && (
              <div className={styles.lowStockBadge}>ALMOST GONE</div>
            )}
          </div>

          {outOfStock && (
            <div className={styles.outOfStockBadge}>OUT OF STOCK</div>
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
        </div>
      </Link>

      <button
        className={`${styles.addToCartBtn} ${added ? styles.addedToCart : ''}`}
        onClick={handleAddToCart}
        disabled={outOfStock}
      >
        {outOfStock ? 'OUT OF STOCK' : added ? 'ADDED TO CART' : 'ADD TO CART'}
      </button>
    </div>
  );
}
