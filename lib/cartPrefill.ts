'use client';

import { useEffect, useRef, useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/lib/store';
import { productProps, track, trackPromo, type PromoSource } from '@/lib/analytics';
import { getUrlCode } from '@/lib/attribution';

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

export type CodeProblemKey = 'invalid' | 'expired' | 'used' | 'notStarted' | 'notApplicable';

/** Maps an /api/promo rejection `reason` to a key of t.cart.codeProblems. */
export function codeProblemKey(reason: string | undefined): CodeProblemKey {
  switch (reason) {
    case 'expired':
      return 'expired';
    case 'usage_limit':
    case 'per_user':
      return 'used';
    case 'not_started':
      return 'notStarted';
    case 'min_order':
    case 'product_restriction':
      return 'notApplicable';
    default:
      return 'invalid';
  }
}

/**
 * A neutral (never red) note about a code the customer did not type: one from a link or
 * one the cart's re-check dropped. Red errors are only for codes typed into the field.
 *   gone           the code is dead (unknown, expired, used up, not started yet)
 *   notApplicable  the code exists but doesn't fit this cart (minimum order, products)
 *   fallback       a dead link code was replaced by the current campaign code
 */
export type CodeNotice =
  | { kind: 'gone' }
  | { kind: 'notApplicable' }
  | { kind: 'fallback'; code: string };

export function noticeForProblem(problem: CodeProblemKey): CodeNotice {
  return problem === 'notApplicable' ? { kind: 'notApplicable' } : { kind: 'gone' };
}

export interface CartPrefillState {
  /** True while the link is still being applied — the cart is not really empty yet. */
  pending: boolean;
  /** Set when part of the link could not be applied (sold out). */
  error: string;
  /** Set when the link's code could not be applied as it was. */
  codeNotice: CodeNotice | null;
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
  const [codeNotice, setCodeNotice] = useState<CodeNotice | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!pending || hasRun.current) return;
    hasRun.current = true;

    async function applyLink() {
      const params = new URLSearchParams(window.location.search);
      const specs = parseAddSpecs(params);
      const code = getUrlCode(params);

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
        track('add_to_cart', { ...productProps(product), quantity: spec.quantity, source: 'url_param' });
        if (reserveData.expiresAt) latestExpiresAt = reserveData.expiresAt;
      }

      if (code) {
        const result = await applyCodeFromLink(code, 'url');
        if (!result.applied) setCodeNotice(result.notice);
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

  return { pending, error, codeNotice };
}

/**
 * Pre-applies a code on a campaign landing page, the same way a /cart?promo= link does.
 * Leaves the cart alone if that code is already applied.
 * @param source 'url' when the code came from the link, 'landing' for the page's own code
 */
export async function applyLandingCode(code: string, source: PromoSource) {
  await whenHydrated();
  const { promoCode, affiliateCode } = useCart.getState();
  if (promoCode === code || affiliateCode === code) return { applied: true } as const;
  return applyCodeFromLink(code, source);
}

function hasCodeParam(params: URLSearchParams): boolean {
  return Boolean(params.get('promo') || params.get('code') || params.get('ref'));
}

interface FallbackPromo {
  code: string;
  discountAmount: number;
  freeShipping: boolean;
  percent: number | null;
  deferred?: boolean;
}

/**
 * Same promo-then-affiliate resolution the manual code form uses, but a code that fails
 * is never shown as an error: the visitor didn't type it. It is dropped quietly, or, when
 * FALLBACK_PROMO_CODE is set on the server, replaced by the current campaign code.
 */
async function applyCodeFromLink(
  code: string,
  source: PromoSource
): Promise<{ applied: true } | { applied: false; notice: CodeNotice }> {
  const state = useCart.getState();

  const promoRes = await fetch('/api/promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      subtotal: state.getTotalPrice(),
      cartItems: state.items.map((item) => ({ product: { name: item.product.name } })),
      // Ask for the current campaign code in case this one is dead.
      fallback: true,
    }),
  });
  const promoData = await promoRes.json();
  if (promoData.valid) {
    state.applyPromo(promoData.code, promoData.discountAmount, promoData.freeShipping, promoData.percent);
    trackPromo({ code: promoData.code, code_type: 'promo', source, success: true, discount: promoData.discountAmount });
    return { applied: true };
  }

  // Emailed links are often opened with an empty cart. Minimum order and product rules can't
  // be judged yet, so keep the code and let the cart re-check it once items are added.
  if (
    state.items.length === 0 &&
    (promoData.reason === 'min_order' || promoData.reason === 'product_restriction')
  ) {
    state.applyPromo(code, 0, false);
    trackPromo({ code, code_type: 'promo', source, success: true, deferred: true, server_reason: promoData.reason });
    return { applied: true };
  }

  const affRes = await fetch('/api/affiliates/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const affData = await affRes.json();
  if (affData.valid) {
    state.applyAffiliate(code, affData.name);
    trackPromo({ code, code_type: 'affiliate', source, success: true });
    return { applied: true };
  }

  const reason: string = promoData.reason || 'not_found';
  const problem = codeProblemKey(reason);

  // A dead code (not one that merely doesn't fit this cart) is swapped for the current
  // campaign code, unless the customer already has a code of their own applied.
  const fallback: FallbackPromo | undefined = promoData.fallback;
  const current = useCart.getState();
  if (fallback?.code && problem !== 'notApplicable' && !current.promoCode && !current.affiliateCode) {
    current.applyPromo(fallback.code, fallback.discountAmount, fallback.freeShipping, fallback.percent);
    trackPromo({ code, code_type: 'promo', source, success: false, reason, handled: 'fallback' });
    trackPromo({
      code: fallback.code,
      code_type: 'promo',
      source,
      success: true,
      discount: fallback.discountAmount,
      deferred: fallback.deferred || undefined,
      fallback_for: code,
    });
    return { applied: false, notice: { kind: 'fallback', code: fallback.code } };
  }

  trackPromo({ code, code_type: 'promo', source, success: false, reason, handled: 'silent' });
  return { applied: false, notice: noticeForProblem(problem) };
}
