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
      isGiftMen,
      isGiftWomen,
      stock,
      topNotes,
      heartNotes,
      baseNotes,
      fragranceProfiles,
      descriptionHr,
      topNotesHr,
      heartNotesHr,
      baseNotesHr,
      fragranceProfilesHr,
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

    // New products go to the top of the shop order (lib/productOrder.ts).
    const { _min } = await prisma.product.aggregate({ _min: { sortOrder: true } });

    // Create product
    const product = await prisma.product.create({
      data: {
        sortOrder: (_min.sortOrder ?? 1) - 1,
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
        isGiftMen: Boolean(isGiftMen),
        isGiftWomen: Boolean(isGiftWomen),
        stock,
        topNotes,
        heartNotes,
        baseNotes,
        fragranceProfiles: fragranceProfiles || [],
        descriptionHr: descriptionHr || null,
        topNotesHr: topNotesHr || [],
        heartNotesHr: heartNotesHr || [],
        baseNotesHr: baseNotesHr || [],
        fragranceProfilesHr: fragranceProfilesHr || [],
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