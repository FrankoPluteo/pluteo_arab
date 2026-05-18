import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://pluteo.shop'),
  title: {
    default: 'Pluteo — Premium arabijski parfemi i oud mirisi | Hrvatska',
    template: '%s | Pluteo – Arabijski parfemi',
  },
  description: 'Pluteo — premium arabijski i nišni parfemi uz brzu dostavu diljem Hrvatske. Originalni mirisi Lattafa, Armaf i French Avenue. 100% originalni proizvodi.',
  keywords: 'arabski parfemi, arapski parfemi, oud parfemi, parfemi hrvatska, luksuzni parfemi, orijentalni parfemi, dugotrajni parfemi, Lattafa parfemi, Armaf parfemi, French Avenue parfemi, niche parfemi, parfem za muškarce, parfem za žene, kupiti parfem online, arabian perfumes, oud perfumes',
  authors: [{ name: 'Pluteo' }],
  alternates: {
    canonical: 'https://pluteo.shop',
  },
  openGraph: {
    title: 'Pluteo — Premium arabijski parfemi i oud mirisi',
    description: 'Otkrijte autentične arabijske parfeme Lattafa, Armaf i French Avenue. Dugotrajni luksuzni mirisi s brzom dostavom diljem Hrvatske.',
    url: 'https://pluteo.shop',
    siteName: 'Pluteo',
    locale: 'hr_HR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pluteo — Arabijski i oud parfemi | Hrvatska',
    description: 'Originalni arabijski parfemi Lattafa, Armaf i French Avenue. Dugotrajni luksuzni mirisi s brzom dostavom diljem Hrvatske.',
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
    <html lang="hr">
      <head />
      <body className={inter.className}>
        {/* Meta Pixel — afterInteractive defers load until page is interactive,
            eliminating the render-blocking penalty from the inline <head> script */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1530674275072054');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src="https://www.facebook.com/tr?id=1530674275072054&ev=PageView&noscript=1"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Pluteo',
              url: 'https://pluteo.shop',
              logo: 'https://pluteo.shop/logo.png',
              description: 'Pluteo — premium arabijski i nišni parfemi uz brzu dostavu diljem Hrvatske.',
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'pluteoinfo@gmail.com',
                contactType: 'customer service',
                areaServed: 'HR',
                availableLanguage: 'Croatian',
              },
            }),
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