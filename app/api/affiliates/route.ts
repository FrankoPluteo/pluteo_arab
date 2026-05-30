import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/affiliates — public registration
export async function POST(request: Request) {
  try {
    const { name, email, affiliateCode, iban, acceptedTerms } = await request.json();

    if (!name || !email || !affiliateCode) {
      return NextResponse.json({ error: 'Name, email, and affiliate code are required.' }, { status: 400 });
    }

    if (!acceptedTerms) {
      return NextResponse.json({ error: 'You must accept the terms and conditions.' }, { status: 400 });
    }

    const code = affiliateCode.toUpperCase().replace(/\s+/g, '');

    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      return NextResponse.json(
        { error: 'Affiliate code must be 3–20 characters, letters, numbers, hyphens or underscores only.' },
        { status: 400 }
      );
    }

    const existing = await prisma.affiliate.findFirst({
      where: { OR: [{ email }, { affiliateCode: code }] },
    });

    if (existing?.email === email) {
      return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
    }
    if (existing?.affiliateCode === code) {
      return NextResponse.json({ error: 'This affiliate code is already taken.' }, { status: 409 });
    }

    const affiliate = await prisma.affiliate.create({
      data: { name, email, affiliateCode: code, iban: iban || null, status: 'pending', acceptedTermsAt: new Date() },
    });

    return NextResponse.json({ id: affiliate.id, affiliateCode: affiliate.affiliateCode }, { status: 201 });
  } catch (error: any) {
    console.error('Affiliate registration error:', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
