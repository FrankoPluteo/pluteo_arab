import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/cart', '/checkout', '/order/', '/_next/'],
      },
    ],
    sitemap: 'https://pluteo.shop/sitemap.xml',
  };
}
