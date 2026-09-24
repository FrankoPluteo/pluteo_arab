import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createLoyaltyPromoCode } from '@/lib/loyaltyCode';
import { sendLoyaltyEmail } from '@/lib/email';
import { getFirstName } from '@/lib/abandonedCart';
import { getContactByEmail, normalizeEmail, sleep } from '@/lib/resendContacts';
import { signPayload } from '@/lib/signedToken';

const DAY_MS = 24 * 60 * 60 * 1000;
export const LOYALTY_MIN_AGE_DAYS = 30;
// Safety net: if the daily cron misses a few days, anyone still inside this window is caught.
export const LOYALTY_MAX_AGE_DAYS = 45;
// A retried send reuses its code only if it still has at least this long to live.
const MIN_REMAINING_MS = DAY_MS;

export type LoyaltyOutcome =
  | 'would_send'
  | 'sent'
  | 'skipped_already_sent'
  | 'skipped_reordered'
  | 'skipped_abandoned_cart_opt_out'
  | 'skipped_checkout_opt_out'
  | 'skipped_unsubscribed'
  | 'skipped_already_claimed'
  | 'send_error';

export interface LoyaltyRow {
  orderNumber: string;
  email: string;
  paidAt: string;
  daysSinceOrder: number;
  outcome: LoyaltyOutcome;
  note?: string;
}

export function buildMarketingUnsubscribeLink(email: string, baseUrl: string): string {
  const normalized = normalizeEmail(email);
  const sig = signPayload(`marketing:${normalized}`);
  return `${baseUrl}/api/unsubscribe/marketing?email=${encodeURIComponent(normalized)}&sig=${sig}`;
}

interface JobOptions {
  dryRun: boolean;
  now?: Date;
  // Where the buttons and the unsubscribe link point. Defaults to NEXT_PUBLIC_APP_URL.
  baseUrl?: string;
  // Restrict the run to specific orders (manual re-sends and tests). Not exposed by the cron route.
  orderIds?: string[];
}

export async function runLoyaltyEmailJob(options: JobOptions): Promise<{
  rows: LoyaltyRow[];
  tally: Record<string, number>;
}> {
  const now = options.now ?? new Date();
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://pluteo.shop';

  const candidates = await prisma.order.findMany({
    where: {
      paymentStatus: 'paid',
      paidAt: {
        lte: new Date(now.getTime() - LOYALTY_MIN_AGE_DAYS * DAY_MS),
        gte: new Date(now.getTime() - LOYALTY_MAX_AGE_DAYS * DAY_MS),
      },
      ...(options.orderIds ? { id: { in: options.orderIds } } : {}),
    },
    orderBy: { paidAt: 'asc' },
  });

  const rows: LoyaltyRow[] = [];
  const tally: Record<string, number> = {};

  for (const order of candidates) {
    const email = normalizeEmail(order.customerEmail);
    const row: LoyaltyRow = {
      orderNumber: order.orderNumber,
      email,
      paidAt: order.paidAt!.toISOString(),
      daysSinceOrder: Math.round(((now.getTime() - order.paidAt!.getTime()) / DAY_MS) * 10) / 10,
      outcome: 'would_send',
    };

    try {
      row.outcome = await processOrder(order, email, baseUrl, options.dryRun, now, row);
      const skippedForOptOutOrReorder =
        row.outcome.startsWith('skipped_') &&
        row.outcome !== 'skipped_already_sent' &&
        row.outcome !== 'skipped_already_claimed';
      if (!options.dryRun && skippedForOptOutOrReorder) await discardUnsentClaim(order.id);
    } catch (error) {
      console.error(`Loyalty email failed for order ${order.orderNumber}:`, error);
      row.outcome = 'send_error';
      row.note = error instanceof Error ? error.message : String(error);
    }

    rows.push(row);
    tally[row.outcome] = (tally[row.outcome] ?? 0) + 1;
  }

  return { rows, tally };
}

