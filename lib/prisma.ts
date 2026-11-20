import { PrismaClient } from '@prisma/client';
import { SHOW_REVIEWS } from '@/lib/reviews';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Neon's free tier suspends the database after 5 idle minutes, and waking it can take
 * longer than Prisma's default 5 s connect timeout ("Can't reach database server").
 * Give the first connection 15 s unless the URL already sets its own timeout.
 */
function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15');
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function withReviewAggregates<T extends { id: string }>(products: T[]) {
  // With reviews switched off every product reads as unrated, so no card shows stars.
  if (products.length === 0 || !SHOW_REVIEWS) {
    return products.map((p) => ({ ...p, reviewCount: 0, averageRating: 0 }));
  }

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
