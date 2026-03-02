'use client';

import { useState } from 'react';
import { useCart } from '@/lib/store';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '@/styles/cart.module.css';
import { calculateShipping } from '@/lib/shipping';
import Footer from '@/components/Footer';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
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

  const subtotal = getTotalPrice();
  const baseShipping = calculateShipping();
  const shippingCost = promoFreeShipping ? 0 : baseShipping;
  const total = subtotal - promoDiscount + shippingCost;

  async function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoStatus('loading');
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput, subtotal }),
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
                      onClick={() => removeItem(item.product.id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>

                    <div className={styles.quantityControl}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className={styles.quantityButton}
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
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

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Shipping</span>
              <span className={styles.summaryValue}>
                {promoFreeShipping ? (
                  <>
                    <s className={styles.strikethrough}>€{baseShipping.toFixed(2)}</s> FREE
                  </>
                ) : (
                  `€${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>

            {/* Promo code */}
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
