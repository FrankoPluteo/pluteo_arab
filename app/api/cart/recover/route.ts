import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShipping, isFreeShippingEligible, ShippingMethod } from '@/lib/shipping';
import { verifyPayload } from '@/lib/signedToken';

// GET /api/cart/recover?order=...&exp=...&sig=...
//
// Reached from the abandoned-checkout recovery emails. The original Stripe Checkout
// session is dead by the time these emails go out (Stripe's own session expiry, or it
// was already cancelled), so this re-validates stock/pricing/promo against current DB
// state and creates a brand-new session rather than trying to reuse the old one.
export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const fallback = NextResponse.redirect(`${appUrl}/products`, 302);

  const url = new URL(request.url);
  const orderId = url.searchParams.get('order');
  const exp = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');

  if (!orderId || !exp || !sig) return fallback;
  if (Date.now() > parseInt(exp, 10)) return fallback;
  if (!verifyPayload(`${orderId}:${exp}`, sig)) return fallback;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fallback;

  if (order.paymentStatus === 'paid') {
    return NextResponse.redirect(`${appUrl}/order/success?session_id=${order.stripeSessionId}`, 302);
  }

  try {
    const items = JSON.parse(order.items as string);
    const testerItem = order.testerItem ? JSON.parse(order.testerItem as string) : null;

    const productIds = items.map((item: any) => item.product.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const validatedItems: any[] = [];
    for (const item of items) {
      const dbProduct = productMap.get(item.product.id);
      if (!dbProduct || dbProduct.stock < item.quantity) continue; // sold out since abandonment — drop it, best effort
      const finalPrice = dbProduct.price - dbProduct.discountAmount;
      subtotal += finalPrice * item.quantity;
      validatedItems.push({
        product: {
          name: dbProduct.name,
          brand: { name: dbProduct.brand.name },
          size: dbProduct.size,
          concentration: dbProduct.concentration,
        },
        quantity: item.quantity,
        unitPrice: finalPrice,
      });
    }

    if (validatedItems.length === 0) return fallback;

    let validatedTesterItem: any = null;
    if (testerItem?.product?.id) {
      const dbTester = await prisma.product.findUnique({
        where: { id: testerItem.product.id },
        include: { brand: true },
      });
      if (dbTester) {
        validatedTesterItem = {
          product: { name: dbTester.name, brand: { name: dbTester.brand.name }, size: dbTester.size, concentration: dbTester.concentration },
        };
      }
    }

    // Reapply the order's existing promo code (never stack a new one on top).
    // Per-user usage-limit isn't re-checked here since this order already held the code.
    let promoDiscount = 0;
    let validatedPromoCode: string | null = null;
    let promoFreeShipping = false;
    if (order.promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: order.promoCode } });
      const now = new Date();
      const isValid =
        promo &&
        promo.isActive &&
        (!promo.startsAt || now >= promo.startsAt) &&
        (!promo.endsAt || now <= promo.endsAt) &&
        (promo.usageLimitTotal === null || promo.timesUsed < promo.usageLimitTotal) &&
        subtotal >= promo.minOrderValue;

      if (isValid && promo) {
        promoDiscount =
          promo.discountType === 'percent'
            ? Math.min((subtotal * promo.discountValue) / 100, promo.maxDiscountAmount ?? Infinity)
            : promo.discountValue;
        promoDiscount = parseFloat(Math.min(promoDiscount, subtotal).toFixed(2));
        validatedPromoCode = promo.code;
        promoFreeShipping = promo.freeShipping;
      }
    }

    const shippingMethod = (order.shippingMethod as ShippingMethod) || 'gls';
    const baseShipping = calculateShipping(shippingMethod);
    const shippingCost =
      promoFreeShipping || isFreeShippingEligible(subtotal, shippingMethod) ? 0 : baseShipping;
    const total = subtotal - promoDiscount + shippingCost;

    const lineItems: any[] = validatedItems.map((item) => ({
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

    if (validatedTesterItem) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `[FREE TESTER] ${validatedTesterItem.product.brand.name} - ${validatedTesterItem.product.name}`,
            description: `${validatedTesterItem.product.concentration} - ${validatedTesterItem.product.size}ml`,
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: shippingMethod === 'boxnow' ? 'BOX NOW Locker Delivery' : 'Shipping GLS (Croatia)',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const sessionParams: any = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: order.customerEmail,
      line_items: lineItems,
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cartSessionId: '',
        language: 'hr',
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
      data: {
        stripeSessionId: session.id,
        paymentStatus: 'pending',
        subtotal,
        shippingCost,
        total,
        promoDiscount,
      },
    });

    console.log('Abandoned cart recovery: new session created', {
      orderNumber: order.orderNumber,
      sessionId: session.id,
    });

    return NextResponse.redirect(session.url!, 302);
  } catch (error) {
    console.error('Cart recovery error:', error);
    return fallback;
  }
}
