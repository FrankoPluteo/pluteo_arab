import { prisma } from '@/lib/prisma';
import { codeLookupCandidates } from '@/lib/promoCode';

export type PromoRejection =
  | 'not_found'
  | 'not_started'
  | 'expired'
  | 'usage_limit'
  | 'min_order'
  | 'per_user'
  | 'product_restriction';

export type PromoEvaluation =
  | { valid: true; code: string; discountAmount: number; freeShipping: boolean; message: string }
  | { valid: false; reason: PromoRejection; message: string };

interface PromoContext {
  subtotal: number;
  customerEmail?: string;
  cartItems?: { product?: { name?: string }; name?: string }[];
}

/** The rules /api/promo applies to a code, in order; the first one that fails is the reason. */
export async function evaluatePromo(rawCode: unknown, { subtotal, customerEmail, cartItems }: PromoContext): Promise<PromoEvaluation> {
  // "petra 15", " Petra15" and "PETRA15" are the same code.
  const candidates = codeLookupCandidates(rawCode);
  if (candidates.length === 0) {
    return { valid: false, reason: 'not_found', message: 'Enter a promo code.' };
  }

  const promo = await prisma.promoCode.findFirst({
    where: { code: { in: candidates } },
  });

  if (!promo || !promo.isActive) {
    return { valid: false, reason: 'not_found', message: 'Invalid promo code.' };
  }

  const now = new Date();

  if (promo.startsAt && now < promo.startsAt) {
    return { valid: false, reason: 'not_started', message: 'This promo code is not yet active.' };
  }

  if (promo.endsAt && now > promo.endsAt) {
    return { valid: false, reason: 'expired', message: 'This promo code has expired.' };
  }

  if (promo.usageLimitTotal !== null && promo.timesUsed >= promo.usageLimitTotal) {
    return { valid: false, reason: 'usage_limit', message: 'This promo code has reached its usage limit.' };
  }

  if (subtotal < promo.minOrderValue) {
    return {
      valid: false,
      reason: 'min_order',
      message: `Minimum order of €${promo.minOrderValue.toFixed(2)} required for this code.`,
    };
  }

  if (promo.usageLimitPerUser !== null && customerEmail) {
    const userUsageCount = await prisma.order.count({
      where: { customerEmail, promoCode: promo.code },
    });
    if (userUsageCount >= promo.usageLimitPerUser) {
      return {
        valid: false,
        reason: 'per_user',
        message: 'You have already used this promo code the maximum number of times.',
      };
    }
  }

  // Check product restriction
  if (promo.requiredProductNames.length > 0) {
    const cartProductNames: string[] = (cartItems || []).map(
      (item) => item.product?.name ?? item.name ?? ''
    );
    const hasRequired = promo.requiredProductNames.some((required) =>
      cartProductNames.some((name) => name.toLowerCase() === required.toLowerCase())
    );
    if (!hasRequired) {
      return {
        valid: false,
        reason: 'product_restriction',
        message: 'This promo code only applies to selected products. Make sure one of the eligible perfumes is in your cart.',
      };
    }
  }

  let discountAmount = 0;
  if (promo.discountType === 'percent') {
    discountAmount = (subtotal * promo.discountValue) / 100;
    if (promo.maxDiscountAmount !== null) {
      discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
    }
  } else {
    discountAmount = promo.discountValue;
  }
  discountAmount = parseFloat(Math.min(discountAmount, subtotal).toFixed(2));

  const label =
    promo.discountType === 'percent'
      ? `${promo.discountValue}% off`
      : `€${promo.discountValue.toFixed(2)} off`;

  return {
    valid: true,
    code: promo.code,
    discountAmount,
    freeShipping: promo.freeShipping,
    message: `${label} applied`,
  };
}
