import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCode } from '@/lib/promoCode';

// POST /api/affiliates/validate — validate an affiliate code at checkout
export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const affiliateCode = normalizeCode(code);
    if (!affiliateCode) return NextResponse.json({ valid: false });

    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode },
      select: { id: true, status: true, name: true },
    });

    if (!affiliate || affiliate.status !== 'active') {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, name: affiliate.name });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
