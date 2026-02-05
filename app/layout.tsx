import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pluteo - Premium Arabian Perfumes',
  description: 'Discover authentic Arabian fragrances from Lattafa, Armaf, and French Avenue. Premium oriental perfumes shipped across Croatia. Shop luxury oud, musk, and designer scents.',
  keywords: 'Arabian perfumes, designer fragrances, Lattafa, Armaf, French Avenue, luxury perfumes, oriental scents, oud perfumes, Croatia perfume shop',
  authors: [{ name: 'Pluteo' }],
  openGraph: {
    title: 'Pluteo - Premium Arabian Perfumes',
    description: 'Discover authentic Arabian fragrances from Lattafa, Armaf, and French Avenue. Premium oriental perfumes shipped across Croatia.',
    url: 'https://www.pluteo.shop',
    siteName: 'Pluteo',
    images: [
      {
        url: 'https://www.pluteo.shop/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pluteo Perfumes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pluteo - Premium Arabian Perfumes',
    description: 'Discover authentic Arabian fragrances from Lattafa, Armaf, and French Avenue.',
    images: ['https://www.pluteo.shop/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/public/favicon.ico" },
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
