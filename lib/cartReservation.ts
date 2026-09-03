import { prisma } from '@/lib/prisma';

export const RESERVATION_MINUTES = 15;
// Stripe Checkout Sessions require expires_at to be at least 30 minutes out; we pad
// a few minutes above that floor to absorb request latency/clock skew, and reuse the
// same value for the CartReservation hold so the two stay in lockstep for the whole
// checkout-to-payment flow.
export const CHECKOUT_HOLD_MINUTES = 35;

/**
 * Deletes expired reservations and restores their stock. Safe to call opportunistically
 * from any request path — DELETE...RETURNING is atomic, so concurrent callers each get
 * disjoint rows and stock is never double-restored.
 */
export async function cleanupExpiredReservations() {
  const expired = await prisma.$queryRaw<
    { id: string; productId: string; quantity: number }[]
  >`
    DELETE FROM "CartReservation"
    WHERE "expiresAt" < NOW()
    RETURNING id, "productId", quantity
  `;

  if (expired.length === 0) return;

  const byProduct = new Map<string, number>();
  for (const r of expired) {
    byProduct.set(r.productId, (byProduct.get(r.productId) ?? 0) + r.quantity);
  }

  await Promise.all(
    Array.from(byProduct.entries()).map(([productId, qty]) =>
      prisma.product.update({
        where: { id: productId },
        data: { stock: { increment: qty } },
      })
    )
  );
}

/**
 * Releases every reservation for a cart session, restoring stock for each.
 * Used both when a customer's timer runs out client-side and when a Stripe
 * checkout session expires unpaid — those are the two ways a hold ends
 * without a completed payment.
 */
export async function releaseCartReservations(cartSessionId: string) {
  const reservations = await prisma.cartReservation.findMany({
    where: { cartSessionId },
  });

  for (const r of reservations) {
    try {
      // increment + delete in one transaction: a partial failure can't leave the
      // reservation alive after stock was already restored (which would let a
      // later cleanup pass double-restore it).
      await prisma.$transaction([
        prisma.product.update({
          where: { id: r.productId },
          data: { stock: { increment: r.quantity } },
        }),
        prisma.cartReservation.delete({ where: { id: r.id } }),
      ]);
    } catch {
      // continue releasing the rest even if one fails
    }
  }
}

/**
 * Decrements stock for a completed sale without ever going negative or throwing.
 * Used as the last-resort path when a webhook finds no matching reservation left
 * (e.g. the hold genuinely expired mid-payment). GREATEST(...) clamps at 0 so the
 * DB's non-negative CHECK constraint can never be violated here, and a clamp means
 * the item was oversold — logged so it can be reconciled/restocked manually.
 */
export async function safelyDecrementStock(productId: string, quantity: number, context: string) {
  const rows = await prisma.$queryRaw<{ stock: number }[]>`
    UPDATE "Product"
    SET stock = GREATEST(stock - ${quantity}, 0)
    WHERE id = ${productId}
    RETURNING stock
  `;

  if (rows[0] && rows[0].stock === 0) {
    console.error(
      `[stock] Possible oversell while finalizing ${context}: product ${productId} had less than ${quantity} in stock and was clamped to 0. Verify fulfillment manually.`
    );
  }
}
