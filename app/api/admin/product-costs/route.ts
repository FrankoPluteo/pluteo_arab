import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/product-costs — wholesale price per product id, for the admin margin columns.
// Protected by middleware.ts (admin_token cookie, checked for every /api/admin/* route).
// Kept separate from the public /api/products so purchase prices never reach the storefront.
export async function GET() {
  try {
    const costs = await prisma.productCost.findMany({
      where: { wholesalePrice: { not: null } },
      select: { productId: true, wholesalePrice: true },
    });

    const byProduct: Record<string, number> = {};
    for (const c of costs) byProduct[c.productId] = Number(c.wholesalePrice);

    return NextResponse.json(byProduct);
  } catch (error) {
    console.error('Error loading product costs:', error);
    return NextResponse.json({ error: 'Failed to load wholesale prices.' }, { status: 500 });
  }
}
