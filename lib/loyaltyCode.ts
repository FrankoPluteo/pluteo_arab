import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// No I and O, they are too easy to confuse with 1 and 0 when a code is read off an email.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;
const MAX_ATTEMPTS = 5;

export const LOYALTY_DISCOUNT_PERCENT = 20;
export const LOYALTY_CODE_VALID_MS = 7 * 24 * 60 * 60 * 1000;

export function generateLoyaltyCodeString(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export interface LoyaltyPromoCode {
  id: string;
  code: string;
  expiresAt: Date;
}

// Creates a single use, 20% off anything, 7 day promo code in the same PromoCode table
// the influencer codes live in, so checkout, /api/promo and the cart treat it like any
// other code. usageLimitPerUser stays null on purpose: that check counts unpaid orders
// too, which would lock out someone who starts checkout, abandons it and comes back.
// Single use is enforced by usageLimitTotal 1 (timesUsed only rises once payment lands).
//
// Uniqueness is decided by the database (PromoCode.code is unique), so two callers can
// never end up with the same code. A code that also exists as an affiliate code counts
// as a collision, because the cart resolves promo codes before affiliate codes.
export async function createLoyaltyPromoCode(
  options: { now?: Date; generate?: () => string } = {}
): Promise<LoyaltyPromoCode> {
  const now = options.now ?? new Date();
  const generate = options.generate ?? generateLoyaltyCodeString;
  const expiresAt = new Date(now.getTime() + LOYALTY_CODE_VALID_MS);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const code = generate();

    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode: code },
      select: { id: true },
    });
    if (affiliate) continue;

    try {
      const created = await prisma.promoCode.create({
        data: {
          code,
          discountType: 'percent',
          discountValue: LOYALTY_DISCOUNT_PERCENT,
          usageLimitTotal: 1,
          endsAt: expiresAt,
          createdAt: now,
        },
        select: { id: true, code: true, endsAt: true },
      });
      return { id: created.id, code: created.code, expiresAt: created.endsAt! };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Could not generate a unique loyalty code after ${MAX_ATTEMPTS} attempts`);
}
