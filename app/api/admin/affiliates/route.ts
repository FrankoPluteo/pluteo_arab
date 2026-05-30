import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/affiliates — list all affiliates with stats
export async function GET() {
  try {
    const affiliates = await prisma.affiliate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { conversions: true },
    });

    const result = affiliates.map((a: typeof affiliates[number]) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      affiliateCode: a.affiliateCode,
      status: a.status,
      iban: a.iban,
      createdAt: a.createdAt,
      totalEarned: a.conversions.reduce((sum: number, c: { commissionAmount: number }) => sum + c.commissionAmount, 0),
      pendingPayout: a.conversions
        .filter((c: { status: string }) => c.status === 'pending')
        .reduce((sum: number, c: { commissionAmount: number }) => sum + c.commissionAmount, 0),
      totalConversions: a.conversions.length,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin affiliates error:', error);
    return NextResponse.json({ error: 'Failed to load affiliates.' }, { status: 500 });
  }
}
