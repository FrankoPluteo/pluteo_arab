import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reviews?productId=xxx — returns only aggregates (no individual reviews)
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  try {
    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count.rating,
    });
  } catch (err) {
    console.error('Error fetching review aggregates:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, reviewerName, reviewerEmail, rating, title, comment } = body;

    if (!productId || !reviewerEmail || !rating) {
      return NextResponse.json({ error: 'Product, email, and rating are required' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingReview = await prisma.review.findFirst({
      where: { productId, reviewerEmail: reviewerEmail.toLowerCase() },
    });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }

    const verifiedOrder = await prisma.order.findFirst({
      where: {
        customerEmail: reviewerEmail.toLowerCase(),
        paymentStatus: 'paid',
      },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        reviewerName: reviewerName ? reviewerName.trim() : '',
        reviewerEmail: reviewerEmail.toLowerCase().trim(),
        rating,
        title: title ? title.trim() : '',
        comment: comment ? comment.trim() : '',
        isVerified: !!verifiedOrder,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error('Error creating review:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
