'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '@/styles/ordersuccess.module.css';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // You can fetch order details here if needed
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className={styles.container}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.checkmark}>✓</div>
          <h1 className={styles.title}>Order Confirmed!</h1>
          <p className={styles.message}>
            Thank you for your purchase. We've sent a confirmation email with your order details.
          </p>
          
          <div className={styles.actions}>
            <Link href="/products" className={styles.primaryButton}>
              Continue Shopping
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}