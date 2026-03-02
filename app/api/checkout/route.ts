import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShipping, isCountryAllowed, ShippingMethod } from '@/lib/shipping';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, customerInfo, promoCode: promoCodeInput } = body;

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

    // Calculate subtotal using DB prices (not client prices)
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

    // Validate promo code server-side (authoritative check)
    let promoDiscount = 0;
    let validatedPromoCode: string | null = null;
    let promoFreeShipping = false;

    if (promoCodeInput) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCodeInput.toUpperCase() },
      });

      const now = new Date();
      const isValid =
        promo &&
        promo.isActive &&
        (!promo.startsAt || now >= promo.startsAt) &&
        (!promo.endsAt || now <= promo.endsAt) &&
        (promo.usageLimitTotal === null || promo.timesUsed < promo.usageLimitTotal) &&
        subtotal >= promo.minOrderValue;

      if (isValid && promo) {
        if (promo.usageLimitPerUser !== null) {
          const userUsageCount = await prisma.order.count({
            where: { customerEmail: customerInfo.email, promoCode: promo.code },
          });
          if (userUsageCount >= promo.usageLimitPerUser) {
            return NextResponse.json(
              { error: 'You have already used this promo code the maximum number of times.' },
              { status: 400 }
            );
          }
        }

        if (promo.discountType === 'percent') {
          promoDiscount = (subtotal * promo.discountValue) / 100;
          if (promo.maxDiscountAmount !== null) {
            promoDiscount = Math.min(promoDiscount, promo.maxDiscountAmount);
          }
        } else {
          promoDiscount = promo.discountValue;
        }
        promoDiscount = parseFloat(Math.min(promoDiscount, subtotal).toFixed(2));
        validatedPromoCode = promo.code;
        promoFreeShipping = promo.freeShipping;
      }
    }

    const baseShipping = calculateShipping(shippingMethod);
    const shippingCost = promoFreeShipping ? 0 : baseShipping;
    const total = subtotal - promoDiscount + shippingCost;

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
        promoCode: validatedPromoCode,
        promoDiscount,
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

    // Create Stripe checkout session, adding a coupon if promo discount applies
    const sessionParams: any = {
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
    };

    if (promoDiscount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(promoDiscount * 100),
        currency: 'eur',
        duration: 'once',
        name: `Promo: ${validatedPromoCode}`,
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    // Increment promo usage counter
    if (validatedPromoCode) {
      await prisma.promoCode.update({
        where: { code: validatedPromoCode },
        data: { timesUsed: { increment: 1 } },
      });
    }

    // Capture customer email
    await prisma.emailCapture.upsert({
      where: { email: customerInfo.email },
      update: {},
      create: { email: customerInfo.email },
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
