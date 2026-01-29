import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    console.error('Error fetching product:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
