import { Metadata } from 'next';
import LegalContent from './LegalContent';

export const metadata: Metadata = {
  title: 'Pravne informacije | Pluteo – Dostava, povrat i podaci o tvrtki',
  description: 'Uvjeti dostave, politika povrata i podaci o tvrtki za Pluteo. Poslujemo kao Vonta Grupa d.o.o. u Hrvatskoj. GLS dostava, fiksna naknada 4,99 €.',
  alternates: {
    canonical: 'https://pluteo.shop/legal',
  },
  openGraph: {
    title: 'Pravne informacije | Pluteo',
    description: 'Dostava, povrat i podaci o tvrtki za Pluteo parfumerijski shop.',
    url: 'https://pluteo.shop/legal',
  },
};

export default function LegalPage() {
  return <LegalContent />;
}
