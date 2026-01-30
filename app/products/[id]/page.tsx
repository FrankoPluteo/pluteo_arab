'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import Navbar from '@/components/Navbar';
import styles from '@/styles/productdetails.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading product:', err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className={styles.productContainer}>Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <Navbar />
        <div className={styles.productContainer}>Product not found</div>
      </div>
    );
  }

  const finalPrice = product.price - product.discountAmount;
  const hasDiscount = product.discountAmount > 0;
  const images = product.images && Array.isArray(product.images) ? product.images : [];
  const hasImages = images.length > 0;

  return (
    <div>
      <Navbar />

      <div className={styles.productContainer}>
        <div className={styles.productLayout}>
          {/* Image Section */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {hasImages && images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name} />
              ) : (
                <div className={styles.noImage}>No image available</div>
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
                    <img src={img} alt={`${product.name} ${index + 1}`} />
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
                <span className={styles.originalPrice}>${product.price}</span>
              )}
              <span className={styles.finalPrice}>${finalPrice}</span>
              {hasDiscount && (
                <span className={styles.discount}>
                  Save ${product.discountAmount}
                </span>
              )}
            </div>

            <button
              onClick={() => addItem(product)}
              className={styles.addToCartButton}
            >
              ADD TO CART
            </button>

            {product.fragranceProfiles && product.fragranceProfiles.length > 0 && (
              <div className={styles.description}>
                <h3>Fragrance Profile</h3>
                <p>{product.fragranceProfiles.join(', ')}</p>
              </div>
            )}

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

            <div className={styles.productInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Gender</span>
                <span className={styles.infoValue}>{product.gender}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Stock</span>
                <span className={styles.infoValue}>{product.stock || 0} units available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}