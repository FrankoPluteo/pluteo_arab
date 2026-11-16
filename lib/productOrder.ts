import type { Prisma } from '@prisma/client';

/**
 * The shop's product order, set by dragging in /admin/products/order: lowest sortOrder
 * first. /products (default sort), the home page rows and the gift pages all use it.
 * New products get a sortOrder below every other one, so they start at the top; equal
 * positions fall back to newest first for the same reason.
 */
export const SHOP_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { createdAt: 'desc' },
];
