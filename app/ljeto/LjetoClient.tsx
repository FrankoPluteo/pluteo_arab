'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CountdownTimer from '@/components/CountdownTimer';
import styles from '@/styles/ljeto.module.css';

interface Props {
  promoEndsAt: string;
}

export default function LjetoClient({ promoEndsAt }: Props) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Persist UTM params from URL into localStorage for checkout to pick up later.
  useEffect(() => {
    const source = searchParams.get('utm_source');
    const medium = searchParams.get('utm_medium');
    const campaign = searchParams.get('utm_campaign');
    if (source || medium || campaign) {
      try {
        localStorage.setItem(
          'utm',
          JSON.stringify({
            utm_source: source ?? '',
            utm_medium: medium ?? '',
            utm_campaign: campaign ?? '',
          })
        );
      } catch {
        // localStorage not available — ignore
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        setError(data.error || 'Greška. Pokušaj ponovo.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Greška. Pokušaj ponovo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className={styles.testimonial}>⭐⭐⭐⭐⭐ &ldquo;Miris je prekrasan, dostava stigla za 2 dana.&rdquo; — Maja, Zagreb</p>

      {/* Countdown */}
      <div className={styles.countdownWrap}>
        <span className={styles.countdownLabel}>Ponuda ističe za</span>
        <CountdownTimer endsAt={promoEndsAt} className={styles.countdown} />
      </div>

      {/* Email form or promo reveal */}
      {success ? (
        <div className={styles.promoReveal}>
          <p className={styles.promoRevealText}>Tvoj kod za 15% popusta:</p>
          <p className={styles.promoCode}>LJETO15</p>
          <p className={styles.promoSubtext}>Upiši kod pri narudžbi · vrijedi 14 dana</p>
          <p className={styles.socialProof}>Pridruži se 200+ zadovoljnih kupaca</p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.emailInput}
            type="email"
            placeholder="tvoj@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Slanje…' : 'Dobij 15% popusta'}
          </button>
          <p className={styles.socialProof}>Pridruži se 200+ zadovoljnih kupaca</p>
          {error && <p className={styles.errorMsg}>{error}</p>}
        </form>
      )}
    </>
  );
}
