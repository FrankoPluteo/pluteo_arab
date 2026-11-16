'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navbar from '@/components/Navbar';
import s from '@/styles/admin.module.css';

interface OrderRow {
  id: string;
  name: string;
  brandName: string;
  image: string | null;
  stock: number;
}

// Same page size as /products (app/products/page.tsx).
const ITEMS_PER_PAGE = 12;

function stockBadge(stock: number) {
  if (stock <= 0) return { label: 'Out of stock', className: s.badgeDanger };
  if (stock <= 3) return { label: 'Low stock', className: s.badgeWarning };
  return null;
}

function SortableRow({
  row,
  index,
  count,
  disabled,
  onMove,
}: {
  row: OrderRow;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id, disabled });
  const badge = stockBadge(row.stock);
  const pageStart = index % ITEMS_PER_PAGE === 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${s.orderRow} ${isDragging ? s.orderRowDragging : ''}`}
    >
      {pageStart && <div className={s.orderPageLabel}>Page {index / ITEMS_PER_PAGE + 1} on /products</div>}
      <div className={s.orderRowBody}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          className={s.dragHandle}
          aria-label={`Drag ${row.brandName} ${row.name}`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span className={s.orderPosition}>{index + 1}</span>
        {row.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image} alt="" className={s.productThumb} />
        ) : (
          <div className={s.productThumbPlaceholder} />
        )}
        <div className={s.orderName}>
          <div className={s.productCellBrand}>{row.brandName}</div>
          <div className={s.productCellName}>{row.name}</div>
        </div>
        {badge && <span className={`${s.badge} ${badge.className}`}>{badge.label}</span>}
        <div className={s.orderMoveBtns}>
          <button
            type="button"
            className={s.undoBtn}
            onClick={() => onMove(index, 0)}
            disabled={disabled || index === 0}
            aria-label={`Move ${row.name} to the top`}
          >
            Top
          </button>
          <button
            type="button"
            className={s.undoBtn}
            onClick={() => onMove(index, index - 1)}
            disabled={disabled || index === 0}
            aria-label={`Move ${row.name} up`}
          >
            ↑
          </button>
          <button
            type="button"
            className={s.undoBtn}
            onClick={() => onMove(index, index + 1)}
            disabled={disabled || index === count - 1}
            aria-label={`Move ${row.name} down`}
          >
            ↓
          </button>
        </div>
      </div>
    </li>
  );
}

export default function AdminProductOrderPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // A short press before dragging on touch screens, so the list still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch('/api/admin/products/order')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<OrderRow[]>;
      })
      .then((data) => {
        setRows(data);
        setSavedIds(data.map((r) => r.id));
      })
      .catch(() => setMessage({ type: 'error', text: 'Could not load products. Please refresh the page.' }))
      .finally(() => setLoading(false));
  }, []);

  const dirty = rows.some((row, i) => row.id !== savedIds[i]);

  // Unsaved changes would be lost on leaving, so ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return;
    setRows((current) => arrayMove(current, from, to));
    setMessage(null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    move(
      rows.findIndex((r) => r.id === active.id),
      rows.findIndex((r) => r.id === over.id)
    );
  }

  function undo() {
    const byId = new Map(rows.map((r) => [r.id, r]));
    setRows(savedIds.map((id) => byId.get(id)!));
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const ids = rows.map((r) => r.id);
      const res = await fetch('/api/admin/products/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');
      setSavedIds(ids);
      setMessage({ type: 'success', text: 'Order saved. The shop shows it now.' });
    } catch (e) {
      setMessage({ type: 'error', text: (e instanceof Error && e.message) || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className={s.page} style={{ marginTop: '100px', maxWidth: '900px' }}>
        <div className={s.header}>
          <h1 className={s.title}>PRODUCT ORDER</h1>
          <p className={s.subtitle}>
            The order perfumes appear in on /products, the home page rows and the gift pages. Drag a
            row by its handle, or use the buttons, then click Save. New products start at the top.
          </p>
        </div>

        <div className={s.adminNav}>
          <Link href="/admin" className={s.adminNavLink}>Dashboard</Link>
          <Link href="/admin/products" className={s.adminNavLink}>Stock &amp; Price</Link>
          <Link href="/admin/products/order" className={`${s.adminNavLink} ${s.adminNavLinkActive}`}>Order</Link>
          <Link href="/admin/products/add" className={s.adminNavLink}>Add Product</Link>
          <Link href="/admin/brands" className={s.adminNavLink}>Brands</Link>
          <Link href="/admin/affiliates" className={s.adminNavLink}>Affiliates</Link>
        </div>

        {message && (
          <div className={`${s.banner} ${message.type === 'success' ? s.bannerSuccess : s.bannerError}`}>
            {message.text}
          </div>
        )}

        <p className={s.hint} style={{ marginBottom: 16 }}>
          On the home page and gift pages, sold-out perfumes still move behind the ones in stock.
        </p>

        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '60px 0' }}>Loading products…</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ol className={s.orderList}>
                {rows.map((row, index) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    index={index}
                    count={rows.length}
                    disabled={saving}
                    onMove={move}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}

        {!loading && rows.length > 0 && (
          <div className={s.orderSaveBar}>
            <span className={s.hint}>{dirty ? 'You have unsaved changes.' : 'No unsaved changes.'}</span>
            <div className={s.productActionsRow}>
              {dirty && (
                <button type="button" className={s.undoBtn} onClick={undo} disabled={saving}>
                  Undo changes
                </button>
              )}
              <button type="button" className={s.saveBtn} onClick={save} disabled={!dirty || saving}>
                {saving ? 'Saving…' : 'Save order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
