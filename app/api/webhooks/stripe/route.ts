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
          const order = await prisma.order.update({
            where: { stripeSessionId: session.id },
            data: {
              paymentStatus: 'paid',
              stripePaymentId: session.payment_intent as string,
              paidAt: new Date(),
            },
          });

          // Decrease stock for purchased items
          const items = JSON.parse(order.items as string);
          for (const item of items) {
            await prisma.product.update({
              where: { id: item.product.id },
              data: { stock: { decrement: item.quantity } },
            });
          }

          // Create BoxNow delivery request if the order uses BoxNow
          const deliveryMethod = (order as any).deliveryMethod;
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
              // Don't fail the webhook — order is paid, BoxNow issue can be resolved manually
              console.error('BoxNow delivery request failed (non-fatal):', boxnowError);
            }
          }

          // Send confirmation email
          await sendOrderConfirmation({
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            items,
            total: order.total,
            shippingCost: order.shippingCost,
            deliveryMethod: deliveryMethod || 'gls',
            boxnowLockerAddress: (order as any).boxnowLockerAddress,
          });

          console.log('Order updated, stock decreased, and email sent successfully');
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);

        try {
          await prisma.order.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: { paymentStatus: 'failed' },
          });
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
