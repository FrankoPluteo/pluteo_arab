import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  // pdfjs (used by pdf-parse to read the JIR off Minimax invoice PDFs) loads its worker file
  // at runtime and breaks when bundled, so it must stay a plain node_modules import.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  // @napi-rs/canvas loads its platform binary via a dynamic require that file tracing can't
  // follow, so without this the Vercel function ships without it and JIR extraction fails.
  outputFileTracingIncludes: {
    '/api/webhooks/stripe': ['./node_modules/@napi-rs/canvas-linux-x64-gnu/**'],
  },
  // PostHog goes through our own domain (see lib/analytics.ts api_host), so ad blockers
  // don't drop it and no request leaves for posthog.com from the browser.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  // Basic hardening on every response. No Content-Security-Policy on purpose: a wrong
  // policy can break Stripe, PostHog or the Meta Pixel. X-Frame-Options stops other sites
  // from framing the shop (clickjacking); framing by our own pages still works.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/preporuka',
        destination: '/find-your-scent',
        permanent: true,
      },
      {
        // Croatian spelling of the contact page, seen as an organic landing URL (it was a 404)
        source: '/kontakt',
        destination: '/contact',
        statusCode: 301,
      },
      {
        // Finished campaign pages: old ad and social links land on the shop.
        // Query strings (promo, utm_*) are carried over by Next.js automatically.
        // Temporary, so the paths can be reused for a future campaign.
        source: '/:campaign(ljeto|jesen)',
        destination: '/products',
        permanent: false,
      },
    ];
  },
  images: {
    // Serve AVIF first, then WebP — both are far smaller than JPEG/PNG
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    remotePatterns: [
      {
        // Cloudinary CDN — used for all product and brand images
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
