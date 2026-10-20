'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { applyLandingCode } from '@/lib/cartPrefill';
import { trackMetaEvent } from '@/lib/metaPixel';
import styles from '@/styles/jesen.module.css';

interface TrackerProps {
  /** The campaign code to apply when the URL brings none; null when it is not currently valid. */
  defaultCode: string | null;
  contentIds: string[];
}

/** Runs once per visit: stores UTM params, applies the campaign code and fires ViewContent. */
export function JesenTracker({ defaultCode, contentIds }: TrackerProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);

    // Persist UTM params for checkout to send with the order (see CheckoutForm).
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    if (source || medium || campaign) {
      try {
        localStorage.setItem(
          'utm',
          JSON.stringify({
            utm_source: source ?? '',
            utm_medium: medium ?? '',
            utm_campaign: campaign ?? '',
          })
        );
      } catch {
        // localStorage not available — ignore
      }
    }

    // A code in the link wins (e.g. an affiliate's); otherwise the campaign code is pre-applied.
    const code = (params.get('promo') || params.get('code') || params.get('ref') || defaultCode || '')
      .trim()
      .toUpperCase();
    if (code) {
      applyLandingCode(code).catch(() => {
        // The cart re-validates the code and checkout re-checks it server side.
      });
    }

    trackMetaEvent('ViewContent', {
      content_ids: contentIds,
      content_type: 'product',
      content_name: 'Jesen',
      currency: 'EUR',
    });
  }, [defaultCode, contentIds]);

  return null;
}

interface AddToCartButtonProps {
  product: Product;
  /** What the customer pays for one bottle, sent with the AddToCart event. */
  value: number;
  soldOut: boolean;
}

export function AddToCartButton({ product, value, soldOut }: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem);
  const cartSessionId = useCart((state) => state.cartSessionId);
  const [status, setStatus] = useState<'idle' | 'loading' | 'added'>('idle');
  const [outOfStock, setOutOfStock] = useState(soldOut);

  async function handleAdd() {
    if (outOfStock || status === 'loading') return;
    setStatus('loading');

    try {
      const res = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartSessionId, productId: product.id, delta: 1 }),
      });

      if (!res.ok) {
        setOutOfStock(true);
        setStatus('idle');
        return;
      }

      addItem(product);
      trackMetaEvent('AddToCart', {
        content_ids: [product.id],
        content_name: `${product.brand.name} ${product.name}`,
        content_type: 'product',
        value,
        currency: 'EUR',
      });
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('idle');
    }
  }

  if (outOfStock) {
    return (
      <button type="button" className={`${styles.addBtn} ${styles.addBtnSoldOut}`} disabled>
        Rasprodano
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.addBtn}
      onClick={handleAdd}
      disabled={status === 'loading'}
      aria-live="polite"
    >
      {status === 'loading' ? 'Dodajem…' : status === 'added' ? 'Dodano' : 'Dodaj u košaricu'}
    </button>
  );
}

/** The persisted cart only exists in the browser, so the count is 0 until it has been read. */
function useCartCount() {
  const hydrated = useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false
  );
  const totalItems = useCart((state) => state.getTotalItems());
  return hydrated ? totalItems : 0;
}

export function CartLink() {
  const count = useCartCount();
  return (
    <Link
      href="/cart"
      className={styles.cartLink}
      aria-label={count > 0 ? `Košarica, ${count} proizvoda` : 'Košarica'}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 7h12l-1 13H7L6 7Z M9 7V6a3 3 0 0 1 6 0v1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && <span className={styles.cartCount}>{count}</span>}
    </Link>
  );
}

export function CartBar() {
  const count = useCartCount();
  if (count === 0) return null;
  return (
    <>
      {/* Keeps the legal footer from sitting under the fixed bar */}
      <div className={styles.cartBarSpacer} aria-hidden="true" />
      <div className={styles.cartBar}>
        <span className={styles.cartBarText}>U košarici: {count}</span>
        <Link href="/cart" className={styles.cartBarBtn}>
          Idi u košaricu
        </Link>
      </div>
    </>
  );
}
