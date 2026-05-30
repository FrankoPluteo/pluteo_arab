import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/affiliates/check-code?code=XYZ — check code availability
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.toUpperCase().replace(/\s+/g, '');

  if (!code) {
    return NextResponse.json({ available: false, error: 'Code is required.' }, { status: 400 });
  }

  const existing = await prisma.affiliate.findUnique({ where: { affiliateCode: code } });
  return NextResponse.json({ available: !existing });
}
