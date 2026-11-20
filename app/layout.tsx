import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';
import { organizationJsonLd } from '@/lib/company';

const inter = Inter({ subsets: ['latin'] });

// Self-hosted at build time instead of loading from Google Fonts, so no visitor's IP
// reaches Google. Only used by a few pages (order success, affiliate, admin), so it is
// not preloaded everywhere; the browser fetches it where a style asks for it.
const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-montserrat',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pluteo.shop'),
  title: {
    // Pages without a title of their own (cart, checkout…); the home page sets its own.
    default: 'Pluteo',
    template: '%s | Pluteo',
  },
  description: 'Arapski parfemi uz dostavu diljem Hrvatske: Lattafa, Armaf, French Avenue, Ahmed Al Maghribi i Riiffs.',
  applicationName: 'Pluteo',
  authors: [{ name: 'Pluteo' }],
  // No canonical or og:url here: every page sets its own, and a site-wide one made pages
  // without their own (the 404 page among them) point at the home page.
  openGraph: {
    siteName: 'Pluteo',
    locale: 'hr_HR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Indexing is the default, so only the preview limits are set. A 404 then carries just
  // Next.js's own "noindex" instead of that plus a contradicting "index, follow".
  robots: {
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  // iOS doesn't use an SVG as the home-screen icon: app/apple-icon.png is a 180×180 PNG.
  icons: {
    icon: '/icon.svg',
    apple: { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr" className={montserrat.variable}>
      <head />
      <body className={inter.className}>
        {/* The Meta Pixel is loaded by components/MetaPixel.tsx, only after cookie
            consent. There is no <noscript> pixel: without JS consent can't be given. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // The site's only Organization node (lib/company.ts); products refer to it by @id.
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <ClientProviders>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}