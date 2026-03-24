'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/store';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '@/styles/cart.module.css';
import { calculateShipping } from '@/lib/shipping';
import Footer from '@/components/Footer';

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function CartPage() {
  const {
    items,
    cartSessionId,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    promoCode,
    promoDiscount,
    promoFreeShipping,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [promoMessage, setPromoMessage] = useState('');
  const [stockError, setStockError] = useState('');

  const [cartExpiresAt, setCartExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetched = useRef(false);

  // On mount: fetch existing reservation expiry, or create reservations if none exist.
  // Depends on cartSessionId + items.length so it re-runs after Zustand hydrates
  // from localStorage (first render always has items = [] and a random cartSessionId).
  useEffect(() => {
    if (!cartSessionId || items.length === 0 || hasFetched.current) return;
    hasFetched.current = true;

    async function syncReservations() {
      // 1. Check if active reservations already exist
      const checkRes = await fetch(
        `/api/cart/reserve?cartSessionId=${encodeURIComponent(cartSessionId)}`
      );
      const checkData = await checkRes.json();

      if (checkData.expiresAt) {
        setCartExpiresAt(checkData.expiresAt);
        return;
      }

      // 2. No reservations found (e.g. added via ProductCard before fix, or expired).
      //    Attempt to create a reservation for each item now.
      let latestExpiresAt: number | null = null;
      const toRemove: string[] = [];

      for (const item of items) {
        const res = await fetch('/api/cart/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartSessionId,
            productId: item.product.id,
            delta: item.quantity,
          }),
        });
        const data = await res.json();

        if (res.ok && data.expiresAt) {
          latestExpiresAt = data.expiresAt;
        } else {
          // No longer in stock — remove from cart
          toRemove.push(item.product.id);
        }
      }

      toRemove.forEach((id) => removeItem(id));

      if (latestExpiresAt) {
        setCartExpiresAt(latestExpiresAt);
      }
    }

    syncReservations().catch(() => {});
  }, [cartSessionId, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown ticker
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!cartExpiresAt || items.length === 0) {
      setTimeLeft(null);
      return;
    }

    function tick() {
      const remaining = cartExpiresAt! - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        fetch('/api/cart/reserve', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartSessionId }),
        }).finally(() => {
          clearCart();
          setCartExpiresAt(null);
        });
        return;
      }
      setTimeLeft(remaining);
    }

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cartExpiresAt, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRemoveItem(productId: string, quantity: number) {
    setStockError('');
    await fetch('/api/cart/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartSessionId, productId, delta: -quantity }),
    });
    removeItem(productId);
    if (items.length <= 1) {
      setCartExpiresAt(null);
    }
  }

  async function handleQuantityChange(productId: string, newQty: number) {
    setStockError('');
    const currentItem = items.find((i) => i.product.id === productId);
    if (!currentItem) return;

    if (newQty <= 0) {
      await handleRemoveItem(productId, currentItem.quantity);
      return;
    }

    const delta = newQty - currentItem.quantity;
    if (delta === 0) return;

    const res = await fetch('/api/cart/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartSessionId, productId, delta }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStockError(data.error || 'Not enough stock available.');
      return;
    }

    updateQuantity(productId, newQty);
    if (data.expiresAt) {
      setCartExpiresAt(data.expiresAt);
    }
  }

  const subtotal = getTotalPrice();
  const baseShipping = calculateShipping();
  const shippingCost = promoFreeShipping ? 0 : baseShipping;
  const total = subtotal - promoDiscount;

  async function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoStatus('loading');
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput,
          subtotal,
          cartItems: items.map((item) => ({ product: { name: item.product.name } })),
        }),
      });
      const data = await res.json();
      if (data.valid) {
        applyPromo(data.code, data.discountAmount, data.freeShipping);
        setPromoStatus('success');
        setPromoMessage(data.message);
        setPromoInput('');
      } else {
        setPromoStatus('error');
        setPromoMessage(data.message);
      }
    } catch {
      setPromoStatus('error');
      setPromoMessage('Something went wrong. Please try again.');
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <div className={styles.cartContainer}>
          <div className={styles.emptyCart}>
            <h2>Your Cart is Empty</h2>
            <p>Start shopping to add items to your cart</p>
            <Link href="/products" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className={styles.cartContainer}>
        <h1 className={styles.pageTitle}>SHOPPING CART</h1>

        {timeLeft !== null && timeLeft > 0 && (
          <div className={styles.reservationTimer}>
            <span>&#x23F1; Items reserved for: <strong>{formatTime(timeLeft)}</strong></span>
          </div>
        )}

        {stockError && (
          <div className={styles.stockError}>{stockError}</div>
        )}

        <div className={styles.cartLayout}>
          <div className={styles.cartItems}>
            {items.map((item) => {
              const price = item.product.price - item.product.discountAmount;
              return (
                <div key={item.product.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    {item.product.images[0] && (
                      <img src={item.product.images[0]} alt={item.product.name} />
                    )}
                  </div>

                  <div className={styles.itemDetails}>
                    <div>
                      <p className={styles.itemBrand}>{item.product.brand.name}</p>
                      <h3 className={styles.itemName}>{item.product.name}</h3>
                      <p className={styles.itemMeta}>
                        {item.product.concentration} • {item.product.size}ml
                      </p>
                    </div>
                    <div>
                      <p className={styles.itemPrice}>€{price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className={styles.itemControls}>
                    <button
                      onClick={() => handleRemoveItem(item.product.id, item.quantity)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>

                    <div className={styles.quantityControl}>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className={styles.quantityButton}
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.orderSummary}>
            <h2>ORDER SUMMARY</h2>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal</span>
              <span className={styles.summaryValue}>€{subtotal.toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}></div>

            {!promoCode ? (
              <form onSubmit={handleApplyPromo} className={styles.promoForm}>
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className={styles.promoInput}
                />
                <button
                  type="submit"
                  className={styles.promoBtn}
                  disabled={promoStatus === 'loading'}
                >
                  {promoStatus === 'loading' ? '...' : 'APPLY'}
                </button>
                {promoStatus === 'error' && (
                  <p className={styles.promoError}>{promoMessage}</p>
                )}
              </form>
            ) : (
              <div className={styles.promoApplied}>
                <span className={styles.promoAppliedText}>
                  <strong>{promoCode}</strong> — {promoMessage}
                </span>
                <button onClick={removePromo} className={styles.promoRemove}>
                  Remove
                </button>
              </div>
            )}

            {promoDiscount > 0 && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Discount</span>
                <span className={`${styles.summaryValue} ${styles.discountValue}`}>
                  -€{promoDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <hr className={styles.summaryDivider} />

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>€{total.toFixed(2)}</span>
            </div>

            <Link href="/checkout" className={styles.checkoutButton}>
              PROCEED TO CHECKOUT
            </Link>

            <Link href="/products" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
