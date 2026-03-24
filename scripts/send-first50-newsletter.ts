import { PrismaClient } from '@prisma/client';
import { sendFirst50Newsletter } from '../lib/email';

const prisma = new PrismaClient();

async function main() {
  const subscribers = await prisma.emailCapture.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Sending to ${subscribers.length} subscribers...`);

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const result = await sendFirst50Newsletter(subscriber.email);
    if (result.success) {
      sent++;
      console.log(`[${sent + failed}/${subscribers.length}] Sent to ${subscriber.email}`);
    } else {
      failed++;
      console.error(`[${sent + failed}/${subscribers.length}] FAILED: ${subscriber.email}`);
    }
    // Small delay to avoid hitting Resend rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
