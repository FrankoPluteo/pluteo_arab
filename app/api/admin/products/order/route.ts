import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { SHOP_ORDER } from '@/lib/productOrder';

// GET/PUT /api/admin/products/order — the shop's product order (lib/productOrder.ts).
// Protected by middleware.ts (admin_token cookie, checked for every /api/admin/* route).

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, images: true, stock: true, brand: { select: { name: true } } },
      orderBy: SHOP_ORDER,
    });
    return NextResponse.json(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        brandName: p.brand.name,
        image: p.images[0] ?? null,
        stock: p.stock,
      }))
    );
  } catch (error) {
    console.error('Error loading product order:', error);
    return NextResponse.json({ error: 'Could not load products.' }, { status: 500 });
  }
}

// Body: { ids: string[] } — every product id, first shown first.
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string') || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Send every product id once, in order.' }, { status: 400 });
    }

    // The list must match the products that exist right now; otherwise a product added
    // or deleted since the page loaded would end up in an unintended place.
    const current = await prisma.product.findMany({ select: { id: true, sortOrder: true } });
    const known = new Set(current.map((p) => p.id));
    if (current.length !== ids.length || !ids.every((id) => known.has(id))) {
      return NextResponse.json(
        { error: 'The product list changed since this page was opened. Reload and try again.' },
        { status: 409 }
      );
    }

    const positionNow = new Map(current.map((p) => [p.id, p.sortOrder]));
    const updates = (ids as string[])
      .map((id, index) => ({ id, sortOrder: index + 1 }))
      .filter(({ id, sortOrder }) => positionNow.get(id) !== sortOrder);

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map(({ id, sortOrder }) => prisma.product.update({ where: { id }, data: { sortOrder } }))
      );
    }

    // Show the new order straight away instead of after the 60 s caches run out.
    revalidateTag('catalog', { expire: 0 });
    revalidatePath('/');
    revalidatePath('/poklon/[recipient]', 'page');

    console.log(`[admin] Product order saved (${updates.length} positions changed).`);
    return NextResponse.json({ changed: updates.length });
  } catch (error) {
    console.error('Error saving product order:', error);
    return NextResponse.json({ error: 'Could not save the order.' }, { status: 500 });
  }
}
