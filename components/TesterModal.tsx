'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store';
import { Product } from '@/types';
import styles from '@/styles/testermodal.module.css';

interface TesterModalProps {
  onClose: () => void;
}

export default function TesterModal({ onClose }: TesterModalProps) {
  const router = useRouter();
  const { setTester } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleSkip() {
    setTester(null);
    onClose();
    router.push('/checkout');
  }

  function handleConfirm() {
    const chosen = products.find((p) => p.id === selectedId) ?? null;
    setTester(chosen);
    onClose();
    router.push('/checkout');
  }

  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) handleSkip(); }}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={handleSkip} aria-label="Close">
          &times;
        </button>

        <p className={styles.eyebrow}>Complimentary Gift</p>
        <h2 className={styles.heading}>Add a Free Tester</h2>
        <p className={styles.subtext}>
          Choose one free tester bottle to include with your order — on us.
          This is completely optional.
        </p>

        {loading ? (
          <div className={styles.loading}>Loading products…</div>
        ) : (
          <div className={styles.productList}>
            {products.map((product) => {
              const isSelected = product.id === selectedId;
              return (
                <button
                  key={product.id}
                  className={`${styles.productOption} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedId(isSelected ? null : product.id)}
                  type="button"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className={styles.productThumb}
                    />
                  ) : (
                    <div className={styles.productThumbPlaceholder} />
                  )}

                  <div className={styles.productInfo}>
                    <p className={styles.productBrand}>{product.brand?.name}</p>
                    <p className={styles.productName}>{product.name}</p>
                    <p className={styles.productMeta}>
                      {product.concentration} · {product.size}ml
                    </p>
                  </div>

                  {isSelected ? (
                    <span className={styles.checkmark}>✓</span>
                  ) : (
                    <span className={styles.freeBadge}>FREE</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedProduct}
            type="button"
          >
            {selectedProduct
              ? `ADD ${selectedProduct.brand?.name.toUpperCase()} — ${selectedProduct.name.toUpperCase()}`
              : 'SELECT A TESTER ABOVE'}
          </button>
          <button className={styles.skipBtn} onClick={handleSkip} type="button">
            No thanks, proceed without a tester
          </button>
        </div>
      </div>
    </div>
  );
}
