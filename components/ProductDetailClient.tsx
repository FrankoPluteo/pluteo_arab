'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import styles from '@/styles/productdetails.module.css';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCart((state) => state.addItem);

  const finalPrice = product.price - product.discountAmount;
  const hasDiscount = product.discountAmount > 0;
  const images = product.images && Array.isArray(product.images) ? product.images : [];
  const hasImages = images.length > 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock === 0;

  return (
    <div className={styles.productContainer}>
      <div className={styles.productLayout}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          {/* Mobile Slider */}
          {hasImages && (
            <div className={styles.imageSlider}>
              {images.map((img, index) => (
                <div key={index} className={styles.slideImage}>
                  <img src={img} alt={`${product.brand?.name || ''} ${product.name} — Arabian perfume ${index + 1}`} />
                </div>
              ))}
            </div>
          )}

          {/* Desktop Main Image */}
          <div className={styles.mainImage}>
            {hasImages && images[selectedImage] ? (
              <img src={images[selectedImage]} alt={`${product.brand?.name || ''} ${product.name} — ${product.concentration} ${product.size}ml Arabian perfume`} />
            ) : (
              <div className={styles.noImage}>No image available</div>
            )}
          </div>

          {/* Desktop Thumbnails */}
          {hasImages && images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`${product.name} view ${index + 1}`} />
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
                Save {product.discountAmount.toFixed(2)} &euro;
              </span>
            )}
          </div>

          {isLowStock && (
            <div className={styles.lowStock}>
              <span className={styles.lowStockIcon}>&#9888;</span>
              <span className={styles.lowStockText}>
                Only {product.stock} left — almost gone!
              </span>
            </div>
          )}

          {isOutOfStock && (
            <div className={styles.outOfStockBanner}>
              Out of Stock
            </div>
          )}

          <button
            onClick={() => addItem(product)}
            className={styles.addToCartButton}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
          </button>

          {(product.topNotes?.length || product.heartNotes?.length || product.baseNotes?.length) && (
            <div className={styles.notesSection}>
              {product.topNotes && product.topNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>Top Notes</h4>
                  <p>{product.topNotes.join(', ')}</p>
                </div>
              )}
              {product.heartNotes && product.heartNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>Heart Notes</h4>
                  <p>{product.heartNotes.join(', ')}</p>
                </div>
              )}
              {product.baseNotes && product.baseNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>Base Notes</h4>
                  <p>{product.baseNotes.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.description}>
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {product.fragranceProfiles && product.fragranceProfiles.length > 0 && (
            <div className={styles.description}>
              <h3>Fragrance Profile</h3>
              <p>{product.fragranceProfiles.join(', ')}</p>
            </div>
          )}

          <div className={styles.productInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Gender</span>
              <span className={styles.infoValue}>{product.gender}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
