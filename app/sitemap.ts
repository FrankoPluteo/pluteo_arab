import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { absoluteUrl, brandPath, genderPath, productPath, shopPath } from '@/lib/urls';

/**
 * lastModified is a real date wherever there is one (a product's updatedAt, or the newest
 * product a listing shows), and left out for static pages, rather than "now" on every
 * request, which teaches search engines to ignore it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    select: { id: true, updatedAt: true, brand: { select: { name: true } } },
  });

  const newest = (dates: Date[]) =>
    dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined;
  const catalogUpdated = newest(products.map((p) => p.updatedAt));

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: catalogUpdated, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl(shopPath()), lastModified: catalogUpdated, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/poklon/za-nju'), lastModified: catalogUpdated, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/poklon/za-njega'), lastModified: catalogUpdated, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/find-your-scent'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/legal'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/privatnost'), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // One listing per brand that has products, dated by its newest product.
  const byBrand = new Map<string, Date[]>();
  for (const p of products) {
    byBrand.set(p.brand.name, [...(byBrand.get(p.brand.name) ?? []), p.updatedAt]);
  }
  const brandPages: MetadataRoute.Sitemap = [...byBrand.entries()].map(([name, dates]) => ({
    url: absoluteUrl(brandPath(name)),
    lastModified: newest(dates),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const genderPages: MetadataRoute.Sitemap = (['male', 'female'] as const).map((gender) => ({
    url: absoluteUrl(genderPath(gender)),
    lastModified: catalogUpdated,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(productPath(product)),
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...brandPages, ...genderPages, ...productPages];
}
