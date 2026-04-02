import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/email';
import { createBoxNowDeliveryRequest } from '@/lib/boxnow';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        try {
          // Bug 3 fix: use updateMany with a guard on current status so only the FIRST
          // webhook delivery transitions the order to 'paid'.  Stripe retries return the
          // same event, so count === 0 means we already processed this session — skip.
          const { count } = await prisma.order.updateMany({
            where: { stripeSessionId: session.id, paymentStatus: { not: 'paid' } },
            data: {
              paymentStatus: 'paid',
              stripePaymentId: session.payment_intent as string,
              paidAt: new Date(),
            },
          });

          if (count === 0) {
            console.log('Webhook already processed for session (idempotent skip):', session.id);
            break;
          }

          const order = await prisma.order.findUnique({
            where: { stripeSessionId: session.id },
          });

          if (!order) {
            console.error('Order not found after update for session:', session.id);
            break;
          }

          const items = JSON.parse(order.items as string);
          const testerItem = (order as any).testerItem
            ? JSON.parse((order as any).testerItem as string)
            : null;
          const cartSessionId = session.metadata?.cartSessionId;

          // Handle stock: reservation was already deducted when item was added to cart.
          // Use deleteMany (atomic) instead of findUnique+delete to eliminate the race
          // where background cleanup could delete the reservation between our read and
          // our delete, causing the catch to swallow the error and stock to never be
          // decremented.  deleteMany.count tells us whether we deleted anything.
          for (const item of items) {
            if (cartSessionId) {
              const { count } = await prisma.cartReservation.deleteMany({
                where: { cartSessionId, productId: item.product.id },
              });

              if (count === 0) {
                // Reservation already expired and stock was restored — deduct stock now
                await prisma.product.update({
                  where: { id: item.product.id },
                  data: { stock: { decrement: item.quantity } },
                });
              }
              // count > 0: reservation was active, stock already decremented — nothing more to do
            } else {
              // No cartSessionId (legacy order) — deduct stock as before
              await prisma.product.update({
                where: { id: item.product.id },
                data: { stock: { decrement: item.quantity } },
              });
            }
          }

          // Bug 5 fix: increment promo usage only after payment is confirmed, not at
          // checkout-session creation time.  Abandoned checkouts no longer inflate timesUsed.
          if ((order as any).promoCode) {
            await prisma.promoCode.update({
              where: { code: (order as any).promoCode },
              data: { timesUsed: { increment: 1 } },
            });
          }

          const deliveryMethod = (order as any).shippingMethod;
          const boxnowLockerId = (order as any).boxnowLockerId;

          if (deliveryMethod === 'boxnow' && boxnowLockerId && order.customerPhone) {
            try {
              console.log('Creating BoxNow delivery request for order:', order.orderNumber);
              const boxnowResult = await createBoxNowDeliveryRequest({
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                lockerId: boxnowLockerId,
                invoiceValue: order.total.toFixed(2),
              });

              if (boxnowResult.parcels?.[0]?.id) {
                await prisma.order.update({
                  where: { id: order.id },
                  data: { boxnowParcelId: boxnowResult.parcels[0].id } as any,
                });
                console.log('BoxNow parcel created:', boxnowResult.parcels[0].id);
              }
            } catch (boxnowError) {
              console.error('BoxNow delivery request failed (non-fatal):', boxnowError);
            }
          }

          await sendOrderConfirmation({
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items,
            testerItem,
            total: order.total,
            subtotal: (order as any).subtotal,
            shippingCost: order.shippingCost,
            deliveryMethod: deliveryMethod || 'gls',
            boxnowLockerAddress: (order as any).boxnowLockerAddress,
            shippingAddress: order.shippingAddress,
            shippingCity: (order as any).shippingCity,
            shippingZip: (order as any).shippingZip,
            promoCode: (order as any).promoCode,
            promoDiscount: (order as any).promoDiscount,
            paidAt: order.paidAt,
          });

          console.log('Order updated, reservations released, and email sent successfully');
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);

        try {
          // stripePaymentId is only written on checkout.session.completed (successful payment),
          // so matching by stripePaymentId here always returns 0 rows.  Instead, look up the
          // checkout session linked to this payment intent and match by stripeSessionId.
          // Note: in Stripe Checkout, this event fires on each card decline attempt; the user
          // may still retry with a different card within the same session.
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id as string,
            limit: 1,
          });
          const linkedSession = sessions.data[0];
          if (linkedSession) {
            await prisma.order.updateMany({
              where: { stripeSessionId: linkedSession.id, paymentStatus: 'pending' },
              data: { paymentStatus: 'failed' },
            });
          }
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }

        break;
      }

      case 'checkout.session.expired': {
        // Fired when a Stripe Checkout session is never completed (user abandoned, or 24 h
        // elapsed).  Without this handler, orders for expired sessions stay 'pending' forever.
        const session = event.data.object;
        console.log('Checkout session expired:', session.id);

        try {
          await prisma.order.updateMany({
            where: { stripeSessionId: session.id, paymentStatus: 'pending' },
            data: { paymentStatus: 'expired' },
          });
          // CartReservations for this session have a 15-min TTL and will have been cleaned up
          // by background expiry long before Stripe's 24-h session timeout — no stock action needed.
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook error' },
      { status: 500 }
    );
  }
}
