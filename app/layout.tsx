import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pluteo.shop'),
  title: {
    default: 'Pluteo - Arapski parfemi i oud mirisi | Hrvatska',
    template: '%s | Pluteo',
  },
  description: 'Arapski parfemi i oud mirisi uz brzu dostavu diljem Hrvatske. 100% originalni Lattafa, Armaf i French Avenue parfemi - dugotrajni orijentalni mirisi za nju i njega.',
  keywords: 'arapski parfemi, arabski parfemi, arabijski parfemi, premium arapski parfemi, premium parfemi, oud parfemi, parfemi hrvatska, luksuzni parfemi, orijentalni parfemi, dugotrajni parfemi, Lattafa parfemi, Armaf parfemi, French Avenue parfemi, niche parfemi, parfem za muškarce, parfem za žene, kupiti parfem online, arabian perfumes, oud perfumes',
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
              url: 'https://www.pluteo.shop',
              logo: 'https://www.pluteo.shop/pluteo-logo-email.png',
              description: 'Pluteo - premium arapski i nišni parfemi uz brzu dostavu diljem Hrvatske.',
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