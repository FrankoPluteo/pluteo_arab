'use client';

import { useCart } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import CheckoutForm from '@/components/CheckoutForm';
import styles from '@/styles/checkout.module.css';
import { calculateShipping, ShippingMethod } from '@/lib/shipping';

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCart();
  const router = useRouter();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('boxnow');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !isRedirecting) {
      router.push('/cart');
    }
  }, [items, router, isRedirecting]);

  if (isRedirecting) {
    return (
      <div className={styles.redirectingOverlay}>
        <p className={styles.redirectingText}>Loading... please wait</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const subtotal = getTotalPrice();
  const shippingCost = calculateShipping(shippingMethod);
  const total = subtotal + shippingCost;

  return (
    <div>
      <Navbar />

      <div className={styles.checkoutContainer}>
        <h1 className={styles.pageTitle}>CHECKOUT</h1>

        <div className={styles.checkoutLayout}>
          <div className={styles.formSection}>
            <CheckoutForm onShippingMethodChange={setShippingMethod} onRedirecting={() => setIsRedirecting(true)} />
          </div>

          <div className={styles.summarySection}>
            <h2 className={styles.sectionTitle}>Order Summary</h2>

            <div className={styles.orderItems}>
              {items.map((item) => {
                const price = item.product.price - item.product.discountAmount;
                return (
                  <div key={item.product.id} className={styles.summaryItem}>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>
                        {item.product.brand.name} - {item.product.name}
                      </p>
                      <p className={styles.itemMeta}>
                        {item.product.size}ml × {item.quantity}
                      </p>
                    </div>
                    <p className={styles.itemPrice}>€{(price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <div className={styles.summaryTotals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping ({shippingMethod === 'boxnow' ? 'BOX NOW' : 'GLS'})</span>
                <span>€{shippingCost.toFixed(2)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
