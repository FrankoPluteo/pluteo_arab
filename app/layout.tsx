import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Pluteo | Arabski Parfemi i Oud Parfemi u Hrvatskoj — Luksuzni Mirisi',
    template: '%s | Pluteo — Arabian Perfumes Croatia',
  },
  description: 'Kupite autentične arapske parfeme i oud parfeme u Hrvatskoj. Lattafa, Armaf i French Avenue — dugotrajni luksuzni mirisi s dostavom po cijeloj Hrvatskoj. 100% originalni proizvodi.',
  keywords: 'arabski parfemi, arapski parfemi, oud parfemi, parfemi hrvatska, luksuzni parfemi, Lattafa parfemi, Armaf parfemi, French Avenue parfemi, orijentalni parfemi, dugotrajni parfemi, arabian perfumes croatia, oud perfumes, luxury fragrances croatia, long lasting perfumes, oriental perfumes, niche perfumes croatia',
  authors: [{ name: 'Pluteo' }],
  alternates: {
    canonical: 'https://www.pluteo.shop',
  },
  openGraph: {
    title: 'Pluteo | Premium Arabian & Oud Perfumes — Shipped Across Croatia',
    description: 'Discover authentic Arabian fragrances from Lattafa, Armaf, and French Avenue. Long-lasting luxury oud, musk, and oriental perfumes delivered across Croatia.',
    url: 'https://www.pluteo.shop',
    siteName: 'Pluteo',
    images: [
      {
        url: 'https://www.pluteo.shop/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pluteo — Premium Arabian and Oud Perfumes in Croatia',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pluteo | Arabian & Oud Perfumes — Luxury Fragrances in Croatia',
    description: 'Authentic Arabian perfumes from Lattafa, Armaf & French Avenue. Long-lasting luxury fragrances shipped across Croatia.',
    images: ['https://www.pluteo.shop/og-image.jpg'],
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
    icon: [
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
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
