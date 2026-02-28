import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const BOXNOW_WEBHOOK_SECRET = process.env.BOXNOW_WEBHOOK_SECRET || '';

// Map BoxNow event types to our internal order statuses
const EVENT_STATUS_MAP: Record<string, string> = {
  'in-transit': 'shipped',
  'in-depot': 'shipped',
  'accepted-to-locker': 'shipped',
  'final-destination': 'shipped',
  delivered: 'delivered',
  returned: 'cancelled',
  expired: 'cancelled',
  canceled: 'cancelled',
};

export async function POST(request: Request) {
  try {
    const body = await request.text();

    // Verify HMAC-SHA256 signature if secret is configured
    if (BOXNOW_WEBHOOK_SECRET) {
      const signature = request.headers.get('datasignature') ?? '';
      const expected = crypto
        .createHmac('sha256', BOXNOW_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expected) {
        console.error('BoxNow webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(body);
    const { parcelId, event: eventType, orderNumber } = payload?.data ?? {};

    console.log('BoxNow webhook:', { eventType, parcelId, orderNumber });

    const newStatus = EVENT_STATUS_MAP[eventType];
    if (orderNumber && newStatus) {
      await prisma.order.updateMany({
        where: { orderNumber },
        data: {
          orderStatus: newStatus,
          ...(newStatus === 'delivered' ? { deliveredAt: new Date() } : {}),
          ...(newStatus === 'shipped' ? { shippedAt: new Date() } : {}),
        },
      });
      console.log(`Order ${orderNumber} status updated to "${newStatus}"`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('BoxNow webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
