import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Campaign: Mon 19 May 2026 17:00 CEST → Mon 2 Jun 2026 17:00 CEST (= 15:00 UTC)
  const startsAt = new Date('2026-05-19T15:00:00.000Z');
  const endsAt   = new Date('2026-06-02T15:00:00.000Z');

  const promo = await prisma.promoCode.upsert({
    where: { code: 'LJETO15' },
    update: { startsAt, endsAt, isActive: true },
    create: {
      code: 'LJETO15',
      discountType: 'percent',
      discountValue: 15,
      minOrderValue: 0,
      startsAt,
      endsAt,
      isActive: true,
      appliesToSaleItems: true,
      freeShipping: false,
      stackable: false,
    },
  });

  return NextResponse.json({ success: true, code: promo.code, endsAt: promo.endsAt });
}
