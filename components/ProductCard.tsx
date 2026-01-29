'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import styles from '@/styles/productcard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCart((state) => state.addItem);
  const finalPrice = product.price - product.discountAmount;

  return (
    <div className={styles.productCard}>
      <Link href={`/products/${product.id}`} className={styles.productLink}>
        <div className={styles.productImage}>
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} />
          ) : (
            <div className={styles.noImage}>No image</div>
          )}
          
          {/* Brand logo overlay */}
          {product.brand.logoUrl && (
            <div className={styles.brandLogo}>
              <img src={product.brand.logoUrl} alt={product.brand.name} />
            </div>
          )}
        </div>

        <div className={styles.productInfo}>
          <p className={styles.productBrand}>{product.brand.name}</p>
          <h3 className={styles.productName}>{product.name}</h3>
          <p className={styles.productDetails}>
            {product.concentration} - {product.size}ml
          </p>

          <div className={styles.productPricing}>
            {product.discountAmount > 0 && (
              <span className={styles.originalPrice}>${product.price}</span>
            )}
            <span className={styles.finalPrice}>${finalPrice}</span>
          </div>
        </div>
      </Link>

      <button
        className={styles.addToCartBtn}
        onClick={(e) => {
          e.preventDefault();
          addItem(product);
        }}
      >
        ADD TO CART
      </button>
    </div>
  );
}