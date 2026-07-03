import { Metadata } from 'next';
import RecommendationContent from './RecommendationContent';

export const metadata: Metadata = {
  title: 'Pronađi svoj miris | Pluteo – Arabijski parfemi',
  description: 'Odgovorite na kratki kviz i pronađite savršeni arabijski parfem koji odgovara vašim preferencijama, prigodi i budžetu.',
  alternates: {
    canonical: 'https://pluteo.shop/preporuka',
  },
  openGraph: {
    title: 'Pronađi svoj miris | Pluteo',
    description: 'Kratki kviz za pronalazak savršenog mirisa. Preporuke na temelju vaših preferencija.',
    url: 'https://pluteo.shop/preporuka',
  },
};

export default function PreporukaPage() {
  return <RecommendationContent />;
}
