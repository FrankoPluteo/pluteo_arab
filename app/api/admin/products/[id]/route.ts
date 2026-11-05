import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Sanity ceiling — catches fat-finger entry (e.g. an extra digit) without hand-tuning
// a real business limit. Well above any real product price in this store.
const MAX_PRICE = 100_000;
const MAX_STOCK = 1_000_000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// PATCH /api/admin/products/:id — update price, stock, the gift-page flags and/or the
// homepage spotlight only.
// Protected by middleware.ts (admin_token cookie, checked for every /api/admin/* route).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Explicit allowlist: only these fields can ever be changed here, regardless
    // of what other fields a request body might contain.
    const data: {
      price?: number;
      stock?: number;
      isGiftMen?: boolean;
      isGiftWomen?: boolean;
      isSpotlight?: boolean;
    } = {};

    if ('price' in body) {
      const price = body.price;
      if (!isFiniteNumber(price) || price < 0 || price > MAX_PRICE) {
        return NextResponse.json(
          { error: `Price must be a number between 0 and ${MAX_PRICE}.` },
          { status: 400 }
        );
      }
      data.price = Math.round(price * 100) / 100;
    }

    if ('stock' in body) {
      const stock = body.stock;
      if (!isFiniteNumber(stock) || !Number.isInteger(stock) || stock < 0 || stock > MAX_STOCK) {
        return NextResponse.json(
          { error: `Stock must be a whole number between 0 and ${MAX_STOCK}.` },
          { status: 400 }
        );
      }
      data.stock = stock;
    }

    for (const flag of ['isGiftMen', 'isGiftWomen', 'isSpotlight'] as const) {
      if (flag in body) {
        if (typeof body[flag] !== 'boolean') {
          return NextResponse.json({ error: `${flag} must be true or false.` }, { status: 400 });
        }
        data[flag] = body[flag];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields provided.' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const select = {
      id: true,
      name: true,
      price: true,
      stock: true,
      discountAmount: true,
      isGiftMen: true,
      isGiftWomen: true,
      isSpotlight: true,
    } as const;

    // Only one product can hold the homepage spotlight, so taking it clears every other.
    const product =
      data.isSpotlight === true
        ? (
            await prisma.$transaction([
              prisma.product.updateMany({
                where: { isSpotlight: true, id: { not: id } },
                data: { isSpotlight: false },
              }),
              prisma.product.update({ where: { id }, data, select }),
            ])
          )[1]
        : await prisma.product.update({ where: { id }, data, select });

    console.log(`[admin] Product ${product.id} (${product.name}) updated:`, data);

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product.' },
      { status: 500 }
    );
  }
}
