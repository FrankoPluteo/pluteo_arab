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
    default: 'Pluteo - Arapski parfemi i oud mirisi | Hrvatska',
    template: '%s | Pluteo',
  },
  description: 'Arapski parfemi i oud mirisi uz brzu dostavu diljem Hrvatske. 100% originalni Lattafa, Armaf i French Avenue parfemi - dugotrajni orijentalni mirisi za nju i njega.',
  applicationName: 'Pluteo',
  authors: [{ name: 'Pluteo' }],
  alternates: {
    canonical: 'https://www.pluteo.shop',
  },
  openGraph: {
    title: 'Pluteo - Arapski parfemi i oud mirisi',
    description: 'Otkrijte autentične arapske parfeme Lattafa, Armaf i French Avenue. Dugotrajni luksuzni mirisi s brzom dostavom diljem Hrvatske.',
    url: 'https://www.pluteo.shop',
    siteName: 'Pluteo',
    locale: 'hr_HR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pluteo - Arapski parfemi i oud mirisi | Hrvatska',
    description: 'Originalni arapski parfemi Lattafa, Armaf i French Avenue. Dugotrajni luksuzni mirisi s brzom dostavom diljem Hrvatske.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
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