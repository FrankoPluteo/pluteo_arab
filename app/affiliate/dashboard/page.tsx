'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/affiliate.module.css';

interface Conversion {
  id: string;
  orderId: string;
  orderValue: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  affiliate: {
    name: string;
    email: string;
    affiliateCode: string;
    status: string;
  };
  stats: {
    totalConversions: number;
    totalEarned: number;
    pendingPayout: number;
  };
  conversions: Conversion[];
}

export default function AffiliateDashboardPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/affiliates/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), affiliateCode: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Login failed.');
      } else {
        setData(json);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.affiliate.affiliateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (n: number) => `€${n.toFixed(2)}`;

  return (
    <>
      <Navbar />
      <div className={styles.dashPage}>
        <div className={styles.dashContainer}>
          <h1 className={styles.title} style={{ textAlign: 'left', marginBottom: '32px' }}>
            AFFILIATE DASHBOARD
          </h1>

          {!data ? (
            <div className={styles.loginCard}>
              <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
                Enter your email and affiliate code to access your dashboard.
              </p>
              <form className={styles.form} onSubmit={handleLogin}>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="code">Affiliate Code</label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder="YOURCODE"
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'LOADING…' : 'VIEW DASHBOARD'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className={styles.codeBox}>
                <div>
                  <div className={styles.codeLabel}>Your Affiliate Code</div>
                  <div className={styles.codeValue}>{data.affiliate.affiliateCode}</div>
                </div>
                <button className={styles.copyBtn} onClick={copyCode}>
                  {copied ? 'COPIED!' : 'COPY CODE'}
                </button>
              </div>

              {data.affiliate.status !== 'active' && (
                <div className={styles.error} style={{ marginBottom: '24px' }}>
                  Your account status is <strong>{data.affiliate.status}</strong>. Conversions are
                  only tracked for active accounts.
                </div>
              )}

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{data.stats.totalConversions}</div>
                  <div className={styles.statLabel}>Total Conversions</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{fmt(data.stats.totalEarned)}</div>
                  <div className={styles.statLabel}>Total Earned</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{fmt(data.stats.pendingPayout)}</div>
                  <div className={styles.statLabel}>Pending Payout</div>
                </div>
              </div>

              <h2 className={styles.sectionTitle}>Conversion History</h2>

              {data.conversions.length === 0 ? (
                <div className={styles.emptyState}>
                  No conversions yet. Share your code to start earning!
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order Value</th>
                      <th>Commission (5%)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.conversions.map((c: Conversion) => (
                      <tr key={c.id}>
                        <td>{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                        <td>{fmt(c.orderValue)}</td>
                        <td>{fmt(c.commissionAmount)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              c.status === 'paid' ? styles.badgePaid : styles.badgePending
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
