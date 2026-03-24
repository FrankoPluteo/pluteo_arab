import { PrismaClient } from '@prisma/client';
import { sendEarlySubscriberPromo } from '../lib/email';

const prisma = new PrismaClient();

// --- Configure these before running ---
const PROMO_CODE = 'EARLYBIRD';
const DISCOUNT_LABEL = '15% off your first order';
const EXPIRES_AT = '30 April 2026';
// --------------------------------------

async function main() {
  const subscribers = await prisma.emailCapture.findMany({
    select: { email: true },
  });

  console.log(`Sending to ${subscribers.length} subscribers...`);

  let sent = 0;
  let failed = 0;

  for (const { email } of subscribers) {
    const result = await sendEarlySubscriberPromo({
      to: email,
      promoCode: PROMO_CODE,
      discountLabel: DISCOUNT_LABEL,
      expiresAt: EXPIRES_AT,
    });

    if (result.success) {
      sent++;
      console.log(`  ✓ ${email}`);
    } else {
      failed++;
      console.error(`  ✗ ${email}`, result.error);
    }

    // Small delay to stay within rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
