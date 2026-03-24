'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/store';
import styles from '@/styles/checkout.module.css';
import { calculateShipping, ShippingMethod } from '@/lib/shipping';

interface SelectedLocker {
  id: string;
  address: string;
  postalCode: string;
}

interface CheckoutFormProps {
  onShippingMethodChange: (method: ShippingMethod) => void;
  onRedirecting?: () => void;
}

export default function CheckoutForm({ onShippingMethodChange, onRedirecting }: CheckoutFormProps) {
  const { items, getTotalPrice, clearCart, promoCode, promoDiscount, promoFreeShipping, selectedTester } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('boxnow');
  const [selectedLocker, setSelectedLocker] = useState<SelectedLocker | null>(null);

  // Keep a stable ref to the setter so the widget callback never goes stale
  const setSelectedLockerRef = useRef(setSelectedLocker);
  setSelectedLockerRef.current = setSelectedLocker;

  const subtotal = getTotalPrice();
  const baseShipping = calculateShipping(shippingMethod);
  const shippingCost = promoFreeShipping ? 0 : baseShipping;
  const total = subtotal - promoDiscount + shippingCost;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'HR',
  });

  // Load the BoxNow widget script once on mount.
  // The #boxnowmap div and .boxnow-widget-button element must already be in the
  // DOM when the script runs — that's why we keep them always rendered (hidden
  // via CSS when GLS is selected).
  useEffect(() => {
    (window as any)._bn_map_widget_config = {
      partnerId: 13783,
      parentElement: '#boxnowmap',
      type: 'popup',
      buttonSelector: '.boxnow-map-widget-button',
      afterSelect: function (selected: any) {
        setSelectedLockerRef.current({
          id: selected.boxnowLockerId,
          address: selected.boxnowLockerAddressLine1 || '',
          postalCode: selected.boxnowLockerPostalCode || '',
        });
      },
    };

    const script = document.createElement('script');
    script.src = 'https://widget-cdn.boxnow.hr/map-widget/client/v5.js';
    script.async = true;
    document.head.appendChild(script);
  }, []); // runs once on mount

  const handleMethodChange = (method: ShippingMethod) => {
    setShippingMethod(method);
    onShippingMethodChange(method);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (shippingMethod === 'boxnow') {
      if (!selectedLocker) {
        setError('Please select a BOX NOW locker before proceeding.');
        return;
      }
      if (!formData.phone) {
        setError('Phone number is required for BOX NOW delivery.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          tester: selectedTester
            ? { product: selectedTester, quantity: 1, isTester: true }
            : null,
          promoCode: promoCode ?? undefined,
          customerInfo: {
            ...formData,
            shippingMethod,
            boxnowLockerId: selectedLocker?.id ?? null,
            boxnowLockerAddress: selectedLocker
              ? `${selectedLocker.address}${selectedLocker.postalCode ? `, ${selectedLocker.postalCode}` : ''}`
              : null,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        onRedirecting?.();
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

  const boxnowHidden = shippingMethod !== 'boxnow';

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      {/* ── Delivery method selection ── */}
      <h2 className={styles.sectionTitle}>Delivery Method</h2>

      <div className={styles.deliveryMethods}>

        {/* BoxNow */}
        <label
          className={`${styles.deliveryCard} ${shippingMethod === 'boxnow' ? styles.deliveryCardActive : ''}`}
        >
          <input
            type="radio"
            name="shippingMethod"
            value="boxnow"
            checked={shippingMethod === 'boxnow'}
            onChange={() => handleMethodChange('boxnow')}
            className={styles.deliveryRadio}
          />
          <div className={styles.deliveryCardContent}>
            <div className={styles.deliveryCardTitle}>BOX NOW Locker</div>
            <div className={styles.deliveryCardDesc}>Pick up at a convenient locker near you</div>
          </div>
          <div className={styles.deliveryCardPrice}>FREE</div>
        </label>

        {/* GLS */}
        <label
          className={`${styles.deliveryCard} ${shippingMethod === 'gls' ? styles.deliveryCardActive : ''}`}
        >
          <input
            type="radio"
            name="shippingMethod"
            value="gls"
            checked={shippingMethod === 'gls'}
            onChange={() => handleMethodChange('gls')}
            className={styles.deliveryRadio}
          />
          <div className={styles.deliveryCardContent}>
            <div className={styles.deliveryCardTitle}>GLS Standard Delivery</div>
            <div className={styles.deliveryCardDesc}>2–5 business days · Delivered to your door</div>
          </div>
          <div className={styles.deliveryCardPrice}>€4.99</div>
        </label>
      </div>

      {/*
        ── BoxNow locker picker ──
        Always kept in the DOM so the widget script (loaded on mount) can
        attach its click handler to .boxnow-widget-button at initialisation.
        Visibility is toggled via the `hidden` style prop.
      */}
      <div className={styles.boxnowSection} style={{ display: boxnowHidden ? 'none' : 'flex' }}>
        {/* Widget renders content inside this div */}
        <div id="boxnowmap" />

        <button type="button" className={`boxnow-map-widget-button ${styles.boxnowSelectBtn}`}>
          {selectedLocker ? '📍 Change Locker' : '📍 Select a Locker'}
        </button>

        {selectedLocker ? (
          <div className={styles.selectedLockerInfo}>
            <span className={styles.selectedLockerLabel}>Selected Locker</span>
            <span>
              {selectedLocker.address}
              {selectedLocker.postalCode && `, ${selectedLocker.postalCode}`}
            </span>
          </div>
        ) : (
          <p className={styles.boxnowHint}>
            Click the button above to choose your nearest BOX NOW locker on the map.
          </p>
        )}
      </div>

      {/* ── Contact / shipping info ── */}
      <h2 className={styles.sectionTitle}>
        {shippingMethod === 'gls' ? 'Shipping Information' : 'Your Contact Information'}
      </h2>

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
        <label htmlFor="phone">
          Phone{' '}
          {shippingMethod === 'boxnow' ? (
            '*'
          ) : (
            <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span>
          )}
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required={shippingMethod === 'boxnow'}
          placeholder="+385..."
        />
        {shippingMethod === 'boxnow' && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            BOX NOW will SMS you when your parcel arrives at the locker.
          </p>
        )}
      </div>

      {/* Address fields — only for GLS */}
      {shippingMethod === 'gls' && (
        <>
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
        </>
      )}

      <button type="submit" className={styles.submitButton} disabled={loading}>
        {loading ? 'Processing...' : `Pay €${total.toFixed(2)}`}
      </button>

      <p className={styles.secureText}>🔒 Secure checkout powered by Stripe</p>
    </form>
  );
}
