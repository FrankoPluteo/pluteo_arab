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
