import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/brands/:id
// Body: { logoUrl: string | null }
// Protected by middleware (admin_token cookie required)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { logoUrl } = await request.json();

    const brand = await prisma.brand.update({
      where: { id },
      data: { logoUrl: logoUrl ?? null },
      select: { id: true, name: true, logoUrl: true },
    });

    return NextResponse.json(brand);
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update brand' },
      { status: 500 }
    );
  }
}
