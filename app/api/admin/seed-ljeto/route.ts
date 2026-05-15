import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const promo = await prisma.promoCode.upsert({
    where: { code: 'LJETO15' },
    update: { endsAt, isActive: true },
    create: {
      code: 'LJETO15',
      discountType: 'percent',
      discountValue: 15,
      minOrderValue: 0,
      endsAt,
      isActive: true,
      appliesToSaleItems: true,
      freeShipping: false,
      stackable: false,
    },
  });

  return NextResponse.json({ success: true, code: promo.code, endsAt: promo.endsAt });
}
