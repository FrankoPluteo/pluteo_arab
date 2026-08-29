import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
        { fragranceProfiles: { has: q.toLowerCase() } },
      ],
    },
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
  });

  return NextResponse.json({ products });
}
