import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  RESERVATION_MINUTES,
  cleanupExpiredReservations,
  releaseCartReservations,
} from '@/lib/cartReservation';

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

    // Fire-and-forget so this response is not blocked by cleanup.
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

    // Run cleanup in the background so it never blocks the response.
    cleanupExpiredReservations().catch(console.error);

    if (delta > 0) {
      const result = await prisma.$transaction(async (tx) => {
        // Single atomic UPDATE with the stock guard in the WHERE clause — equivalent to
        // UPDATE ... SET stock = stock - delta WHERE stock >= delta. The DB acquires a
        // row-level lock and re-checks the predicate under it, so no two concurrent
        // transactions can both pass the check and both decrement — no TOCTOU race.
        // Default (Read Committed) isolation is enough for this: unlike RepeatableRead,
        // it won't abort concurrent add-to-cart requests on the same product with a
        // serialization error, which used to surface to shoppers as a false "out of
        // stock" even though the item was available.
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
      });

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

    await releaseCartReservations(cartSessionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart clear error:', error);
    return NextResponse.json({ error: 'Failed to clear reservations' }, { status: 500 });
  }
}
