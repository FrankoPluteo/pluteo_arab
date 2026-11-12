'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { captureEmail } from '@/lib/emailCapture';
import { track } from '@/lib/analytics';
import styles from '@/styles/emailmodal.module.css';

export default function EmailModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  // A cold database can make the signup take a few seconds; people clicked NASTAVI again
  // and every click sent (and counted) another signup. One request at a time.
  const inFlight = useRef(false);
  const { t } = useLanguage();

  useEffect(() => {
    const captured = localStorage.getItem('email_captured');
    if (!captured) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || inFlight.current) return;
    inFlight.current = true;
    setSending(true);

    let accepted: boolean;
    try {
      accepted = await captureEmail(email);
    } catch {
      // Network dropped: keep the form open so the address can be sent again.
      inFlight.current = false;
      setSending(false);
      return;
    }
    // Counted once, and only when the server has saved the address.
    if (accepted) track('newsletter_signup', { source: 'popup' });
    setSubmitted(true);
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
          <div className={styles.thankYouWrap}>
            <p className={styles.thankYou}>{t.emailModal.thankYou}</p>
            <p className={styles.codeLabel}>{t.emailModal.codeLabel}</p>
            <p className={styles.promoCode}>PLUTEO15</p>
          </div>
        ) : (
          <>
            <p className={styles.eyebrow}>{t.emailModal.eyebrow}</p>
            <h2 className={styles.heading}>{t.emailModal.heading}</h2>
            <p className={styles.subtext}>{t.emailModal.subtext}</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn} disabled={sending} aria-busy={sending}>
                {sending ? '…' : t.emailModal.submit}
              </button>
            </form>
            <button className={styles.skipBtn} onClick={handleDismiss}>
              {t.emailModal.noThanks}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
