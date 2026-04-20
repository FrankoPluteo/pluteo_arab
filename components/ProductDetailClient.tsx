'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import ReviewSummary from './ReviewSummary';
import styles from '@/styles/productdetails.module.css';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const addItem = useCart((state) => state.addItem);
  const cartSessionId = useCart((state) => state.cartSessionId);
  const { t } = useLanguage();

  const finalPrice = product.price - product.discountAmount;
  const hasDiscount = product.discountAmount > 0;
  const images = product.images && Array.isArray(product.images) ? product.images : [];
  const hasImages = images.length > 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock === 0;

  async function handleAddToCart() {
    setAddError('');
    setIsAdding(true);
    try {
      const res = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartSessionId, productId: product.id, delta: 1 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAddError(data.error || t.product.couldNotAddToCart);
        return;
      }

      addItem(product);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className={styles.productContainer}>
      <div className={styles.productLayout}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          {hasImages && (
            <div className={styles.imageSlider}>
              {images.map((img, index) => (
                <div key={index} className={styles.slideImage}>
                  <div className={styles.slideImageWrap}>
                    <Image
                      src={img}
                      alt={`${product.brand?.name || ''} ${product.name} — Arabian perfume ${index + 1}`}
                      fill
                      style={{ objectFit: 'contain' }}
                      loading="lazy"
                      sizes="100vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.mainImage}>
            {hasImages && images[selectedImage] ? (
              <div className={styles.mainImageWrap}>
                <Image
                  src={images[selectedImage]}
                  alt={`${product.brand?.name || ''} ${product.name} — ${product.concentration} ${product.size}ml Arabian perfume`}
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className={styles.noImage}>{t.product.noImageAvailable}</div>
            )}
          </div>

          {hasImages && images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className={styles.detailsSection}>
          <div>
            <div className={styles.brandHeader}>
              {product.brand?.logoUrl && (
                <div className={styles.brandLogoContainer}>
                  {/* Keep plain <img> — brand logo URLs may be from any domain */}
                  <img
                    src={product.brand.logoUrl}
                    alt={product.brand.name}
                    className={styles.brandLogoImage}
                  />
                </div>
              )}
              <p className={styles.brandName}>{product.brand?.name || 'Unknown Brand'}</p>
            </div>
            <h1 className={styles.productName}>{product.name}</h1>
            <p className={styles.productMeta}>
              {product.concentration} • {product.size}ml • {product.gender}
            </p>
          </div>

          <div className={styles.priceSection}>
            {hasDiscount && (
              <span className={styles.originalPrice}>{product.price.toFixed(2)} &euro;</span>
            )}
            <span className={styles.finalPrice}>{finalPrice.toFixed(2)} &euro;</span>
            {hasDiscount && (
              <span className={styles.discount}>
                {t.product.save} {product.discountAmount.toFixed(2)} &euro;
              </span>
            )}
          </div>

          {isLowStock && (
            <div className={styles.lowStock}>
              <span className={styles.lowStockIcon}>&#9888;</span>
              <span className={styles.lowStockText}>
                {t.product.lowStockMessage(product.stock)}
              </span>
            </div>
          )}

          {isOutOfStock && (
            <div className={styles.outOfStockBanner}>{t.product.outOfStockBanner}</div>
          )}

          {addError && (
            <p style={{ color: '#e63946', fontSize: '14px', marginTop: '8px' }}>{addError}</p>
          )}

          <button
            onClick={handleAddToCart}
            className={styles.addToCartButton}
            disabled={isOutOfStock || isAdding}
          >
            {isOutOfStock ? t.product.outOfStock : isAdding ? t.product.adding : t.product.addToCart}
          </button>

          {(product.topNotes?.length || product.heartNotes?.length || product.baseNotes?.length) && (
            <div className={styles.notesSection}>
              {product.topNotes && product.topNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>{t.product.topNotes}</h4>
                  <p>{product.topNotes.join(', ')}</p>
                </div>
              )}
              {product.heartNotes && product.heartNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>{t.product.heartNotes}</h4>
                  <p>{product.heartNotes.join(', ')}</p>
                </div>
              )}
              {product.baseNotes && product.baseNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>{t.product.baseNotes}</h4>
                  <p>{product.baseNotes.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.description}>
            <h3>{t.product.description}</h3>
            <p>{product.description}</p>
          </div>

          {product.fragranceProfiles && product.fragranceProfiles.length > 0 && (
            <div className={styles.description}>
              <h3>{t.product.fragranceProfile}</h3>
              <p>{product.fragranceProfiles.join(', ')}</p>
            </div>
          )}

          <div className={styles.productInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t.product.gender}</span>
              <span className={styles.infoValue}>{product.gender}</span>
            </div>
          </div>

          <ReviewSummary productId={product.id} />
        </div>
      </div>
    </div>
  );
}
