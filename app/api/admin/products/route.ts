import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      brandName,
      size,
      price,
      images,
      concentration,
      gender,
      description,
      discountAmount,
      isFeatured,
      isBestSeller,
      stock,
      topNotes,
      heartNotes,
      baseNotes,
    } = body;

    // Find or create brand
    let brand = await prisma.brand.findUnique({
      where: { name: brandName },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: brandName,
          description: `${brandName} perfumes`,
        },
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        brandId: brand.id,
        size,
        price,
        images,
        concentration,
        gender,
        description,
        discountAmount,
        isFeatured,
        isBestSeller,
        stock,
        topNotes,
        heartNotes,
        baseNotes,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}