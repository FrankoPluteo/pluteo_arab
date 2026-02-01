'use client';

import { useCart } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CheckoutForm from '@/components/CheckoutForm';
import styles from '@/styles/checkout.module.css';

const SHIPPING_COST = 4.99;

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  if (items.length === 0) {
    return null;
  }

  const subtotal = getTotalPrice();
  const total = subtotal + SHIPPING_COST;

  return (
    <div>
      <Navbar />
      
      <div className={styles.checkoutContainer}>
        <h1 className={styles.pageTitle}>CHECKOUT</h1>
        
        <div className={styles.checkoutLayout}>
          <div className={styles.formSection}>
            <CheckoutForm />
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
                    <p className={styles.itemPrice}>
                      €{(price * item.quantity).toFixed(2)}
                    </p>
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
                <span>Shipping</span>
                <span>€{SHIPPING_COST.toFixed(2)}</span>
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