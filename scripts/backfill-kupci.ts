// One-off backfill: put every buyer (distinct email from paid orders) into the Resend
// "Kupci" segment.
//
//   npx tsx --env-file=.env scripts/backfill-kupci.ts            -> read-only report
//   npx tsx --env-file=.env scripts/backfill-kupci.ts --run      -> actually write
//
// Safe to run repeatedly: buyers already in Kupci are skipped, existing contacts keep
// their unsubscribed flag, nothing is ever deleted.
import { prisma } from '../lib/prisma';
import {
  addBuyerToKupci,
  listAllContacts,
  listSegmentMemberEmails,
  normalizeEmail,
  sleep,
} from '../lib/resendContacts';

const RUN = process.argv.includes('--run');
const DELAY_MS = 700; // stay under Resend's requests-per-second limit

interface Buyer {
  email: string;
  fullName: string;
  optOut: boolean;
}

async function loadBuyers(): Promise<{ buyers: Buyer[]; rawVariants: Map<string, Set<string>> }> {
  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'paid' },
    select: { customerEmail: true, customerName: true, newsletterOptOut: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const byEmail = new Map<string, Buyer>();
  const rawVariants = new Map<string, Set<string>>();
  for (const o of orders) {
    const email = normalizeEmail(o.customerEmail);
    if (!rawVariants.has(email)) rawVariants.set(email, new Set());
    rawVariants.get(email)!.add(o.customerEmail);
    // orders are ascending, so the last one wins: newest name and newest opt-out choice
    byEmail.set(email, { email, fullName: o.customerName, optOut: o.newsletterOptOut });
  }
  return { buyers: [...byEmail.values()], rawVariants };
}

async function main() {
  const segmentId = process.env.RESEND_SEGMENT_KUPCI_ID;
  if (!segmentId) throw new Error('RESEND_SEGMENT_KUPCI_ID is not set');

  const { buyers, rawVariants } = await loadBuyers();
  console.log(`Mode: ${RUN ? 'RUN (writes to Resend)' : 'REPORT (read-only)'}`);
  console.log(`Distinct buyer emails (normalized) from paid orders: ${buyers.length}`);

  const dbDupes = [...rawVariants.entries()].filter(([, raw]) => raw.size > 1);
  const dbMessy = [...rawVariants.entries()].filter(([, raw]) => [...raw].some((r) => r !== r.trim() || r !== r.toLowerCase()));
  console.log(`DB: emails stored with different casing/whitespace across orders: ${dbDupes.length}`);
  dbDupes.forEach(([n, raw]) => console.log(`   ${n} <- ${JSON.stringify([...raw])}`));
  console.log(`DB: emails stored with uppercase/whitespace (any order): ${dbMessy.length}`);

  console.log('\nFetching all Resend contacts...');
  const contacts = await listAllContacts();
  const groups = new Map<string, typeof contacts>();
  for (const c of contacts) {
    const key = normalizeEmail(c.email);
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const resendDupes = [...groups.entries()].filter(([, g]) => g.length > 1);
  const resendMessy = contacts.filter((c) => c.email !== c.email.trim() || c.email !== c.email.toLowerCase());
  console.log(`Resend contacts total: ${contacts.length} (unsubscribed: ${contacts.filter((c) => c.unsubscribed).length})`);
  console.log(`Resend duplicates by casing/whitespace: ${resendDupes.length}`);
  resendDupes.forEach(([n, g]) => console.log(`   ${n} <- ${JSON.stringify(g.map((c) => ({ id: c.id, email: c.email, unsubscribed: c.unsubscribed })))}`));
  console.log(`Resend contacts stored with uppercase/whitespace: ${resendMessy.length}`);

  const members = await listSegmentMemberEmails(segmentId);
  const existing = buyers.filter((b) => groups.has(b.email));
  const missing = buyers.filter((b) => !groups.has(b.email));
  const existingUnsub = existing.filter((b) => groups.get(b.email)!.some((c) => c.unsubscribed));
  const alreadyInKupci = buyers.filter((b) => members.has(b.email));
  const toProcess = buyers.filter((b) => !members.has(b.email));

  console.log('\n=== Buyer report ===');
  console.log(`Buyers who already exist as Resend contacts : ${existing.length}`);
  console.log(`   of which currently unsubscribed          : ${existingUnsub.length}`);
  console.log(`Buyers missing from Resend (would be created): ${missing.length}`);
  console.log(`Buyers already in Kupci                      : ${alreadyInKupci.length}`);
  console.log(`Buyers that still need adding to Kupci       : ${toProcess.length}`);
  console.log(`Kupci members that are not a paid buyer      : ${[...members].filter((m) => !buyers.some((b) => b.email === m)).length}`);

  if (!RUN) {
    console.log('\nReport only. Nothing was written. Re-run with --run to apply.');
    return;
  }

  const tally = { added: 0, alreadyThere: alreadyInKupci.length, failed: 0 };
  const failures: { email: string; error: string }[] = [];
  let created = 0;
  let i = 0;
  for (const buyer of toProcess) {
    i++;
    try {
      // For a buyer with duplicate contacts (casing), use the canonical lowercase one.
      const group = groups.get(buyer.email) ?? [];
      const knownContact = group.find((c) => c.email === buyer.email) ?? group[0] ?? null;
      const outcome = await addBuyerToKupci({ ...buyer, knownContact });
      tally.added++;
      if (outcome.contact === 'created') created++;
      console.log(`[${i}/${toProcess.length}] added ${buyer.email} (${outcome.contact})`);
    } catch (err) {
      tally.failed++;
      failures.push({ email: buyer.email, error: err instanceof Error ? err.message : String(err) });
      console.error(`[${i}/${toProcess.length}] FAILED ${buyer.email}:`, err instanceof Error ? err.message : err);
    }
    await sleep(DELAY_MS);
  }

  const after = await listSegmentMemberEmails(segmentId);
  const stillMissing = buyers.filter((b) => !after.has(b.email));
  console.log('\n=== Summary ===');
  console.log(`Added: ${tally.added} (new contacts created: ${created}) | Already there: ${tally.alreadyThere} | Failed: ${tally.failed}`);
  failures.forEach((f) => console.log(`   FAILED ${f.email}: ${f.error}`));
  console.log(`Kupci now has ${after.size} members; distinct paid-order emails: ${buyers.length}; buyers not in Kupci: ${stillMissing.length}`);
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
