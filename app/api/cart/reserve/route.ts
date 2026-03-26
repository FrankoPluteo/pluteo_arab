import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RESERVATION_MINUTES = 15;

async function cleanupExpiredReservations() {
  // Bug 2 fix: DELETE...RETURNING is atomic — concurrent callers each get disjoint
  // rows, so no reservation is ever double-processed and stock is never double-restored.
  const expired = await prisma.$queryRaw<
    { id: string; productId: string; quantity: number }[]
  >`
    DELETE FROM "CartReservation"
    WHERE "expiresAt" < NOW()
    RETURNING id, "productId", quantity
  `;

  if (expired.length === 0) return;

  // Group by productId to issue one UPDATE per product instead of N.
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
 * GET /api/cart/reserve?cartSessionId=...
 * Returns the earliest active reservation expiry for this cart session.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cartSessionId = url.searchParams.get('cartSessionId');

    if (!cartSessionId) {
      return NextResponse.json({ expiresAt: null });
    }

    // Bug 6 fix: fire-and-forget so GET response is not blocked by cleanup.
    cleanupExpiredReservations().catch(console.error);

    const earliest = await prisma.cartReservation.findFirst({
      where: { cartSessionId },
      orderBy: { expiresAt: 'asc' },
    });

    return NextResponse.json({
      expiresAt: earliest ? earliest.expiresAt.getTime() : null,
    });
  } catch (error: any) {
    console.error('GET reservation error:', error);
    return NextResponse.json({ expiresAt: null });
  }
}

/**
 * POST /api/cart/reserve
 * Body: { cartSessionId, productId, delta }
 * delta > 0 → reserve more (decrement stock)
 * delta < 0 → release units (restore stock)
 */
export async function POST(request: Request) {
  try {
    const { cartSessionId, productId, delta } = await request.json();

    if (!cartSessionId || !productId || typeof delta !== 'number' || delta === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Bug 6 fix: run cleanup in the background so it never blocks the response.
    cleanupExpiredReservations().catch(console.error);

    if (delta > 0) {
      const result = await prisma.$transaction(
        async (tx) => {
          // Bug 1 fix: single atomic UPDATE with the stock guard in the WHERE clause.
          // This is equivalent to: UPDATE ... SET stock = stock - delta WHERE stock >= delta
          // The DB acquires a row-level lock, so no two concurrent transactions can
          // both pass the check and both decrement — no TOCTOU race, no serialization errors.
          const updated = await tx.product.updateMany({
            where: { id: productId, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });

          if (updated.count === 0) {
            const exists = await tx.product.findUnique({
              where: { id: productId },
              select: { id: true },
            });
            throw new Error(exists ? 'Not enough stock available' : 'Product not found');
          }

          const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

          const existing = await tx.cartReservation.findUnique({
            where: { cartSessionId_productId: { cartSessionId, productId } },
          });

          if (existing) {
            await tx.cartReservation.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + delta, expiresAt },
            });
          } else {
            await tx.cartReservation.create({
              data: { cartSessionId, productId, quantity: delta, expiresAt },
            });
          }

          return { expiresAt: expiresAt.getTime() };
        },
        { isolationLevel: 'RepeatableRead' }
      );

      return NextResponse.json({ success: true, expiresAt: result.expiresAt });
    } else {
      // Release stock
      const releaseQty = Math.abs(delta);

      await prisma.$transaction(async (tx) => {
        const existing = await tx.cartReservation.findUnique({
          where: { cartSessionId_productId: { cartSessionId, productId } },
        });

        if (!existing) return;

        const actualRelease = Math.min(releaseQty, existing.quantity);
        const newQty = existing.quantity - actualRelease;

        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: actualRelease } },
        });

        if (newQty <= 0) {
          await tx.cartReservation.delete({ where: { id: existing.id } });
        } else {
          await tx.cartReservation.update({
            where: { id: existing.id },
            data: { quantity: newQty },
          });
        }
      });

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Cart reserve error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/reserve
 * Body: { cartSessionId }
 * Releases ALL reservations for this cart session (called when timer expires).
 */
export async function DELETE(request: Request) {
  try {
    const { cartSessionId } = await request.json();
    if (!cartSessionId) {
      return NextResponse.json({ error: 'Missing cartSessionId' }, { status: 400 });
    }

    const reservations = await prisma.cartReservation.findMany({
      where: { cartSessionId },
    });

    for (const r of reservations) {
      try {
        // Bug 4 fix: wrap increment + delete in a transaction so a partial failure
        // (increment succeeds, delete fails) cannot leave the reservation alive while
        // stock was already restored — preventing a double-restore on the next cleanup.
        await prisma.$transaction([
          prisma.product.update({
            where: { id: r.productId },
            data: { stock: { increment: r.quantity } },
          }),
          prisma.cartReservation.delete({ where: { id: r.id } }),
        ]);
      } catch {
        // continue releasing others even if one fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart clear error:', error);
    return NextResponse.json({ error: 'Failed to clear reservations' }, { status: 500 });
  }
}
