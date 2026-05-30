'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/affiliate.module.css';

const TERMS = {
  en: {
    title: 'Pluteo.shop Affiliate Program — Terms and Conditions',
    items: [
      {
        heading: 'Eligibility',
        text: 'By registering, you confirm you are a legal adult and that the IBAN provided belongs to you personally.',
      },
      {
        heading: 'Commission',
        text: 'You will earn 5% of the net order value for each completed order placed using your affiliate code. Commissions are calculated on the final paid order amount, excluding shipping costs and after any discounts.',
      },
      {
        heading: 'Payouts',
        text: 'Payouts are processed manually on a weekly basis via bank transfer to the IBAN you provided. Vonta Grupa d.o.o. reserves the right to adjust the payout schedule. Minimum payout threshold is €5.00.',
      },
      {
        heading: 'Tax obligations',
        text: 'All commissions are paid as "drugi dohodak" (other income) under Croatian tax law. Vonta Grupa d.o.o., as the paying entity, is legally required to withhold income tax (20%) and city surtax (prirez) on each payout as required by Croatian law. The amount shown in your dashboard is your gross commission — your net payout will be lower after tax withholding. By registering, you acknowledge and accept this.',
      },
      {
        heading: 'Fraud & abuse',
        text: 'Self-referrals, fake orders, and any manipulation of the affiliate system are strictly prohibited and will result in immediate suspension and forfeiture of all pending commissions.',
      },
      {
        heading: 'Code ownership',
        text: 'Your affiliate code is personal and non-transferable. You may not sell, share, or transfer it to another person.',
      },
      {
        heading: 'Termination',
        text: 'Vonta Grupa d.o.o. reserves the right to suspend or terminate any affiliate account at any time, with or without cause. Earned and approved commissions will still be paid out upon termination.',
      },
      {
        heading: 'Governing law',
        text: 'These terms are governed by the laws of the Republic of Croatia.',
      },
    ],
  },
  hr: {
    title: 'Pluteo.shop Partnerski Program — Uvjeti i odredbe',
    items: [
      {
        heading: 'Uvjeti sudjelovanja',
        text: 'Registracijom potvrđujete da ste punoljetni i da IBAN koji ste naveli pripada vama osobno.',
      },
      {
        heading: 'Provizija',
        text: 'Zarađujete 5% od neto vrijednosti narudžbe za svaku završenu narudžbu u kojoj je iskorišten vaš partnerski kod. Provizija se obračunava na konačni plaćeni iznos narudžbe, bez troškova dostave i nakon primjene svih popusta.',
      },
      {
        heading: 'Isplate',
        text: 'Isplate se vrše ručno na tjednoj bazi bankovnim prijenosom na IBAN koji ste naveli. Vonta Grupa d.o.o. zadržava pravo izmjene rasporeda isplata. Minimalni iznos za isplatu je 5,00 €.',
      },
      {
        heading: 'Porezne obveze',
        text: 'Sve provizije isplaćuju se kao drugi dohodak sukladno hrvatskom poreznom zakonu. Vonta Grupa d.o.o., kao isplatitelj, zakonski je obvezna obustaviti predujam poreza na dohodak (20%) i prirez na svaku isplatu sukladno važećim propisima. Iznos prikazan u vašem pregledu je bruto provizija — neto isplata bit će niža nakon poreznih obustava. Registracijom prihvaćate navedeno.',
      },
      {
        heading: 'Prijevara i zlouporaba',
        text: 'Samoupućivanje, lažne narudžbe i svaka manipulacija partnerskim sustavom strogo su zabranjeni te će rezultirati trenutnom suspenzijom i gubitkom svih neriješenih provizija.',
      },
      {
        heading: 'Vlasništvo nad kodom',
        text: 'Vaš partnerski kod osoban je i neprenosiv. Ne smijete ga prodavati, dijeliti niti prenositi na drugu osobu.',
      },
      {
        heading: 'Raskid suradnje',
        text: 'Vonta Grupa d.o.o. zadržava pravo suspenzije ili ukidanja bilo kojeg partnerskog računa u bilo kojem trenutku, s razlogom ili bez njega. Zarađene i odobrene provizije bit će isplaćene i nakon raskida suradnje.',
      },
      {
        heading: 'Mjerodavno pravo',
        text: 'Ovi uvjeti uređeni su zakonima Republike Hrvatske.',
      },
    ],
  },
};

export default function AffiliatePage() {
  const [form, setForm] = useState({ name: '', email: '', affiliateCode: '', iban: '' });
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsLang, setTermsLang] = useState<'en' | 'hr'>('en');
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
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, acceptedTerms: true }),
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

  const terms = TERMS[termsLang];

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>BECOME AN AFFILIATE</h1>
          <p className={styles.subtitle}>
            Join the Pluteo affiliate programme and earn 5% commission on every sale you refer.
            Fill in the form below and we&apos;ll review your application.
          </p>

          {submitted ? (
            <div className={styles.success}>
              <div className={styles.successTitle}>Application Submitted!</div>
              <p className={styles.successText}>
                Thank you for applying. We&apos;ll review your application and get back to you via
                email once your account is activated.
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
                <label htmlFor="iban">IBAN for Payouts *</label>
                <input
                  type="text"
                  id="iban"
                  name="iban"
                  value={form.iban}
                  onChange={handleChange}
                  required
                  placeholder="HR12 3456 7890 1234 5678 9"
                />
              </div>

              {/* ── Terms & Conditions ── */}
              <div className={styles.termsBlock}>
                <div className={styles.termsCheckRow}>
                  <input
                    type="checkbox"
                    id="acceptedTerms"
                    className={styles.termsCheckbox}
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="acceptedTerms" className={styles.termsCheckLabel}>
                    I agree to the Affiliate Program Terms and Conditions *
                  </label>
                </div>

                <button
                  type="button"
                  className={styles.termsToggleBtn}
                  onClick={() => setTermsOpen((o) => !o)}
                  aria-expanded={termsOpen}
                >
                  {termsOpen ? '▲ Hide terms' : '▼ Read terms'}
                </button>

                <div className={styles.termsExpandWrapper} data-open={termsOpen ? 'true' : 'false'}>
                  <div className={styles.termsExpandInner}>
                    <div className={styles.termsContent}>
                      <div className={styles.termsTabs}>
                        <button
                          type="button"
                          className={`${styles.termsTab} ${termsLang === 'en' ? styles.termsTabActive : ''}`}
                          onClick={() => setTermsLang('en')}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          className={`${styles.termsTab} ${termsLang === 'hr' ? styles.termsTabActive : ''}`}
                          onClick={() => setTermsLang('hr')}
                        >
                          HR
                        </button>
                      </div>

                      <div className={styles.termsBody}>
                        <h2>{terms.title}</h2>
                        <ol>
                          {terms.items.map((item, i) => (
                            <li key={i}>
                              <strong>{item.heading}. </strong>
                              {item.text}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
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
