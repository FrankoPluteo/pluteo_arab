'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/affiliate.module.css';

export default function AffiliatePage() {
  const [form, setForm] = useState({ name: '', email: '', affiliateCode: '', iban: '' });
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    if (name === 'affiliateCode') {
      const cleaned = value.toUpperCase().replace(/\s+/g, '');
      setForm((f) => ({ ...f, affiliateCode: cleaned }));
      setCodeStatus('idle');
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const checkCodeAvailability = async (): Promise<void> => {
    if (!form.affiliateCode || form.affiliateCode.length < 3) return;
    setCodeStatus('checking');
    try {
      const res = await fetch(`/api/affiliates/check-code?code=${encodeURIComponent(form.affiliateCode)}`);
      const data = await res.json();
      setCodeStatus(data.available ? 'available' : 'taken');
    } catch {
      setCodeStatus('idle');
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (codeStatus === 'taken') return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>BECOME AN AFFILIATE</h1>
          <p className={styles.subtitle}>
            Join the Pluteo affiliate programme and earn 5% commission on every sale you refer.
            Fill in the form below and we'll review your application.
          </p>

          {submitted ? (
            <div className={styles.success}>
              <div className={styles.successTitle}>Application Submitted!</div>
              <p className={styles.successText}>
                Thank you for applying. We'll review your application and get back to you via email
                once your account is activated.
              </p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="affiliateCode">Desired Affiliate Code *</label>
                <input
                  type="text"
                  id="affiliateCode"
                  name="affiliateCode"
                  value={form.affiliateCode}
                  onChange={handleChange}
                  onBlur={checkCodeAvailability}
                  required
                  placeholder="e.g. IVAN2024"
                  className={
                    codeStatus === 'available'
                      ? styles.inputValid
                      : codeStatus === 'taken'
                      ? styles.inputInvalid
                      : ''
                  }
                />
                {codeStatus === 'checking' && (
                  <p className={styles.hint}>Checking availability…</p>
                )}
                {codeStatus === 'available' && (
                  <p className={`${styles.hint} ${styles.hintValid}`}>✓ Code is available!</p>
                )}
                {codeStatus === 'taken' && (
                  <p className={`${styles.hint} ${styles.hintInvalid}`}>
                    This code is already taken. Please choose another.
                  </p>
                )}
                <p className={styles.hint}>
                  3–20 characters, letters and numbers only. Will be saved in uppercase.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="iban">
                  IBAN for Payouts{' '}
                  <span style={{ color: '#bbb', fontWeight: 400 }}>(optional, add later)</span>
                </label>
                <input
                  type="text"
                  id="iban"
                  name="iban"
                  value={form.iban}
                  onChange={handleChange}
                  placeholder="HR12 3456 7890 1234 5678 9"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || codeStatus === 'taken'}
              >
                {loading ? 'SUBMITTING…' : 'APPLY NOW'}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
