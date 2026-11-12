import { NextResponse } from 'next/server';
import { evaluatePromo } from '@/lib/promoValidation';
import { normalizeCode } from '@/lib/promoCode';

/**
 * The current campaign code, applied in place of a dead code that arrived in a link
 * (?promo=OLDCODE from an old email or partner post). Leave FALLBACK_PROMO_CODE unset
 * to drop dead link codes without a replacement.
 */
function fallbackPromoCode(): string {
  return normalizeCode(process.env.FALLBACK_PROMO_CODE);
}

export async function POST(request: Request) {
  const { code, subtotal, customerEmail, cartItems, fallback } = await request.json();
  const context = { subtotal: Number(subtotal) || 0, customerEmail, cartItems };

  const result = await evaluatePromo(code, context);
  if (result.valid) return NextResponse.json(result);

  // Only link codes (fallback: true) get a replacement; a code typed by hand that is
  // wrong should say so.
  const fallbackCode = fallback === true ? fallbackPromoCode() : '';
  if (!fallbackCode || fallbackCode === normalizeCode(code)) {
    return NextResponse.json(result);
  }

  const replacement = await evaluatePromo(fallbackCode, context);
  if (replacement.valid) {
    return NextResponse.json({ ...result, fallback: replacement });
  }

  // An emailed link is often opened with an empty cart: like the link's own code, a
  // fallback that only waits on a minimum order or a product is kept and re-checked.
  const waitsForCart = replacement.reason === 'min_order' || replacement.reason === 'product_restriction';
  if (waitsForCart && (!Array.isArray(cartItems) || cartItems.length === 0)) {
    return NextResponse.json({
      ...result,
      fallback: { valid: true, code: fallbackCode, discountAmount: 0, freeShipping: false, deferred: true },
    });
  }

  return NextResponse.json(result);
}
