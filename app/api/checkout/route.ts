import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShipping, isCountryAllowed } from '@/lib/shipping';
import { VALENTINE_PACKS } from '@/lib/valentinePacks';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customerInfo } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    if (!customerInfo?.email || !customerInfo?.name) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }

    // Validate country
    if (!isCountryAllowed(customerInfo.country)) {
      return NextResponse.json(
        { error: 'We currently only ship within Croatia.' },
        { status: 400 }
      );
    }

    // Collect all unique product IDs from the cart
    const productIds = items.map((item: any) => item.product.id);

    // Fetch real product data from database
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true },
    });

    const productMap = new Map<string, any>(dbProducts.map((p: any) => [p.id, p]));

    // Validate all products exist and have stock
    for (const item of items) {
      const dbProduct = productMap.get(item.product.id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product "${item.product.name}" not found.` },
          { status: 400 }
        );
      }
      if (dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { error: `"${dbProduct.name}" does not have enough stock.` },
          { status: 400 }
        );
      }
    }

    // Build a set of valid valentine pack IDs from the cart and validate them
    const packItemsByPackId = new Map<string, any[]>();
    for (const item of items) {
      if (item.valentinePackId) {
        const existing = packItemsByPackId.get(item.valentinePackId) || [];
        existing.push(item);
        packItemsByPackId.set(item.valentinePackId, existing);
      }
    }

    // Validate each claimed pack
    const validatedPackDiscounts = new Map<string, number>();
    for (const [packId, packItems] of packItemsByPackId) {
      const pack = VALENTINE_PACKS.find((p) => p.id === packId);
      if (!pack) {
        return NextResponse.json(
          { error: 'Invalid valentine pack.' },
          { status: 400 }
        );
      }

      // Pack must have exactly 2 items
      if (packItems.length !== 2) {
        return NextResponse.json(
          { error: 'Invalid valentine pack configuration.' },
          { status: 400 }
        );
      }

      // Verify the pack contains the correct product IDs
      const itemProductIds = new Set(packItems.map((i: any) => i.product.id));
      if (!itemProductIds.has(pack.himId) || !itemProductIds.has(pack.herId)) {
        return NextResponse.json(
          { error: 'Valentine pack products do not match.' },
          { status: 400 }
        );
      }

      // Each pack item must have quantity 1
      for (const packItem of packItems) {
        if (packItem.quantity !== 1) {
          return NextResponse.json(
            { error: 'Valentine pack items must have quantity 1.' },
            { status: 400 }
          );
        }
      }

      validatedPackDiscounts.set(packId, pack.discount);
    }

    // Calculate totals using DB prices (not client prices)
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const dbProduct = productMap.get(item.product.id)!;
      const basePrice = dbProduct.price - dbProduct.discountAmount;

      let packDiscount = 0;
      if (item.valentinePackId && validatedPackDiscounts.has(item.valentinePackId)) {
        const totalPackDiscount = validatedPackDiscounts.get(item.valentinePackId)!;
        packDiscount = totalPackDiscount / 2;
      }

      const finalPrice = basePrice - packDiscount;
      subtotal += finalPrice * item.quantity;

      return {
        product: {
          id: dbProduct.id,
          name: dbProduct.name,
          brand: { name: dbProduct.brand.name },
          size: dbProduct.size,
          price: dbProduct.price,
          discountAmount: dbProduct.discountAmount,
          concentration: dbProduct.concentration,
          images: dbProduct.images,
        },
        quantity: item.quantity,
        valentinePackId: item.valentinePackId || null,
        packDiscount,
        unitPrice: finalPrice,
      };
    });

    const shippingCost = calculateShipping(subtotal);
    const total = subtotal + shippingCost;

    // Generate order number
    const orderNumber = `PLA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || null,
        shippingAddress: customerInfo.address,
        shippingCity: customerInfo.city,
        shippingZip: customerInfo.zip,
        shippingCountry: customerInfo.country,
        items: JSON.stringify(validatedItems),
        subtotal,
        shippingCost,
        total,
        paymentStatus: 'pending',
        orderStatus: 'processing',
      },
    });

    // Create Stripe line items using server-validated prices
    const lineItems: any[] = validatedItems.map((item: any) => {
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.product.brand.name} - ${item.product.name}`,
            description: `${item.product.concentration} - ${item.product.size}ml${item.valentinePackId ? ' (Valentine\'s Pack)' : ''}`,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item (only if not free)
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Shipping (Croatia)',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerInfo.email,
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
