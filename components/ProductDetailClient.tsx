'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import { productProps, track } from '@/lib/analytics';
import { SHOW_REVIEWS } from '@/lib/reviews';
import ReviewSummary from './ReviewSummary';
import BlackFridayDiscountBadge from './BlackFridayDiscountBadge'; // BLACK FRIDAY — remove after campaign
import styles from '@/styles/productdetails.module.css';

interface ProductDetailClientProps {
  product: Product;
}

// The phone slider (image inset 15%) and the desktop main image (inset 20%) use the same
// sizes, so the browser picks the same file for both and downloads the photo only once.
const PRODUCT_IMAGE_SIZES = '(max-width: 768px) 70vw, (max-width: 1024px) 60vw, 30vw';

// After an add the button reads "✓ Added" and stays locked this long. A customer unsure
// whether the first tap worked added the same perfume 5 times, then tapped − 9 times.
const ADDED_LOCK_MS = 2000;

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [addError, setAddError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const copyDiscountCode = async () => {
    try {
      await navigator.clipboard.writeText('PLUTEO10');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still visible to copy by hand
    }
  };

  const addItem = useCart((state) => state.addItem);
  const cartSessionId = useCart((state) => state.cartSessionId);
  const { t, language } = useLanguage();

  // Keyed on the id so moving between products client side counts each view once.
  useEffect(() => {
    track('product_viewed', productProps(product));
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalPrice = product.price - product.discountAmount;
  const hasDiscount = product.discountAmount > 0;
  const images = product.images && Array.isArray(product.images) ? product.images : [];
  const hasImages = images.length > 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isOutOfStock = product.stock === 0;

  const displayDescription =
  language === 'hr' && product.descriptionHr
    ? product.descriptionHr
    : product.description;

  const displayTopNotes =
    language === 'hr' && product.topNotesHr?.length
      ? product.topNotesHr
      : product.topNotes;

  const displayHeartNotes =
    language === 'hr' && product.heartNotesHr?.length
      ? product.heartNotesHr
      : product.heartNotes;

  const displayBaseNotes =
    language === 'hr' && product.baseNotesHr?.length
      ? product.baseNotesHr
      : product.baseNotes;

  const displayFragranceProfiles =
    language === 'hr' && product.fragranceProfilesHr?.length
      ? product.fragranceProfilesHr
      : product.fragranceProfiles;

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  async function handleAddToCart() {
    if (isAdding || justAdded) return;
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
      track('add_to_cart', { ...productProps(product), quantity: 1, source: 'product_page' });
      setJustAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setJustAdded(false), ADDED_LOCK_MS);
    } catch {
      // Network dropped or the reply wasn't JSON
      setAddError(t.product.couldNotAddToCart);
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
                      alt={`${product.brand?.name || ''} ${product.name} – arapski parfem, fotografija ${index + 1}`}
                      fill
                      style={{ objectFit: 'contain' }}
                      // The first photo is the largest paint on phones: fetch it right away.
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      sizes={PRODUCT_IMAGE_SIZES}
                    />
                  </div>
                  {/* BLACK FRIDAY — remove after campaign */}
                  <BlackFridayDiscountBadge price={product.price} discountAmount={product.discountAmount} size="detail" />
                </div>
              ))}
            </div>
          )}

          <div className={styles.mainImage}>
            {hasImages && images[selectedImage] ? (
              <div className={styles.mainImageWrap}>
                <Image
                  src={images[selectedImage]}
                  alt={`${product.brand?.name || ''} ${product.name} – ${product.concentration} ${product.size}ml arapski parfem`}
                  fill
                  style={{ objectFit: 'contain' }}
                  loading={selectedImage === 0 ? 'eager' : 'lazy'}
                  fetchPriority={selectedImage === 0 ? 'high' : 'auto'}
                  sizes={PRODUCT_IMAGE_SIZES}
                />
              </div>
            ) : (
              <div className={styles.noImage}>{t.product.noImageAvailable}</div>
            )}
            {/* BLACK FRIDAY — remove after campaign */}
            <BlackFridayDiscountBadge price={product.price} discountAmount={product.discountAmount} size="detail" />
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
                    alt={`${product.name} – prikaz ${index + 1}`}
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
            <div className={styles.productTitleRow}>
              <h1 className={styles.productName}>{product.name}</h1>
              {product.inspiration && (
                <span className={styles.inspiration}>
                  {t.product.inspiration}: {product.inspiration}
                </span>
              )}
            </div>
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

          <div className={styles.discountBanner}>
            <p className={styles.discountBannerText}>
              {t.product.promoCodeText} <strong>PLUTEO10</strong>
            </p>
            <button type="button" onClick={copyDiscountCode} className={styles.discountBannerCopy}>
              {codeCopied ? t.product.codeCopied : t.product.copyCode}
            </button>
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
            className={`${styles.addToCartButton} ${justAdded ? styles.addToCartAdded : ''}`}
            disabled={isOutOfStock || isAdding || justAdded}
            aria-live="polite"
          >
            {isOutOfStock
              ? t.product.outOfStock
              : isAdding
                ? t.product.adding
                : justAdded
                  ? t.product.addedToCart
                  : t.product.addToCart}
          </button>

          {(displayTopNotes?.length || displayHeartNotes?.length || displayBaseNotes?.length) && (
            <div className={styles.notesSection}>
              {displayTopNotes && displayTopNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>{t.product.topNotes}</h4>
                  <p>{displayTopNotes.join(', ')}</p>
                </div>
              )}
              {displayHeartNotes && displayHeartNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>{t.product.heartNotes}</h4>
                  <p>{displayHeartNotes.join(', ')}</p>
                </div>
              )}
              {displayBaseNotes && displayBaseNotes.length > 0 && (
                <div className={styles.noteGroup}>
                  <h4>{t.product.baseNotes}</h4>
                  <p>{displayBaseNotes.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.description}>
            <h3>{t.product.description}</h3>
            <p>{displayDescription}</p>
          </div>

          {displayFragranceProfiles && displayFragranceProfiles.length > 0 && (
            <div className={styles.description}>
              <h3>{t.product.fragranceProfile}</h3>
              <p>{displayFragranceProfiles.join(', ')}</p>
            </div>
          )}

          <div className={styles.productInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t.product.gender}</span>
              <span className={styles.infoValue}>{product.gender}</span>
            </div>
          </div>

          {SHOW_REVIEWS && (
            <ReviewSummary
              productId={product.id}
              initialAverage={product.averageRating}
              initialCount={product.reviewCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
