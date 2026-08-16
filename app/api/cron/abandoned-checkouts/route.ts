import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAbandonedCartEmail1, sendAbandonedCartEmail2 } from '@/lib/email';
import {
  buildItemNameList,
  buildRecoveryLink,
  buildUnsubscribeLink,
  getFirstName,
  isWithinSendWindow,
} from '@/lib/abandonedCart';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;
const FORTY_EIGHT_HOURS_MS = 48 * ONE_HOUR_MS;

type Step = 1 | 2;

async function processOrder(orderId: string, step: Step, dryRun: boolean): Promise<string> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === 'paid') return 'now_paid';

  const optOut = await prisma.abandonedCartOptOut.findUnique({
    where: { email: order.customerEmail.toLowerCase() },
  });
  if (optOut) return 'opted_out';

  // Don't nudge someone who already bought via a separate order placed after this one.
  const convertedElsewhere = await prisma.order.findFirst({
    where: {
      customerEmail: order.customerEmail,
      paymentStatus: 'paid',
      createdAt: { gte: order.createdAt },
      id: { not: order.id },
    },
    select: { id: true },
  });
  if (convertedElsewhere) return 'already_converted_elsewhere';

  // Claim the send before actually sending (same idempotency pattern as the Stripe
  // webhook's updateMany guard) so an overlapping cron run can never double-send.
  // Skipped in dry-run so repeated test runs don't poison real order state.
  if (!dryRun) {
    const claim =
      step === 1
        ? await prisma.order.updateMany({
            where: { id: order.id, abandonedEmail1SentAt: null, paymentStatus: { not: 'paid' } },
            data: { abandonedEmail1SentAt: new Date() },
          })
        : await prisma.order.updateMany({
            where: { id: order.id, abandonedEmail2SentAt: null, paymentStatus: { not: 'paid' } },
            data: { abandonedEmail2SentAt: new Date() },
          });
    if (claim.count === 0) return 'already_claimed';
  }

  const items = JSON.parse(order.items as string);
  const itemName = buildItemNameList(items);
  const firstName = getFirstName(order.customerName);
  const checkoutLink = buildRecoveryLink(order.id);
  const recipient = dryRun
    ? process.env.ABANDONED_CART_DRY_RUN_RECIPIENT || order.customerEmail
    : order.customerEmail;

  let result;
  if (step === 1) {
    result = await sendAbandonedCartEmail1({
      customerEmail: recipient,
      firstName,
      itemName,
      checkoutLink,
      promoCode: order.promoCode,
    });
  } else {
    let expiryDate: string | null = null;
    if (order.promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: order.promoCode } });
      if (promo?.endsAt) {
        expiryDate = promo.endsAt.toLocaleDateString('hr-HR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }
    result = await sendAbandonedCartEmail2({
      customerEmail: recipient,
      firstName,
      itemName,
      checkoutLink,
      unsubscribeLink: buildUnsubscribeLink(order.customerEmail),
      promoCode: order.promoCode,
      expiryDate,
    });
  }

  if (!result.success) {
    console.error(`Abandoned cart email ${step} failed for order ${order.orderNumber}:`, result.error);
    return 'send_error';
  }

  console.log(
    `Abandoned cart email ${step} sent for order ${order.orderNumber}${dryRun ? ' (DRY RUN)' : ''} to ${recipient}`
  );
  return dryRun ? 'dry_run_sent' : 'sent';
}

// Triggered every 15 min by an external scheduler (GitHub Actions — see
// .github/workflows/abandoned-cart-cron.yml, since Vercel Hobby's native cron
// can't run more often than once a day).
export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // TEMP DEBUG — lengths only, never the actual values. Remove once the
    // CRON_SECRET mismatch is root-caused.
    return NextResponse.json(
      {
        error: 'Unauthorized',
        debug: {
          receivedHeaderLength: authHeader?.length ?? null,
          expectedSecretLength: process.env.CRON_SECRET.length,
          receivedStartsWithBearer: authHeader?.startsWith('Bearer ') ?? false,
        },
      },
      { status: 401 }
    );
  }

  if (process.env.ABANDONED_CART_ENABLED !== 'true') {
    return NextResponse.json({ skipped: true, reason: 'disabled' });
  }

  const url = new URL(request.url);
  const dryRun = process.env.ABANDONED_CART_DRY_RUN === 'true';
  const forcedOrderId = url.searchParams.get('orderId');
  const forcedStep = url.searchParams.get('step');

  // Manual single-order test path — bypasses timing + send window so you can verify
  // a specific staging order without waiting 1h/24h. Paid guard, opt-out, already-
  // converted-elsewhere, and the idempotent claim still apply.
  if (forcedOrderId) {
    const step: Step = forcedStep === '2' ? 2 : 1;
    const outcome = await processOrder(forcedOrderId, step, dryRun);
    return NextResponse.json({ forced: true, orderId: forcedOrderId, step, dryRun, outcome });
  }

  const now = new Date();
  if (!isWithinSendWindow(now)) {
    return NextResponse.json({ skipped: true, reason: 'outside_send_window' });
  }

  const oneHourAgo = new Date(now.getTime() - ONE_HOUR_MS);
  const twentyFourHoursAgo = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);
  const fortyEightHoursAgo = new Date(now.getTime() - FORTY_EIGHT_HOURS_MS);

  const tally: Record<string, number> = {};
  const bump = (key: string) => {
    tally[key] = (tally[key] || 0) + 1;
  };

  const email1Candidates = await prisma.order.findMany({
    where: {
      paymentStatus: { not: 'paid' },
      abandonedEmail1SentAt: null,
      createdAt: { lte: oneHourAgo, gte: fortyEightHoursAgo },
    },
    select: { id: true },
  });
  for (const { id } of email1Candidates) {
    bump(`email1_${await processOrder(id, 1, dryRun)}`);
  }

  const email2Candidates = await prisma.order.findMany({
    where: {
      paymentStatus: { not: 'paid' },
      abandonedEmail1SentAt: { not: null },
      abandonedEmail2SentAt: null,
      createdAt: { lte: twentyFourHoursAgo, gte: fortyEightHoursAgo },
    },
    select: { id: true },
  });
  for (const { id } of email2Candidates) {
    bump(`email2_${await processOrder(id, 2, dryRun)}`);
  }

  console.log('Abandoned cart cron run complete', { dryRun, tally });
  return NextResponse.json({ dryRun, tally });
}
