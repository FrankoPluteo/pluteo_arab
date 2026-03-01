import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShipping, isCountryAllowed, ShippingMethod } from '@/lib/shipping';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customerInfo } = body;

    const shippingMethod: ShippingMethod = customerInfo?.shippingMethod || 'gls';

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!customerInfo?.email || !customerInfo?.name) {
      return NextResponse.json({ error: 'Customer information is required' }, { status: 400 });
    }

    // BoxNow-specific validations
    if (shippingMethod === 'boxnow') {
      if (!customerInfo.boxnowLockerId) {
        return NextResponse.json(
          { error: 'Please select a BOX NOW locker.' },
          { status: 400 }
        );
      }
      if (!customerInfo.phone) {
        return NextResponse.json(
          { error: 'Phone number is required for BOX NOW delivery.' },
          { status: 400 }
        );
      }
    }

    // GLS-specific validations
    if (shippingMethod === 'gls') {
      if (!isCountryAllowed(customerInfo.country)) {
        return NextResponse.json(
          { error: 'We currently only ship within Croatia.' },
          { status: 400 }
        );
      }
      if (!customerInfo.address || !customerInfo.city || !customerInfo.zip) {
        return NextResponse.json(
          { error: 'Complete shipping address is required for GLS delivery.' },
          { status: 400 }
        );
      }
    }

    // Fetch real product data from database
    const productIds = items.map((item: any) => item.product.id);
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

    // Calculate totals using DB prices (not client prices)
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const dbProduct = productMap.get(item.product.id)!;
      const finalPrice = dbProduct.price - dbProduct.discountAmount;
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
        unitPrice: finalPrice,
      };
    });

    const shippingCost = calculateShipping(shippingMethod);
    const total = subtotal + shippingCost;

    // Generate order number
    const orderNumber = `PLA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Resolve shipping address fields
    const shippingAddress =
      shippingMethod === 'boxnow'
        ? `BOX NOW: ${customerInfo.boxnowLockerAddress || customerInfo.boxnowLockerId}`
        : customerInfo.address;
    const shippingCity = shippingMethod === 'boxnow' ? '' : customerInfo.city;
    const shippingZip = shippingMethod === 'boxnow' ? '' : customerInfo.zip;

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || null,
        shippingAddress,
        shippingCity,
        shippingZip,
        shippingCountry: 'HR',
        shippingMethod,
        boxnowLockerId: shippingMethod === 'boxnow' ? customerInfo.boxnowLockerId : null,
        boxnowLockerAddress:
          shippingMethod === 'boxnow' ? customerInfo.boxnowLockerAddress : null,
        items: JSON.stringify(validatedItems),
        subtotal,
        shippingCost,
        total,
        paymentStatus: 'pending',
        orderStatus: 'processing',
      } as any,
    });

    // Build Stripe line items
    const lineItems: any[] = validatedItems.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.product.brand.name} - ${item.product.name}`,
          description: `${item.product.concentration} - ${item.product.size}ml`,
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      const shippingLabel =
        shippingMethod === 'boxnow' ? 'BOX NOW Locker Delivery' : 'Shipping GLS (Croatia)';
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: shippingLabel },
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
