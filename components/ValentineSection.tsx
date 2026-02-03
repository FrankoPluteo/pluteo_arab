'use client';

import { useState } from 'react';
import { VALENTINE_PACKS, ValentinePack } from '@/lib/valentinePacks';
import { useCart } from '@/lib/store';
import styles from '@/styles/valentine.module.css';

export default function ValentineSection() {
  const [selectedPack, setSelectedPack] = useState<ValentinePack | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const addItem = useCart((state) => state.addItem);

  const handleAddPackToCart = async (pack: ValentinePack) => {
    setLoading(pack.id);
    
    try {
      // Fetch both products
      const [himProduct, herProduct] = await Promise.all([
        fetch(`/api/products/${pack.himId}`).then(r => r.json()),
        fetch(`/api/products/${pack.herId}`).then(r => r.json()),
      ]);

      // Check if both products exist
      if (!himProduct || !herProduct) {
        alert('One or both products in this pack are currently unavailable.');
        setLoading(null);
        return;
      }

      // Check stock
      if (himProduct.stock <= 0 || herProduct.stock <= 0) {
        alert('One or both products in this pack are out of stock.');
        setLoading(null);
        return;
      }

      // Apply discount to both products
      const discountedHim = {
        ...himProduct,
        discountAmount: himProduct.discountAmount + (pack.discount / 2),
      };
      const discountedHer = {
        ...herProduct,
        discountAmount: herProduct.discountAmount + (pack.discount / 2),
      };

      // Add both to cart
      addItem(discountedHim);
      addItem(discountedHer);

      alert(`✨ Valentine's Pack added to cart!\nYou saved €${pack.discount}!`);
    } catch (error) {
      console.error('Error adding pack:', error);
      alert('Failed to add pack to cart. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.valentineWrapper}>
      <div className={styles.valentineHeader}>
        <h2 className={styles.valentineTitle}>
          💝 In Sync
        </h2>
        <p className={styles.valentineSubtitle}>
          Perfectly Paired, In Sync: For Her & For Him
        </p>
        <p className={styles.valentineSave}>
          Save €10 on every pair
        </p>
      </div>

      <div className={styles.packsGrid}>
        {VALENTINE_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`${styles.packCard} ${selectedPack?.id === pack.id ? styles.packCardActive : ''}`}
            onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
          >
            <div className={styles.packHeader}>
              <h3 className={styles.packTitle}>{pack.title}</h3>
              <p className={styles.packSubtitle}>{pack.subtitle}</p>
            </div>

            <div className={styles.packNames}>
              <div className={styles.packPerson}>
                <span className={styles.packLabel}>For Him</span>
                <span className={styles.packName}>{pack.himName}</span>
              </div>
              <div className={styles.packDivider}>💕</div>
              <div className={styles.packPerson}>
                <span className={styles.packLabel}>For Her</span>
                <span className={styles.packName}>{pack.herName}</span>
              </div>
            </div>

            <div className={styles.packSavings}>
              <span className={styles.savingsBadge}>You save €{pack.discount}</span>
            </div>

            {selectedPack?.id === pack.id && (
              <div className={styles.packDescription}>
                <p>{pack.description}</p>
              </div>
            )}

            <button
              className={styles.packButton}
              onClick={(e) => {
                e.stopPropagation();
                handleAddPackToCart(pack);
              }}
              disabled={loading === pack.id}
            >
              {loading === pack.id ? 'Adding...' : 'Add Pack to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
