import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pluteo - Premium Arabian Perfumes',
  description: 'Discover authentic Arabian fragrances and designer perfumes. Shop Lattafa, Armaf, French Avenue and premium brands at Pluteo. Free shipping on orders over 50 €.',
  keywords: 'Arabian perfumes, designer fragrances, Lattafa, Armaf, French Avenue luxury perfumes, oriental scents, oud perfumes',
  authors: [{ name: 'Pluteo' }],
  openGraph: {
    title: 'Pluteo - Premium Arabian Perfumes',
    description: 'Discover authentic Arabian fragrances and designer perfumes. Shop the finest scents.',
    url: 'https://pluteo.shop',
    siteName: 'Pluteo',
    images: [
      {
        url: 'https://pluteo.shop/og-image.jpg',
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
    description: 'Discover authentic Arabian fragrances and designer perfumes.',
    images: ['https://pluteo.shop/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
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
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}