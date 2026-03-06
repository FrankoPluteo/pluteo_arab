import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RESERVATION_MINUTES = 15;

async function cleanupExpiredReservations() {
  const now = new Date();
  const expired = await prisma.cartReservation.findMany({
    where: { expiresAt: { lt: now } },
  });
  for (const r of expired) {
    try {
      await prisma.product.update({
        where: { id: r.productId },
        data: { stock: { increment: r.quantity } },
      });
      await prisma.cartReservation.delete({ where: { id: r.id } });
    } catch {
      // ignore individual cleanup errors
    }
  }
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

    await cleanupExpiredReservations();

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

    await cleanupExpiredReservations();

    if (delta > 0) {
      const result = await prisma.$transaction(
        async (tx) => {
          const product = await tx.product.findUnique({ where: { id: productId } });
          if (!product) throw new Error('Product not found');
          if (product.stock < delta) throw new Error('Not enough stock available');

          await tx.product.update({
            where: { id: productId },
            data: { stock: { decrement: delta } },
          });

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
        await prisma.product.update({
          where: { id: r.productId },
          data: { stock: { increment: r.quantity } },
        });
        await prisma.cartReservation.delete({ where: { id: r.id } });
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
