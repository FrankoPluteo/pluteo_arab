import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/affiliates/validate — validate an affiliate code at checkout
export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ valid: false });

    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode: code.toUpperCase().trim() },
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
