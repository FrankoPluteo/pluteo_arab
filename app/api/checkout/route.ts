import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShipping, isFreeShippingEligible, isCountryAllowed, ShippingMethod } from '@/lib/shipping';
import { AFFILIATE_DISCOUNT_RATE } from '@/lib/affiliateConfig';
import { CHECKOUT_HOLD_MINUTES, ensureCartReservations, parseCartLines } from '@/lib/cartReservation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, tester, customerInfo, promoCode: promoCodeInput, affiliateCode: affiliateCodeInput, cartSessionId, utm, language, analytics } = body;

    const shippingMethod: ShippingMethod = customerInfo?.shippingMethod || 'gls';

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!customerInfo?.email || !customerInfo?.name) {
      return NextResponse.json({ error: 'Customer information is required' }, { status: 400 });
    }

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

    // Validate all products exist (and, without a cart session, check stock directly)
    for (const item of items) {
      const dbProduct = productMap.get(item.product.id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product "${item.product.name}" not found.` },
          { status: 400 }
        );
      }

      if (!cartSessionId && dbProduct.stock < item.quantity) {
        return NextResponse.json(
          { error: `"${dbProduct.name}" does not have enough stock.` },
          { status: 400 }
        );
      }
    }

    // Hold the cart's stock for the rest of the payment flow. Reservations are normally
    // kept alive only by cart activity (15 min from the last add/edit), which is too
    // short once the customer moves on to filling in shipping info, picking a BoxNow
    // locker, and paying on Stripe's hosted page — if that took longer than the hold,
    // the reservation would expire mid-payment, stock would be released back to other
    // shoppers, and a successful payment afterward would have nothing left to deduct
    // from. Re-anchoring the hold here, in lockstep with the Stripe session's own
    // expires_at below, keeps the two bounded together for the whole checkout attempt.
    // A hold that already lapsed is re-reserved silently while the stock is there; only
    // stock that is genuinely gone stops the checkout.
    const checkoutHoldExpiresAt = new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60 * 1000);
    if (cartSessionId) {
      const lines = parseCartLines(
        items.map((item: { product: { id: string }; quantity: number }) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }))
      );
      if (typeof cartSessionId !== 'string' || !lines) {
        return NextResponse.json({ error: 'Invalid cart' }, { status: 400 });
      }

      const unavailable = await ensureCartReservations(cartSessionId, lines, checkoutHoldExpiresAt);
      if (unavailable.length > 0) {
        const names = unavailable.map((line) => `"${productMap.get(line.productId)?.name}"`);
        return NextResponse.json(
          {
            error: `${names.join(', ')} is no longer available in the quantity in your cart.`,
            code: 'stock_unavailable',
            unavailable,
          },
          { status: 409 }
        );
      }
    }

    // Calculate subtotal using DB prices
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

    // Validate and append tester item (free, no reservation required)
    let testerItem: any = null;
    if (tester?.product?.id) {
      const dbTester = await prisma.product.findUnique({
        where: { id: tester.product.id },
        include: { brand: true },
      });
      if (dbTester) {
        testerItem = {
          product: {
            id: dbTester.id,
            name: dbTester.name,
            brand: { name: dbTester.brand.name },
            size: dbTester.size,
            price: dbTester.price,
            discountAmount: dbTester.discountAmount,
            concentration: dbTester.concentration,
            images: dbTester.images,
          },
          quantity: 1,
          unitPrice: 0,
          isTester: true,
        };
      }
    }

    // Validate promo code server-side
    let promoDiscount = 0;
    let validatedPromoCode: string | null = null;
    let promoFreeShipping = false;

    if (promoCodeInput) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCodeInput.toUpperCase() },
      });

      const nowCheck = new Date();
      const isValid =
        promo &&
        promo.isActive &&
        (!promo.startsAt || nowCheck >= promo.startsAt) &&
        (!promo.endsAt || nowCheck <= promo.endsAt) &&
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

        // Check product restriction
        if (promo.requiredProductNames.length > 0) {
          const cartProductNames = validatedItems.map((item: any) => item.product.name.toLowerCase());
          const hasRequired = promo.requiredProductNames.some((required) =>
            cartProductNames.includes(required.toLowerCase())
          );
          if (!hasRequired) {
            return NextResponse.json(
              { error: 'Promo code FIRST50 requires at least one eligible product in your cart.' },
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


    // Validate affiliate code if provided — also grants a 10% customer discount
    let validatedAffiliateCode: string | null = null;
    let affiliateDiscount = 0;
    if (affiliateCodeInput) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { affiliateCode: affiliateCodeInput.toUpperCase().trim() },
        select: { affiliateCode: true, status: true },
      });
      if (affiliate && affiliate.status === 'active') {
        validatedAffiliateCode = affiliate.affiliateCode;
        affiliateDiscount = parseFloat((subtotal * AFFILIATE_DISCOUNT_RATE).toFixed(2));
      }
    }

    const baseShipping = calculateShipping(shippingMethod);
    const shippingCost = (promoFreeShipping || isFreeShippingEligible(subtotal, shippingMethod)) ? 0 : baseShipping;
    const total = subtotal - promoDiscount - affiliateDiscount + shippingCost;

    const orderNumber = `PLA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const shippingAddress =
      shippingMethod === 'boxnow'
        ? `BOX NOW: ${customerInfo.boxnowLockerAddress || customerInfo.boxnowLockerId}`
        : customerInfo.address;
    const shippingCity = shippingMethod === 'boxnow' ? '' : customerInfo.city;
    const shippingZip = shippingMethod === 'boxnow' ? '' : customerInfo.zip;

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
        testerItem: testerItem ? JSON.stringify(testerItem) : undefined,
        subtotal,
        shippingCost,
        total,
        promoCode: validatedPromoCode,
        promoDiscount,
        affiliateCode: validatedAffiliateCode,
        newsletterOptOut: customerInfo.newsletterOptOut === true,
        paymentStatus: 'pending',
        orderStatus: 'processing',
        utmSource: utm?.utm_source || null,
        utmMedium: utm?.utm_medium || null,
        utmCampaign: utm?.utm_campaign || null,
        utmPromo: typeof utm?.promo === 'string' && utm.promo ? utm.promo.slice(0, 64) : null,
      } as any,
    });

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

    if (testerItem) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `[FREE TESTER] ${testerItem.product.brand.name} - ${testerItem.product.name}`,
            description: `${testerItem.product.concentration} - ${testerItem.product.size}ml`,
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }

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

    const sessionParams: any = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerInfo.email,
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      // Match the CartReservation hold above so an unpaid session and its stock hold
      // always expire together — see checkout.session.expired in the Stripe webhook.
      expires_at: Math.floor(checkoutHoldExpiresAt.getTime() / 1000),
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cartSessionId: cartSessionId || '',
        language: language === 'en' ? 'en' : 'hr',
        // PostHog: the webhook sends `purchase` under this browser's ID, and only creates a
        // person profile when the buyer accepted analytics cookies.
        ph_distinct_id: typeof analytics?.distinctId === 'string' ? analytics.distinctId.slice(0, 200) : '',
        analytics_consent: analytics?.consent === true ? '1' : '0',
      },
    };

    const totalDiscount = promoDiscount + affiliateDiscount;
    if (totalDiscount > 0) {
      const nameParts: string[] = [];
      if (validatedPromoCode) nameParts.push(`Promo: ${validatedPromoCode}`);
      if (validatedAffiliateCode) nameParts.push(`Affiliate: ${validatedAffiliateCode}`);
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(totalDiscount * 100),
        currency: 'eur',
        duration: 'once',
        name: nameParts.join(' + '),
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    // Bug 5 fix: timesUsed is now incremented in the Stripe webhook (checkout.session.completed)
    // after payment is confirmed, so abandoned checkouts no longer inflate the usage count.

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
