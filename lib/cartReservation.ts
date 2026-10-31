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
 * without a completed payment. With `expiringBy`, only holds that end by then are
 * released: an expired Stripe session must not take back the holds a newer checkout
 * from the same cart has since extended.
 */
export async function releaseCartReservations(cartSessionId: string, expiringBy?: Date) {
  const expiryFilter = expiringBy ? { expiresAt: { lte: expiringBy } } : {};
  const reservations = await prisma.cartReservation.findMany({
    where: { cartSessionId, ...expiryFilter },
  });

  for (const r of reservations) {
    try {
      // delete + increment in one transaction: a partial failure can't leave the
      // reservation alive after stock was already restored (which would let a
      // later cleanup pass double-restore it). Stock is restored only if the row was
      // still as read above, so a hold resized or extended meanwhile is left alone.
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.cartReservation.deleteMany({
          where: { id: r.id, quantity: r.quantity, ...expiryFilter },
        });
        if (count === 0) return;
        await tx.product.update({
          where: { id: r.productId },
          data: { stock: { increment: r.quantity } },
        });
      });
    } catch {
      // continue releasing the rest even if one fails
    }
  }
}

export interface CartLine {
  productId: string;
  quantity: number;
}

/** A cart line whose stock is gone, with how many units this cart could still have. */
export interface UnavailableLine {
  productId: string;
  available: number;
}

/**
 * Makes the cart session hold exactly each line's quantity until at least `holdUntil`:
 * extends a hold that is still there (even if past its expiry but not yet cleaned up),
 * re-reserves one that has lapsed, tops up a short one and gives back any surplus.
 * Returns the lines that could not be held because the stock is genuinely gone. Each
 * line is its own transaction, so one sold-out product never undoes the others.
 */
export async function ensureCartReservations(
  cartSessionId: string,
  lines: CartLine[],
  holdUntil: Date
): Promise<UnavailableLine[]> {
  const unavailable: UnavailableLine[] = [];

  for (const { productId, quantity } of lines) {
    const missing = await prisma.$transaction(async (tx): Promise<UnavailableLine | null> => {
      // FOR UPDATE: a concurrent cleanupExpiredReservations DELETE waits on this row and
      // then re-checks its expiry, so it can't restore stock for a hold extended here.
      const [held] = await tx.$queryRaw<{ id: string; quantity: number; expiresAt: Date }[]>`
        SELECT id, quantity, "expiresAt" FROM "CartReservation"
        WHERE "cartSessionId" = ${cartSessionId} AND "productId" = ${productId}
        FOR UPDATE
      `;
      const heldQty = held?.quantity ?? 0;
      const diff = quantity - heldQty;

      if (diff > 0) {
        // Same atomic guard as POST /api/cart/reserve: never takes stock below 0.
        const updated = await tx.product.updateMany({
          where: { id: productId, stock: { gte: diff } },
          data: { stock: { decrement: diff } },
        });
        if (updated.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { stock: true },
          });
          return { productId, available: (product?.stock ?? 0) + heldQty };
        }
      } else if (diff < 0) {
        // The webhook deletes the whole hold on payment, so a surplus would never return.
        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: -diff } },
        });
      }

      const expiresAt = held && held.expiresAt > holdUntil ? held.expiresAt : holdUntil;
      if (held) {
        await tx.cartReservation.update({ where: { id: held.id }, data: { quantity, expiresAt } });
      } else {
        await tx.cartReservation.create({ data: { cartSessionId, productId, quantity, expiresAt } });
      }
      return null;
    });

    if (missing) unavailable.push(missing);
  }

  return unavailable;
}

/** Parses `[{ productId, quantity }]` from a request body, or null if malformed. */
export function parseCartLines(value: unknown): CartLine[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const lines: CartLine[] = [];
  for (const line of value) {
    if (
      typeof line?.productId !== 'string' ||
      !Number.isInteger(line?.quantity) ||
      line.quantity <= 0
    ) {
      return null;
    }
    lines.push({ productId: line.productId, quantity: line.quantity });
  }
  return lines;
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
