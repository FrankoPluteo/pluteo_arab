import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Sanity ceiling — catches fat-finger entry (e.g. an extra digit) without hand-tuning
// a real business limit. Well above any real product price in this store.
const MAX_PRICE = 100_000;
const MAX_STOCK = 1_000_000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// PATCH /api/admin/products/:id — update price and/or stock only.
// Protected by middleware.ts (admin_token cookie, checked for every /api/admin/* route).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Explicit allowlist: only price/stock can ever be changed here, regardless of
    // what other fields a request body might contain.
    const data: { price?: number; stock?: number } = {};

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

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields provided.' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      select: { id: true, name: true, price: true, stock: true, discountAmount: true },
    });

    console.log(`[admin] Product ${product.id} (${product.name}) updated:`, data);

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product price/stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product.' },
      { status: 500 }
    );
  }
}
