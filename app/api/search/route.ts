import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (q.length < 2) {
    return NextResponse.json({ products: [], total: 0 });
  }

  const where = {
    OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { brand: { name: { contains: q, mode: 'insensitive' as const } } },
      { fragranceProfiles: { has: q.toLowerCase() } },
    ],
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        discountAmount: true,
        images: true,
        brand: { select: { name: true } },
      },
      orderBy: [{ isBestSeller: 'desc' }, { isFeatured: 'desc' }],
      take: 6,
    }),
    // All matches, not just the 6 shown: search_performed reports it as results_count.
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total });
}
