import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/cart', '/checkout', '/order/'],
      },
    ],
    sitemap: 'https://www.pluteo.shop/sitemap.xml',
  };
}
