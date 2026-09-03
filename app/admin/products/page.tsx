'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import s from '@/styles/admin.module.css';

interface ProductRow {
  id: string;
  name: string;
  brandName: string;
  image: string | null;
  price: number;
  stock: number;
}

interface Draft {
  price: string;
  stock: string;
}

type RowFeedback = { type: 'success' | 'error'; msg: string };

function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key)) as T;
}

function stockStatus(stock: number): { label: string; className: string } {
  if (stock <= 0) return { label: 'Out of stock', className: s.badgeDanger };
  if (stock <= 3) return { label: 'Low stock', className: s.badgeWarning };
  return { label: 'In stock', className: s.badgeOk };
}

export default function AdminStockPricePage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowFeedback>>({});

  useEffect(() => {
    fetch('/api/products')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: any[]) => {
        const rows: ProductRow[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          brandName: p.brand?.name || 'Unknown',
          image: p.images?.[0] ?? null,
          price: p.price,
          stock: p.stock,
        }));
        rows.sort((a, b) => a.brandName.localeCompare(b.brandName) || a.name.localeCompare(b.name));
        setProducts(rows);

        const init: Record<string, Draft> = {};
        for (const row of rows) {
          init[row.id] = { price: String(row.price), stock: String(row.stock) };
        }
        setDrafts(init);
      })
      .catch(() => setLoadError('Could not load products. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (lowStockOnly && p.stock > 3) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q);
    });
  }, [products, query, lowStockOnly]);

  function setDraft(id: string, field: keyof Draft, value: string) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
    setRowStatus((r) => omit(r, id));
  }

  function parsedDraft(id: string) {
    const draft = drafts[id];
    if (!draft) return null;
    const price = parseFloat(draft.price);
    const stock = Number(draft.stock);
    return {
      price,
      stock,
      priceValid: Number.isFinite(price) && price >= 0 && draft.price.trim() !== '',
      stockValid: Number.isInteger(stock) && stock >= 0 && draft.stock.trim() !== '',
    };
  }

  function hasChanges(row: ProductRow) {
    const draft = drafts[row.id];
    if (!draft) return false;
    return draft.price !== String(row.price) || draft.stock !== String(row.stock);
  }

  function resetDraft(row: ProductRow) {
    setDrafts((d) => ({ ...d, [row.id]: { price: String(row.price), stock: String(row.stock) } }));
    setRowStatus((r) => omit(r, row.id));
  }

  async function save(row: ProductRow) {
    const parsed = parsedDraft(row.id);
    if (!parsed || !parsed.priceValid || !parsed.stockValid) {
      setRowStatus((r) => ({ ...r, [row.id]: { type: 'error', msg: 'Enter a valid price and stock first.' } }));
      return;
    }

    setSaving(row.id);
    setRowStatus((r) => omit(r, row.id));

    try {
      const res = await fetch(`/api/admin/products/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parsed.price, stock: parsed.stock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');

      setProducts((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, price: data.price, stock: data.stock } : p))
      );
      setDrafts((d) => ({ ...d, [row.id]: { price: String(data.price), stock: String(data.stock) } }));
      setRowStatus((r) => ({ ...r, [row.id]: { type: 'success', msg: 'Saved' } }));
      setTimeout(() => setRowStatus((r) => omit(r, row.id)), 2500);
    } catch (e: any) {
      setRowStatus((r) => ({ ...r, [row.id]: { type: 'error', msg: e.message || 'Save failed.' } }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className={s.page} style={{ marginTop: '100px', maxWidth: '1200px' }}>
        <div className={s.header}>
          <h1 className={s.title}>STOCK &amp; PRICE</h1>
          <p className={s.subtitle}>
            Update how much a product costs and how many units are available to sell. Changes take
            effect on the live site immediately.
          </p>
        </div>

        <div className={s.adminNav}>
          <Link href="/admin" className={s.adminNavLink}>Dashboard</Link>
          <Link href="/admin/products" className={`${s.adminNavLink} ${s.adminNavLinkActive}`}>Stock &amp; Price</Link>
          <Link href="/admin/products/add" className={s.adminNavLink}>Add Product</Link>
          <Link href="/admin/brands" className={s.adminNavLink}>Brands</Link>
          <Link href="/admin/affiliates" className={s.adminNavLink}>Affiliates</Link>
        </div>

        {loadError && <div className={`${s.banner} ${s.bannerError}`}>{loadError}</div>}

        <div className={s.toolbar}>
          <input
            className={s.input}
            style={{ maxWidth: '320px' }}
            type="text"
            placeholder="Search by product or brand…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className={s.checkLabel}>
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            Low stock &amp; out of stock only
          </label>
          <span className={s.hint}>{filtered.length} of {products.length} products</span>
        </div>

        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '60px 0' }}>Loading products…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '60px 0' }}>No products match.</p>
        ) : (
          <div className={s.productTableWrap}>
            <table className={s.productTable}>
              <thead>
                <tr>
                  <th aria-hidden="true"></th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Price (€)</th>
                  <th>Stock</th>
                  <th aria-hidden="true"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const draft = drafts[row.id] ?? { price: String(row.price), stock: String(row.stock) };
                  const parsed = parsedDraft(row.id);
                  const changed = hasChanges(row);
                  const status = stockStatus(row.stock);
                  const isSaving = saving === row.id;
                  const feedback = rowStatus[row.id];
                  const canSave = changed && !isSaving && !!parsed?.priceValid && !!parsed?.stockValid;

                  return (
                    <tr key={row.id}>
                      <td className={s.productThumbCell}>
                        {row.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.image} alt={row.name} className={s.productThumb} />
                        ) : (
                          <div className={s.productThumbPlaceholder} />
                        )}
                      </td>
                      <td>
                        <div className={s.productCellBrand}>{row.brandName}</div>
                        <div className={s.productCellName}>{row.name}</div>
                      </td>
                      <td>
                        <span className={`${s.badge} ${status.className}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className={s.editCell}>
                          <input
                            className={`${s.input} ${parsed && !parsed.priceValid ? s.inputInvalid : ''}`}
                            type="number"
                            step="0.01"
                            min={0}
                            value={draft.price}
                            onChange={(e) => setDraft(row.id, 'price', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSave && save(row)}
                            aria-label={`Price for ${row.name}`}
                          />
                          {parsed && !parsed.priceValid && <span className={s.fieldError}>Invalid</span>}
                        </div>
                      </td>
                      <td>
                        <div className={s.editCell}>
                          <input
                            className={`${s.input} ${parsed && !parsed.stockValid ? s.inputInvalid : ''}`}
                            type="number"
                            step="1"
                            min={0}
                            value={draft.stock}
                            onChange={(e) => setDraft(row.id, 'stock', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && canSave && save(row)}
                            aria-label={`Stock for ${row.name}`}
                          />
                          {parsed && !parsed.stockValid && <span className={s.fieldError}>Invalid</span>}
                        </div>
                      </td>
                      <td className={s.productActionsCell}>
                        <div className={s.productActionsRow}>
                          <button className={s.saveBtn} onClick={() => save(row)} disabled={!canSave}>
                            {isSaving ? 'Saving…' : 'Save'}
                          </button>
                          {changed && !isSaving && (
                            <button className={s.undoBtn} onClick={() => resetDraft(row)} type="button">
                              Undo
                            </button>
                          )}
                        </div>
                        {feedback && (
                          <div className={feedback.type === 'success' ? s.rowSuccess : s.rowError}>
                            {feedback.msg}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
