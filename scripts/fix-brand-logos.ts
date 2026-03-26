/**
 * One-time script: find brand logo URLs that return a non-200 response and
 * clear them so they stop generating 404 errors in the browser / PageSpeed.
 *
 * The Lattafa brand has a dead nitrocdn.com URL causing a 404 console error.
 * This script checks every brand logo URL with an HTTP HEAD request and sets
 * logoUrl = null for any that return 4xx/5xx.
 *
 * Run once:
 *   npx tsx scripts/fix-brand-logos.ts
 *
 * After running, visit /admin/brands to paste replacement URLs.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok; // true if 200-299
  } catch {
    return false;
  }
}

async function main() {
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true, logoUrl: true },
  });

  const withLogo = brands.filter((b) => b.logoUrl !== null);

  if (withLogo.length === 0) {
    console.log('No brands have a logoUrl set — nothing to check.');
    return;
  }

  console.log(`Checking ${withLogo.length} logo URL(s)…\n`);

  const broken: typeof withLogo = [];
  for (const b of withLogo) {
    const ok = await checkUrl(b.logoUrl!);
    const status = ok ? '✓ OK' : '✗ BROKEN';
    console.log(`  [${status}] ${b.name}: ${b.logoUrl}`);
    if (!ok) broken.push(b);
  }

  if (broken.length === 0) {
    console.log('\nAll logo URLs are reachable — nothing to fix.');
    return;
  }

  console.log(`\nClearing logoUrl for ${broken.length} broken brand(s):`);
  for (const b of broken) {
    console.log(`  ${b.name}`);
  }

  const { count } = await prisma.brand.updateMany({
    where: { id: { in: broken.map((b) => b.id) } },
    data: { logoUrl: null },
  });

  console.log(`\nDone — cleared ${count} brand logo(s).`);
  console.log('Visit /admin/brands to set replacement URLs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
