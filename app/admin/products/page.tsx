'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import s from '@/styles/admin.module.css';
import { computeMargins, PROMO_DISCOUNTS, type Margins } from '@/lib/margins';

interface ProductRow {
  id: string;
  name: string;
  brandName: string;
  image: string | null;
  price: number;
  discountAmount: number;
  wholesalePrice: number | null;
  stock: number;
}

interface Draft {
  price: string;
  stock: string;
}

type RowFeedback = { type: 'success' | 'error'; msg: string };

interface MarginColumn {
  key: string;
  label: string;
  kind: 'money' | 'percent';
  value: (m: Margins) => number | null;
}

const MARGIN_COLUMNS: MarginColumn[] = [
  { key: 'wholesale', label: 'Wholesale', kind: 'money', value: (m) => m.wholesalePrice },
  { key: 'margin', label: 'Margin', kind: 'money', value: (m) => m.margin },
  { key: 'marginPercent', label: 'Margin %', kind: 'percent', value: (m) => m.marginPercent },
  ...PROMO_DISCOUNTS.flatMap((pct): MarginColumn[] => [
    { key: `margin${pct}`, label: `Margin −${pct}%`, kind: 'money', value: (m) => m.atPromo[pct]?.margin ?? null },
    { key: `marginPercent${pct}`, label: `% at −${pct}%`, kind: 'percent', value: (m) => m.atPromo[pct]?.marginPercent ?? null },
  ]),
];

// 'product' and 'price' plus every MARGIN_COLUMNS key.
type Sort = { key: string; dir: 'asc' | 'desc' };

function formatMarginValue(value: number | null, kind: MarginColumn['kind']) {
  if (value === null) return '—';
  return kind === 'money' ? value.toFixed(2) : `${value.toFixed(1)}%`;
}

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
  const [costError, setCostError] = useState('');
  const [sort, setSort] = useState<Sort>({ key: 'product', dir: 'asc' });

  useEffect(() => {
    // Wholesale prices come from an admin-only endpoint; if it fails the table still
    // works and the margin columns just show "—".
    const costs = fetch('/api/admin/product-costs')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Record<string, number>>;
      })
      .catch(() => {
        setCostError('Could not load wholesale prices, so margins are not shown.');
        return {} as Record<string, number>;
      });

    Promise.all([
      fetch('/api/products').then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      costs,
    ])
      .then(([data, wholesaleById]: [any[], Record<string, number>]) => {
        const rows: ProductRow[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          brandName: p.brand?.name || 'Unknown',
          image: p.images?.[0] ?? null,
          price: p.price,
          discountAmount: p.discountAmount ?? 0,
          wholesalePrice: wholesaleById[p.id] ?? null,
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

  // Margins use the saved price, so they update after Save rather than while typing.
  const margins = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, computeMargins(p.price, p.discountAmount, p.wholesalePrice)])),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = products.filter((p) => {
      if (lowStockOnly && p.stock > 3) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q);
    });

    // products is already in brand/name order.
    if (sort.key === 'product') return sort.dir === 'asc' ? rows : [...rows].reverse();

    const column = MARGIN_COLUMNS.find((c) => c.key === sort.key);
    const value = (p: ProductRow) => (column ? column.value(margins[p.id]) : p.price);
    // Products without a wholesale price always sort last, whichever the direction.
    return [...rows].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1;
      return sort.dir === 'asc' ? va - vb : vb - va;
    });
  }, [products, query, lowStockOnly, sort, margins]);

  function toggleSort(key: string) {
    setSort((cur) =>
      cur.key === key
        ? { key, dir: cur.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'product' ? 'asc' : 'desc' }
    );
  }

  function sortHeader(key: string, label: string) {
    const active = sort.key === key;
    return (
      <th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className={s.sortBtn} onClick={() => toggleSort(key)}>
          {label}
          <span className={s.sortArrow}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
        </button>
      </th>
    );
  }

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
      <div className={s.page} style={{ marginTop: '100px', maxWidth: '1600px' }}>
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
        {costError && <div className={`${s.banner} ${s.bannerError}`}>{costError}</div>}

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
                  {sortHeader('product', 'Product')}
                  <th>Status</th>
                  {sortHeader('price', 'Price (€)')}
                  <th>Stock</th>
                  <th aria-hidden="true"></th>
                  {MARGIN_COLUMNS.map((c) => (
                    <Fragment key={c.key}>{sortHeader(c.key, c.label)}</Fragment>
                  ))}
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
                      {MARGIN_COLUMNS.map((c) => {
                        const value = c.value(margins[row.id]);
                        const negative = c.key !== 'wholesale' && value !== null && value < 0;
                        return (
                          <td key={c.key} className={`${s.marginCell} ${negative ? s.marginNegative : ''}`}>
                            {formatMarginValue(value, c.kind)}
                          </td>
                        );
                      })}
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
