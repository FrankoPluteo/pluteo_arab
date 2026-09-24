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
  async redirects() {
    return [
      {
        source: '/preporuka',
        destination: '/find-your-scent',
        permanent: true,
      },
      {
        source: '/ljeto',
        destination: '/',
        permanent: true,
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