// A code was created for an earlier attempt that never got delivered, but the order is no
// longer eligible (reordered, opted out). Nobody received that code, so remove it.
async function discardUnsentClaim(orderId: string): Promise<void> {
  const claim = await prisma.postPurchaseEmail.findUnique({ where: { orderId } });
  if (!claim || claim.sentAt) return;
  await prisma.promoCode.deleteMany({ where: { id: claim.promoCodeId, timesUsed: 0 } });
  await prisma.postPurchaseEmail.delete({ where: { id: claim.id } });
}

async function processOrder(
  order: Prisma.OrderGetPayload<object>,
  email: string,
  baseUrl: string,
  dryRun: boolean,
  now: Date,
  row: LoyaltyRow
): Promise<LoyaltyOutcome> {
  const existing = await prisma.postPurchaseEmail.findUnique({ where: { orderId: order.id } });
  if (existing?.sentAt) return 'skipped_already_sent';

  // Only the customer's most recent paid order gets the email.
  const newer = await prisma.order.findFirst({
    where: {
      id: { not: order.id },
      paymentStatus: 'paid',
      customerEmail: { equals: email, mode: 'insensitive' },
      paidAt: { gt: order.paidAt! },
    },
    select: { orderNumber: true },
  });
  if (newer) {
    row.note = `newer paid order ${newer.orderNumber}`;
    return 'skipped_reordered';
  }

  const cartOptOut = await prisma.abandonedCartOptOut.findUnique({ where: { email } });
  if (cartOptOut) return 'skipped_abandoned_cart_opt_out';

  if (order.newsletterOptOut) return 'skipped_checkout_opt_out';

  // Last because it is a network call to Resend (paced to respect its rate limit).
  const contact = await getContactByEmail(email);
  await sleep(700);
  if (contact?.unsubscribed) return 'skipped_unsubscribed';
  if (!contact) row.note = 'no Resend contact (not unsubscribed)';

  if (dryRun) return 'would_send';

  // Claim the order before sending: PostPurchaseEmail.orderId is unique, so an overlapping
  // run can never create a second code or a second email for the same order.
  let claim = existing;
  let code: string;
  let expiresAt: Date;

  if (claim) {
    // A previous run created the code but the send did not complete: retry, reusing the
    // code unless it is about to expire (then swap in a fresh one).
    const promo = await prisma.promoCode.findUnique({ where: { id: claim.promoCodeId } });
    if (promo?.endsAt && promo.endsAt.getTime() - now.getTime() > MIN_REMAINING_MS) {
      code = promo.code;
      expiresAt = promo.endsAt;
    } else {
      const fresh = await createLoyaltyPromoCode();
      claim = await prisma.postPurchaseEmail.update({
        where: { id: claim.id },
        data: { code: fresh.code, promoCodeId: fresh.id },
      });
      if (promo) await prisma.promoCode.delete({ where: { id: promo.id } }).catch(() => {});
      code = fresh.code;
      expiresAt = fresh.expiresAt;
    }
  } else {
    const fresh = await createLoyaltyPromoCode();
    try {
      claim = await prisma.postPurchaseEmail.create({
        data: { orderId: order.id, email, code: fresh.code, promoCodeId: fresh.id },
      });
    } catch (error) {
      await prisma.promoCode.delete({ where: { id: fresh.id } }).catch(() => {});
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'skipped_already_claimed';
      }
      throw error;
    }
    code = fresh.code;
    expiresAt = fresh.expiresAt;
  }

  const result = await sendLoyaltyEmail({
    customerEmail: email,
    firstName: getFirstName(order.customerName).trim(),
    code,
    expiresAt,
    promoLink: `${baseUrl}/cart?promo=${code}`,
    unsubscribeLink: buildMarketingUnsubscribeLink(email, baseUrl),
    // Same code, same key: a retry after a timed out but delivered send returns the original
    // result instead of mailing twice. A regenerated code gets a new key.
    idempotencyKey: `loyalty-${order.id}-${code}`,
  });

  if (!result.success) {
    row.note = 'send failed, will retry on the next run';
    return 'send_error';
  }

  await prisma.postPurchaseEmail.update({ where: { id: claim.id }, data: { sentAt: new Date() } });
  return 'sent';
}
