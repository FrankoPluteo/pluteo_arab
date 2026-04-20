import { Metadata } from 'next';
import LegalContent from './LegalContent';

export const metadata: Metadata = {
  title: 'Legal Information — Pluteo | Shipping, Returns & Company Info',
  description: 'Shipping details, return policy, and company information for Pluteo. Operated by Vonta Grupa d.o.o. in Croatia. GLS shipping, 4.99 € flat rate.',
  alternates: {
    canonical: 'https://www.pluteo.shop/legal',
  },
  openGraph: {
    title: 'Legal Information — Pluteo',
    description: 'Shipping, returns, and company information for Pluteo perfume shop.',
    url: 'https://www.pluteo.shop/legal',
  },
};

export default function LegalPage() {
  return <LegalContent />;
}
