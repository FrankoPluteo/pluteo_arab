import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/brands/:id — update any combination of logoUrl, description, websiteUrl
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, string | null> = {};
    if ('logoUrl' in body) data.logoUrl = body.logoUrl ?? null;
    if ('description' in body) data.description = body.description || null;
    if ('websiteUrl' in body) data.websiteUrl = body.websiteUrl || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields provided.' }, { status: 400 });
    }

    const brand = await prisma.brand.update({
      where: { id },
      data,
      select: { id: true, name: true, logoUrl: true, description: true, websiteUrl: true },
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
