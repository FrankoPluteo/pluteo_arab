import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShipping, isCountryAllowed } from '@/lib/shipping';

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

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      const price = item.product.price - item.product.discountAmount;
      return sum + (price * item.quantity);
    }, 0);

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
        items: JSON.stringify(items),
        subtotal,
        shippingCost,
        total,
        paymentStatus: 'pending',
        orderStatus: 'processing',
      },
    });

    // Create Stripe line items
    const lineItems: any[] = items.map((item: any) => {
      const price = item.product.price - item.product.discountAmount;
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.product.brand.name} - ${item.product.name}`,
            description: `${item.product.concentration} - ${item.product.size}ml`,
          },
          unit_amount: Math.round(price * 100),
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