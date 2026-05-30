import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/affiliates/dashboard — affiliate login (email + code)
export async function POST(request: Request) {
  try {
    const { email, affiliateCode } = await request.json();

    if (!email || !affiliateCode) {
      return NextResponse.json({ error: 'Email and affiliate code are required.' }, { status: 400 });
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        affiliateCode: affiliateCode.toUpperCase().trim(),
      },
      include: {
        conversions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid email or affiliate code.' }, { status: 401 });
    }

    type Conv = { commissionAmount: number; status: string };
    const totalEarned = affiliate.conversions.reduce((sum: number, c: Conv) => sum + c.commissionAmount, 0);
    const pendingPayout = affiliate.conversions
      .filter((c: Conv) => c.status === 'pending')
      .reduce((sum: number, c: Conv) => sum + c.commissionAmount, 0);

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        createdAt: affiliate.createdAt,
      },
      stats: {
        totalConversions: affiliate.conversions.length,
        totalEarned,
        pendingPayout,
      },
      conversions: affiliate.conversions.map((c: { id: string; orderId: string; orderValue: number; commissionAmount: number; status: string; createdAt: Date }) => ({
        id: c.id,
        orderId: c.orderId,
        orderValue: c.orderValue,
        commissionAmount: c.commissionAmount,
        status: c.status,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Affiliate dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard.' }, { status: 500 });
  }
}
