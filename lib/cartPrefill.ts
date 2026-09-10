'use client';

import { useEffect, useRef, useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/lib/store';

/**
 * Share-link cart prefill.
 *
 * Lets a single URL open the cart with items already in it and a code applied:
 *
 *   /cart?add=<productId>&promo=PLUTEO15
 *   /cart?add=<productId>:2&add=<otherProductId>&promo=PLUTEO15
 *   /cart?add=<productId>&qty=3
 *
 * `promo` accepts a promo code OR an affiliate code — it is resolved exactly the
 * way a manually typed code is on the cart page (promo first, affiliate second).
 * `code` and `ref` are accepted as aliases so campaign links can read naturally.
 *
 * Every add goes through /api/cart/reserve, so a link can never oversell stock:
 * items that are gone are silently skipped and reported back as an error string.
 */

const MAX_QTY_PER_LINK = 10;

interface AddSpec {
  productId: string;
  quantity: number;
}

export interface CartPrefillState {
  /** True while the link is still being applied — the cart is not really empty yet. */
  pending: boolean;
  /** Set when part of the link could not be applied (sold out, bad code). */
  error: string;
}

function parseAddSpecs(params: URLSearchParams): AddSpec[] {
  const raw = params.getAll('add').flatMap((value) => value.split(','));
  const fallbackQty = parseInt(params.get('qty') || '', 10);

  const specs: AddSpec[] = [];
  for (const entry of raw) {
    const [id, qtyPart] = entry.trim().split(':');
    if (!id) continue;

    const parsed = parseInt(qtyPart ?? '', 10);
    const quantity = Number.isFinite(parsed)
      ? parsed
      : Number.isFinite(fallbackQty)
        ? fallbackQty
        : 1;

    specs.push({
      productId: id,
      quantity: Math.min(Math.max(quantity, 1), MAX_QTY_PER_LINK),
    });
  }
  return specs;
}

/** Resolve after the persisted cart has been rehydrated from localStorage. */
function whenHydrated(): Promise<void> {
  if (useCart.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useCart.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/**
 * @param onReservation Called with the expiry of the reservations the link created,
 *   so the cart page can start its countdown without re-querying.
 */
export function useCartPrefill(onReservation?: (expiresAt: number) => void): CartPrefillState {
  // Read the URL during the first client render so the cart can show a loading
  // state instead of flashing "your cart is empty" before the link is applied.
  const [pending, setPending] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.getAll('add').length > 0 || hasCodeParam(params);
  });
  const [error, setError] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (!pending || hasRun.current) return;
    hasRun.current = true;

    async function applyLink() {
      const params = new URLSearchParams(window.location.search);
      const specs = parseAddSpecs(params);
      const code = (
        params.get('promo') ||
        params.get('code') ||
        params.get('ref') ||
        ''
      )
        .trim()
        .toUpperCase();

      await whenHydrated();

      const problems: string[] = [];
      let latestExpiresAt: number | null = null;

      for (const spec of specs) {
        // Idempotent: re-opening or sharing the link never stacks quantities.
        if (useCart.getState().items.some((i) => i.product.id === spec.productId)) {
          continue;
        }

        const productRes = await fetch(`/api/products/${encodeURIComponent(spec.productId)}`);
        if (!productRes.ok) continue;
        const product: Product = await productRes.json();

        const reserveRes = await fetch('/api/cart/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartSessionId: useCart.getState().cartSessionId,
            productId: spec.productId,
            delta: spec.quantity,
          }),
        });
        const reserveData = await reserveRes.json();

        if (!reserveRes.ok) {
          problems.push(`${product.name} — ${reserveData.error || 'out of stock'}`);
          continue;
        }

        useCart.getState().addItem(product);
        if (spec.quantity > 1) {
          useCart.getState().updateQuantity(spec.productId, spec.quantity);
        }
        if (reserveData.expiresAt) latestExpiresAt = reserveData.expiresAt;
      }

      if (code) {
        const applied = await applyCodeFromLink(code);
        if (!applied) problems.push(`Code ${code} could not be applied.`);
      }

      if (latestExpiresAt) onReservation?.(latestExpiresAt);
      if (problems.length) setError(problems.join(' · '));

      // Drop the params so a refresh (or a copied URL) is just the plain cart.
      window.history.replaceState({}, '', window.location.pathname);
    }

    applyLink()
      .catch(() => setError('Could not open that cart link. Please try again.'))
      .finally(() => setPending(false));
  }, [pending, onReservation]);

  return { pending, error };
}

function hasCodeParam(params: URLSearchParams): boolean {
  return Boolean(params.get('promo') || params.get('code') || params.get('ref'));
}

/** Same promo-then-affiliate resolution the manual code form uses. */
async function applyCodeFromLink(code: string): Promise<boolean> {
  const state = useCart.getState();

  const promoRes = await fetch('/api/promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      subtotal: state.getTotalPrice(),
      cartItems: state.items.map((item) => ({ product: { name: item.product.name } })),
    }),
  });
  const promoData = await promoRes.json();
  if (promoData.valid) {
    state.applyPromo(promoData.code, promoData.discountAmount, promoData.freeShipping);
    return true;
  }

  const affRes = await fetch('/api/affiliates/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const affData = await affRes.json();
  if (affData.valid) {
    state.applyAffiliate(code, affData.name);
    return true;
  }

  return false;
}
