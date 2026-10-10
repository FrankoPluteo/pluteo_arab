import { Metadata } from 'next';
import RecommendationContent from './RecommendationContent';

export const metadata: Metadata = {
  title: 'Pronađi svoj arapski parfem - kviz',
  description: 'Odgovorite na kratki kviz i pronađite savršeni arapski parfem koji odgovara vašim preferencijama, prigodi i budžetu.',
  alternates: {
    canonical: 'https://www.pluteo.shop/find-your-scent',
  },
  openGraph: {
    title: 'Pronađi svoj miris | Pluteo',
    description: 'Kratki kviz za pronalazak savršenog mirisa. Preporuke na temelju vaših preferencija.',
    url: 'https://www.pluteo.shop/find-your-scent',
  },
};

export default function FindYourScentPage() {
  return <RecommendationContent />;
}
