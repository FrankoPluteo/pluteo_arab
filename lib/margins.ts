// Margin maths for the admin. Computed on read rather than stored, so it stays correct
// whenever price, discountAmount or the wholesale price changes.
//
// Selling prices are used exactly as stored (VAT is not removed) and shipping from the
// supplier is not added to the wholesale price. To work on net prices later, set this
// to 1.25 (Croatian 25% VAT) and every margin below follows.
export const SELLING_PRICE_VAT_DIVISOR = 1;

export const PROMO_DISCOUNTS = [10, 15, 20] as const;
export type PromoDiscount = (typeof PROMO_DISCOUNTS)[number];

export interface MarginAt {
  margin: number;
  marginPercent: number | null;
}

export interface Margins {
  effectivePrice: number;
  wholesalePrice: number | null;
  margin: number | null;
  marginPercent: number | null;
  atPromo: Record<PromoDiscount, MarginAt | null>;
}

function marginAt(sellingPrice: number, wholesalePrice: number): MarginAt {
  const margin = sellingPrice - wholesalePrice;
  return { margin, marginPercent: sellingPrice > 0 ? (margin / sellingPrice) * 100 : null };
}

// A missing wholesale price yields null margins, never a margin computed against 0.
export function computeMargins(price: number, discountAmount: number, wholesalePrice: number | null): Margins {
  const effectivePrice = (price - discountAmount) / SELLING_PRICE_VAT_DIVISOR;

  const atPromo = Object.fromEntries(
    PROMO_DISCOUNTS.map((pct) => [
      pct,
      wholesalePrice === null ? null : marginAt(effectivePrice * (1 - pct / 100), wholesalePrice),
    ])
  ) as Record<PromoDiscount, MarginAt | null>;

  const base = wholesalePrice === null ? null : marginAt(effectivePrice, wholesalePrice);

  return {
    effectivePrice,
    wholesalePrice,
    margin: base?.margin ?? null,
    marginPercent: base?.marginPercent ?? null,
    atPromo,
  };
}
