/**
 * One-time script: clear brand logoUrl values that are NOT on Cloudinary.
 *
 * The Lattafa brand has a dead nitrocdn.com URL causing a 404 in PageSpeed /
 * the browser console.  This script sets logoUrl = null for any brand whose
 * logo is not hosted on res.cloudinary.com so those requests stop being made.
 *
 * Run once:
 *   npx tsx scripts/fix-brand-logos.ts
 *
 * After running, go to /admin/brands and upload the correct Cloudinary logos.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true, logoUrl: true },
  });

  const broken = brands.filter(
    (b) => b.logoUrl !== null && !b.logoUrl.startsWith('https://res.cloudinary.com')
  );

  if (broken.length === 0) {
    console.log('No broken brand logo URLs found — nothing to fix.');
    return;
  }

  console.log(`Found ${broken.length} brand(s) with non-Cloudinary logoUrl:`);
  for (const b of broken) {
    console.log(`  ${b.name}: ${b.logoUrl}`);
  }

  const { count } = await prisma.brand.updateMany({
    where: {
      id: { in: broken.map((b) => b.id) },
    },
    data: { logoUrl: null },
  });

  console.log(`\nCleared logoUrl for ${count} brand(s).`);
  console.log('Visit /admin/brands to upload replacement logos from Cloudinary.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
