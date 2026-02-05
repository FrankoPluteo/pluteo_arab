'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VALENTINE_PACKS, ValentinePack } from '@/lib/valentinePacks';
import { useCart } from '@/lib/store';
import { Product } from '@/types';
import styles from '@/styles/valentine.module.css';
import valentineswallpaper from '../public/valentineswallpaper.jpg';

interface PackProducts {
  him: Product | null;
  her: Product | null;
}

export default function ValentineSection() {
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [packProducts, setPackProducts] = useState<Record<string, PackProducts>>({});
  const [fetching, setFetching] = useState(true);
  const addPackItems = useCart((state) => state.addPackItems);
  const items = useCart((state) => state.items);

  useEffect(() => {
    const fetchAllPackProducts = async () => {
      setFetching(true);
      const productIds = new Set<string>();
      VALENTINE_PACKS.forEach((pack) => {
        productIds.add(pack.himId);
        productIds.add(pack.herId);
      });

      const productMap: Record<string, Product> = {};
      await Promise.all(
        Array.from(productIds).map(async (id) => {
          try {
            const res = await fetch(`/api/products/${id}`);
            if (res.ok) {
              productMap[id] = await res.json();
            }
          } catch {
            // Product unavailable
          }
        })
      );

      const result: Record<string, PackProducts> = {};
      VALENTINE_PACKS.forEach((pack) => {
        result[pack.id] = {
          him: productMap[pack.himId] || null,
          her: productMap[pack.herId] || null,
        };
      });
      setPackProducts(result);
      setFetching(false);
    };

    fetchAllPackProducts();
  }, []);

  const isPackInCart = (packId: string) => {
    return items.some((item) => item.valentinePackId === packId);
  };

  const handleAddPackToCart = async (pack: ValentinePack) => {
    if (isPackInCart(pack.id)) {
      alert('This pack is already in your cart.');
      return;
    }

    setLoading(pack.id);

    try {
      const products = packProducts[pack.id];
      if (!products?.him || !products?.her) {
        alert('One or both products in this pack are currently unavailable.');
        setLoading(null);
        return;
      }

      if (products.him.stock <= 0 || products.her.stock <= 0) {
        alert('One or both products in this pack are out of stock.');
        setLoading(null);
        return;
      }

      addPackItems(products.him, products.her, pack.id, pack.discount);
    } catch (error) {
      console.error('Error adding pack:', error);
      alert('Failed to add pack to cart. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handlePackClick = (packId: string) => {
    setExpandedPackId(expandedPackId === packId ? null : packId);
  };

  return (
    <div className={styles.valentineWrapper}>
      <img 
            src={valentineswallpaper.src} 
            alt="" 
            className={styles.backgroundImage}
          />
          <div className={styles.valentineHeader}>
        <h2 className={styles.valentineTitle}>
          In Sync 
        </h2>
        <p className={styles.valentineSubtitle}>
          Perfectly Paired, In Sync: For Him & For Her
        </p>
        <p className={styles.valentineSave}>
          Save €10 on every pair
        </p>
      </div>

      <div className={styles.packsGrid}>
        {VALENTINE_PACKS.map((pack) => {
          const products = packProducts[pack.id];
          const inCart = isPackInCart(pack.id);
          const isExpanded = expandedPackId === pack.id;

          return (
            <div
              key={pack.id}
              className={`${styles.packCard} ${isExpanded ? styles.packCardActive : ''}`}
              onClick={() => handlePackClick(pack.id)}
            >
              <div className={styles.packHeader}>
                <h3 className={styles.packTitle}>{pack.title}</h3>
                <p className={styles.packSubtitle}>{pack.subtitle}</p>
              </div>

              <div className={styles.packImages}>
                <div className={styles.packImageWrapper}>
                  <span className={styles.packLabel}>For Him</span>
                  {fetching ? (
                    <div className={styles.packImagePlaceholder} />
                  ) : products?.him ? (
                    <Link
                      href={`/products/${products.him.id}`}
                      className={styles.packProductLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {products.him.images[0] ? (
                        <img
                          src={products.him.images[0]}
                          alt={pack.himName}
                          className={styles.packImage}
                        />
                      ) : (
                        <div className={styles.packImagePlaceholder} />
                      )}
                    </Link>
                  ) : (
                    <div className={styles.packImagePlaceholder} />
                  )}
                  {!fetching && products?.him ? (
                    <Link
                      href={`/products/${products.him.id}`}
                      className={styles.packNameLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pack.himName}
                    </Link>
                  ) : (
                    <span className={styles.packName}>{pack.himName}</span>
                  )}
                  {!fetching && products?.him && (
                    <span className={styles.packPrice}>€{products.him.price.toFixed(2)}</span>
                  )}
                </div>
                <div className={styles.packDivider}>+</div>
                <div className={styles.packImageWrapper}>
                  <span className={styles.packLabel}>For Her</span>
                  {fetching ? (
                    <div className={styles.packImagePlaceholder} />
                  ) : products?.her ? (
                    <Link
                      href={`/products/${products.her.id}`}
                      className={styles.packProductLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {products.her.images[0] ? (
                        <img
                          src={products.her.images[0]}
                          alt={pack.herName}
                          className={styles.packImage}
                        />
                      ) : (
                        <div className={styles.packImagePlaceholder} />
                      )}
                    </Link>
                  ) : (
                    <div className={styles.packImagePlaceholder} />
                  )}
                  {!fetching && products?.her ? (
                    <Link
                      href={`/products/${products.her.id}`}
                      className={styles.packNameLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pack.herName}
                    </Link>
                  ) : (
                    <span className={styles.packName}>{pack.herName}</span>
                  )}
                  {!fetching && products?.her && (
                    <span className={styles.packPrice}>€{products.her.price.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {!fetching && products?.him && products?.her && (
                <div className={styles.packPricing}>
                  <span className={styles.packOriginalPrice}>
                    €{(products.him.price - products.him.discountAmount + products.her.price - products.her.discountAmount).toFixed(2)}
                  </span>
                  <span className={styles.packFinalPrice}>
                    €{(products.him.price - products.him.discountAmount + products.her.price - products.her.discountAmount - pack.discount).toFixed(2)}
                  </span>
                </div>
              )}

              <div className={styles.packSavings}>
                <span className={styles.savingsBadge}>You save €{pack.discount}</span>
              </div>

              <div className={`${styles.packDescription} ${isExpanded ? styles.packDescriptionVisible : ''}`}>
                <p>{pack.description}</p>
              </div>

              <button
                className={`${styles.packButton} ${inCart ? styles.packButtonInCart : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddPackToCart(pack);
                }}
                disabled={loading === pack.id || inCart}
              >
                {inCart ? 'Pack in Cart' : loading === pack.id ? 'Adding...' : 'Add Pack to Cart'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
