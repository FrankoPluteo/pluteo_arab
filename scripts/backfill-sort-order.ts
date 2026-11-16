/**
 * One-time script: give every product a sortOrder that matches the order /products
 * showed before the order became editable: Lattafa, French Avenue, Armaf, then any other
 * brand, oldest product first within each brand. Positions start at 1, so the shop looks
 * exactly the same until the order is changed in /admin/products/order.
 *
 * Does nothing if any product already has a non-zero sortOrder (the order has been set).
 *
 * Run once:
 *   npx tsx scripts/backfill-sort-order.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const OLD_BRAND_ORDER = ['Lattafa', 'French Avenue', 'Armaf'];

async function main() {
  const alreadySet = await prisma.product.count({ where: { sortOrder: { not: 0 } } });
  if (alreadySet > 0) {
    console.log(`${alreadySet} products already have a position; nothing changed.`);
    return;
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, brand: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const rank = (brand: string) => {
    const index = OLD_BRAND_ORDER.indexOf(brand);
    return index === -1 ? OLD_BRAND_ORDER.length : index;
  };
  // Array.sort is stable, so oldest-first holds within each brand.
  products.sort((a, b) => rank(a.brand.name) - rank(b.brand.name));

  await prisma.$transaction(
    products.map((product, index) =>
      prisma.product.update({ where: { id: product.id }, data: { sortOrder: index + 1 } })
    )
  );

  products.forEach((p, i) => console.log(`${String(i + 1).padStart(3)}  ${p.brand.name} ${p.name}`));
  console.log(`\nSet positions for ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
