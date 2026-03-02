'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/emailmodal.module.css';

export default function EmailModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const captured = localStorage.getItem('email_captured');
    if (!captured) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    localStorage.setItem('email_captured', email);
    setSubmitted(true);
    setTimeout(() => setVisible(false), 1500);
  }

  function handleDismiss() {
    localStorage.setItem('email_captured', 'dismissed');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleDismiss}>×</button>

        {submitted ? (
          <p className={styles.thankYou}>You&apos;re in. Welcome.</p>
        ) : (
          <>
            <p className={styles.eyebrow}>EXCLUSIVE ACCESS</p>
            <h2 className={styles.heading}>Stay in the loop.</h2>
            <p className={styles.subtext}>
              Enter your email for promo codes, early deals, and members-only discounts.
            </p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn}>
                CONTINUE
              </button>
            </form>
            <button className={styles.skipBtn} onClick={handleDismiss}>
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
