import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function withReviewAggregates<T extends { id: string }>(products: T[]) {
  if (products.length === 0) return products.map((p) => ({ ...p, reviewCount: 0, averageRating: 0 }));

  const ids = products.map((p) => p.id);
  const aggregates = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: ids } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const map = new Map(aggregates.map((a) => [a.productId, a]));

  return products.map((p) => ({
    ...p,
    averageRating: map.get(p.id)?._avg.rating ?? 0,
    reviewCount: map.get(p.id)?._count.rating ?? 0,
  }));
}
