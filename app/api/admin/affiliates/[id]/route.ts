import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/affiliates/[id] — single affiliate detail with conversions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: { conversions: { orderBy: { createdAt: 'desc' } } },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found.' }, { status: 404 });
    }

    return NextResponse.json(affiliate);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load affiliate.' }, { status: 500 });
  }
}

// PATCH /api/admin/affiliates/[id] — update status or mark conversions as paid
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status) {
      const allowed = ['pending', 'active', 'suspended'];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      const updated = await prisma.affiliate.update({
        where: { id },
        data: { status: body.status },
      });
      return NextResponse.json(updated);
    }

    if (body.markPaid === true) {
      // Mark all pending conversions for this affiliate as paid
      const { count } = await prisma.affiliateConversion.updateMany({
        where: { affiliateId: id, status: 'pending' },
        data: { status: 'paid' },
      });
      return NextResponse.json({ updated: count });
    }

    return NextResponse.json({ error: 'No valid action provided.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin affiliate PATCH error:', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
