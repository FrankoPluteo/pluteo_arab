'use client';

import { useState } from 'react';
import { useCart } from '@/lib/store';
import styles from '@/styles/checkout.module.css';
import { calculateShipping } from '@/lib/shipping';

export default function CheckoutForm() {
  const { items, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const subtotal = getTotalPrice();
  const shippingCost = calculateShipping(subtotal);
  const total = subtotal + shippingCost;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'HR', // Croatia only
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerInfo: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      <h2 className={styles.sectionTitle}>Shipping Information</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="name">Full Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+385..."
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="address">Address *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          placeholder="Street and number"
        />
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="zip">ZIP Code *</label>
          <input
            type="text"
            id="zip"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            required
            placeholder="10000"
          />
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="country">Country</label>
        <select
          id="country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          disabled
        >
          <option value="HR">Croatia 🇭🇷</option>
        </select>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
          We currently ship within Croatia only
        </p>
      </div>
      
      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? 'Processing...' : `Pay €${total.toFixed(2)}`}
      </button>
      
      <p className={styles.secureText}>
        🔒 Secure checkout powered by Stripe
      </p>
    </form>
  );
}