import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Pluteo | Premium Arabian Perfumes & Oud Fragrances — Luxury Scents in Europe',
    template: '%s | Pluteo — Arabian Perfumes & Oud Fragrances',
  },
  description: 'Shop authentic Arabian perfumes and luxury oud fragrances from Lattafa, Armaf, and French Avenue. Long-lasting oriental scents with fast shipping across Croatia and Europe. 100% original products.',
  keywords: 'arabian perfumes, oud perfumes, luxury fragrances, long lasting perfumes, oriental perfumes, niche perfumes, Lattafa, Armaf, French Avenue, perfume shop europe, oud fragrances, arabski parfemi, arapski parfemi, oud parfemi, parfemi hrvatska, luksuzni parfemi, orijentalni parfemi, dugotrajni parfemi, Lattafa parfemi, Armaf parfemi, niche parfemi, parfem za muškarce, parfem za žene',
  authors: [{ name: 'Pluteo' }],
  alternates: {
    canonical: 'https://www.pluteo.shop',
  },
  openGraph: {
    title: 'Pluteo | Premium Arabian Perfumes & Oud Fragrances — Shipped Across Europe',
    description: 'Discover authentic Arabian fragrances from Lattafa, Armaf, and French Avenue. Long-lasting luxury oud, musk, and oriental perfumes delivered across Croatia and Europe.',
    url: 'https://www.pluteo.shop',
    siteName: 'Pluteo',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Pluteo | Arabian & Oud Perfumes — Luxury Fragrances in Europe',
    description: 'Authentic Arabian perfumes from Lattafa, Armaf & French Avenue. Long-lasting luxury fragrances shipped across Croatia and Europe.',
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
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <script
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
              fbq('init', '4497298900555732');
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
            src="https://www.facebook.com/tr?id=4497298900555732&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}