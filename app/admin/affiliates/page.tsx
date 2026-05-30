'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import styles from '@/styles/affiliate.module.css';

interface AffiliateRow {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  status: string;
  iban: string | null;
  createdAt: string;
  totalEarned: number;
  pendingPayout: number;
  totalConversions: number;
}

interface Conversion {
  id: string;
  orderId: string;
  orderValue: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

interface DetailData {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  status: string;
  iban: string | null;
  createdAt: string;
  conversions: Conversion[];
}

type Tab = 'affiliates' | 'payouts';

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('affiliates');
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliates');
      const data = await res.json();
      setAffiliates(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadDetail = async (id: string) => {
    const res = await fetch(`/api/admin/affiliates/${id}`);
    const data = await res.json();
    setDetail(data);
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setMessage(`Status updated to ${status}.`);
      await load();
      if (detail?.id === id) await loadDetail(id);
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const markPaid = async (id: string) => {
    setActionLoading(id + 'paid');
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markPaid: true }),
      });
      const data = await res.json();
      setMessage(`Marked ${data.updated} conversion(s) as paid.`);
      await load();
      if (detail?.id === id) await loadDetail(id);
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const fmt = (n: number) => `€${n.toFixed(2)}`;

  const weeklyPayouts = affiliates
    .filter((a) => a.pendingPayout > 0)
    .sort((a, b) => b.pendingPayout - a.pendingPayout);

  if (detail) {
    const pendingConversions = detail.conversions.filter((c) => c.status === 'pending');
    return (
      <>
        <Navbar />
        <div className={styles.adminPage} style={{ marginTop: '80px' }}>
          <div
            className={styles.backLink}
            onClick={() => setDetail(null)}
          >
            ← Back to affiliates
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h1 className={styles.adminTitle}>{detail.name}</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              {detail.email} · Code: <strong>{detail.affiliateCode}</strong> ·{' '}
              <span
                className={`${styles.badge} ${
                  detail.status === 'active'
                    ? styles.badgeActive
                    : detail.status === 'suspended'
                    ? styles.badgeSuspended
                    : styles.badgePending
                }`}
              >
                {detail.status}
              </span>
            </p>
            {detail.iban && (
              <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                IBAN: {detail.iban}
              </p>
            )}
          </div>

          {message && (
            <div style={{ background: '#d1f0e0', color: '#1a6b3a', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {detail.status !== 'active' && (
              <button
                className={`${styles.actionBtn} ${styles.btnApprove}`}
                onClick={() => updateStatus(detail.id, 'active')}
                disabled={actionLoading !== null}
              >
                Approve
              </button>
            )}
            {detail.status !== 'suspended' && (
              <button
                className={`${styles.actionBtn} ${styles.btnSuspend}`}
                onClick={() => updateStatus(detail.id, 'suspended')}
                disabled={actionLoading !== null}
              >
                Suspend
              </button>
            )}
            {pendingConversions.length > 0 && (
              <button
                className={`${styles.actionBtn} ${styles.btnPaid}`}
                onClick={() => markPaid(detail.id)}
                disabled={actionLoading !== null}
              >
                Mark All Pending as Paid ({pendingConversions.length})
              </button>
            )}
          </div>

          <h2 className={styles.sectionTitle}>Conversions</h2>

          {detail.conversions.length === 0 ? (
            <div className={styles.emptyState}>No conversions yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Order Value</th>
                  <th>Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.conversions.map((c) => (
                  <tr key={c.id}>
                    <td>{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.orderId.slice(0, 16)}…</td>
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
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.adminPage} style={{ marginTop: '80px' }}>
        <h1 className={styles.adminTitle}>AFFILIATES</h1>

        {message && (
          <div style={{ background: '#d1f0e0', color: '#1a6b3a', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {message}
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'affiliates' ? styles.tabActive : ''}`}
            onClick={() => setTab('affiliates')}
          >
            All Affiliates
          </button>
          <button
            className={`${styles.tab} ${tab === 'payouts' ? styles.tabActive : ''}`}
            onClick={() => setTab('payouts')}
          >
            Weekly Payouts {weeklyPayouts.length > 0 && `(${weeklyPayouts.length})`}
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : tab === 'affiliates' ? (
          affiliates.length === 0 ? (
            <div className={styles.emptyState}>No affiliates yet.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>IBAN</th>
                  <th>Status</th>
                  <th>Conversions</th>
                  <th>Total Earned</th>
                  <th>Pending Payout</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--color-dark)' }}
                        onClick={() => loadDetail(a.id)}
                      >
                        {a.name}
                      </span>
                      <div style={{ fontSize: '12px', color: '#888' }}>{a.email}</div>
                    </td>
                    <td style={{ fontWeight: 700, letterSpacing: '1px' }}>{a.affiliateCode}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {a.iban || <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          a.status === 'active'
                            ? styles.badgeActive
                            : a.status === 'suspended'
                            ? styles.badgeSuspended
                            : styles.badgePending
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>{a.totalConversions}</td>
                    <td>{fmt(a.totalEarned)}</td>
                    <td>{fmt(a.pendingPayout)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {a.status !== 'active' && (
                          <button
                            className={`${styles.actionBtn} ${styles.btnApprove}`}
                            onClick={() => updateStatus(a.id, 'active')}
                            disabled={actionLoading !== null}
                          >
                            Approve
                          </button>
                        )}
                        {a.status !== 'suspended' && (
                          <button
                            className={`${styles.actionBtn} ${styles.btnSuspend}`}
                            onClick={() => updateStatus(a.id, 'suspended')}
                            disabled={actionLoading !== null}
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          /* Weekly payouts view */
          weeklyPayouts.length === 0 ? (
            <div className={styles.emptyState}>No pending payouts.</div>
          ) : (
            <>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Affiliates with unpaid commission. Click &quot;Mark as Paid&quot; after sending the bank transfer.
              </p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Affiliate</th>
                    <th>Code</th>
                    <th>IBAN</th>
                    <th>Pending Conversions</th>
                    <th>Amount Owed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyPayouts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{a.email}</div>
                      </td>
                      <td style={{ fontWeight: 700, letterSpacing: '1px' }}>{a.affiliateCode}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {a.iban || <span style={{ color: '#bbb' }}>Not provided</span>}
                      </td>
                      <td>
                        {a.totalConversions > 0
                          ? `${a.totalConversions - Math.round((a.totalEarned - a.pendingPayout) / (a.totalEarned / (a.totalConversions || 1)))} pending`
                          : '—'}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '16px' }}>{fmt(a.pendingPayout)}</td>
                      <td>
                        <button
                          className={`${styles.actionBtn} ${styles.btnPaid}`}
                          onClick={() => markPaid(a.id)}
                          disabled={actionLoading !== null}
                        >
                          Mark as Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        )}
      </div>
    </>
  );
}
