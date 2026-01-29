import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customerInfo } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Validate customer info
    if (!customerInfo?.email || !customerInfo?.name) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }

    // Calculate total
    const subtotal = items.reduce((sum: number, item: any) => {
      const price = item.product.price - item.product.discountAmount;
      return sum + (price * item.quantity);
    }, 0);

    const shippingCost = 0; // Add your shipping logic here
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
        items: JSON.stringify(items),
        subtotal,
        shippingCost,
        total,
        paymentStatus: 'pending',
        orderStatus: 'processing',
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerInfo.email,
      line_items: items.map((item: any) => {
        const price = item.product.price - item.product.discountAmount;
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.product.brand.name} - ${item.product.name}`,
              description: `${item.product.concentration} - ${item.product.size}ml`,
              // images: item.product.images?.[0] ? [item.product.images[0]] : [],
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // Update order with Stripe session ID
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