'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { applyLandingCode } from '@/lib/cartPrefill';
import { trackMetaEvent } from '@/lib/metaPixel';
import { captureEmail, EMAIL_PATTERN } from '@/lib/emailCapture';
import { getUrlCode } from '@/lib/attribution';
import styles from '@/styles/jesen.module.css';

interface TrackerProps {
  /** The campaign code to apply when the URL brings none; null when it is not currently valid. */
  defaultCode: string | null;
  contentIds: string[];
}

/**
 * Runs once per visit: applies the campaign code and fires ViewContent. UTM params are
 * captured site wide by AttributionCapture, not here.
 */
export function JesenTracker({ defaultCode, contentIds }: TrackerProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // A code in the link wins (e.g. an affiliate's); otherwise the campaign code is pre-applied.
    const code = getUrlCode(new URLSearchParams(window.location.search)) || (defaultCode ?? '').trim().toUpperCase();
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

/**
 * Quiet newsletter line under the final CTA. Same signup as the popup (captureEmail),
 * and like the popup it fires no pixel event. It only touches the 'email_captured'
 * flag, never the cart, the applied code or the stored UTM params.
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;

    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      setError('Upiši ispravnu e-mail adresu.');
      return;
    }

    setError(null);
    setStatus('sending');
    try {
      if (!(await captureEmail(normalized))) throw new Error('rejected');
      setStatus('done');
    } catch {
      setError('Prijava nije uspjela. Pokušaj ponovno.');
      setStatus('idle');
    }
  }

  return (
    // One persistent live region, so both the error and the success line that
    // replaces the form are announced by screen readers.
    <section className={styles.newsletter} aria-label="Novosti na mail" aria-live="polite">
      {status === 'done' ? (
        <p className={styles.newsletterLine}>Hvala, javimo se s novim mirisima.</p>
      ) : (
        <form className={styles.newsletterForm} onSubmit={handleSubmit} noValidate>
          <label htmlFor="jesen-email" className={styles.newsletterLine}>
            Ne želiš kupiti danas? Ostavi mail za nove mirise.
          </label>
          <div className={styles.newsletterRow}>
            <input
              id="jesen-email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tvoj@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'jesen-email-error jesen-email-note' : 'jesen-email-note'}
              className={styles.newsletterInput}
            />
            <button
              type="submit"
              className={styles.newsletterBtn}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Šaljem…' : 'Prijavi me'}
            </button>
          </div>
          {error && (
            <p id="jesen-email-error" className={styles.newsletterError}>
              {error}
            </p>
          )}
          <p id="jesen-email-note" className={styles.newsletterNote}>
            Šaljemo samo novosti o mirisima. Odjava je moguća u svakom trenutku.
          </p>
        </form>
      )}
    </section>
  );
}
