import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        // Update order status
        try {
          await prisma.order.update({
            where: { stripeSessionId: session.id },
            data: {
              paymentStatus: 'paid',
              stripePaymentId: session.payment_intent as string,
              paidAt: new Date(),
            },
          });
          console.log('Order updated successfully');
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        
        // Update order status
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