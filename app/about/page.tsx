import { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'About Pluteo — Authentic Arabian & Oud Perfumes in Croatia',
  description: 'Pluteo is Croatia\'s destination for authentic Arabian perfumes and oud fragrances. We offer 100% original Lattafa, Armaf & French Avenue perfumes with fast shipping across Croatia.',
  keywords: 'about pluteo, arabian perfume shop croatia, authentic oud perfumes, lattafa armaf croatia, luxury perfume store, oriental fragrances croatia',
  alternates: {
    canonical: 'https://www.pluteo.shop/about',
  },
  openGraph: {
    title: 'About Pluteo — Your Arabian Perfume Destination in Croatia',
    description: 'Discover why Pluteo is Croatia\'s trusted source for authentic Arabian perfumes, oud fragrances, and long-lasting luxury scents.',
    url: 'https://www.pluteo.shop/about',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pluteo',
  url: 'https://www.pluteo.shop',
  logo: 'https://www.pluteo.shop/Pluteo Logo Icon.svg',
  description: 'Croatia\'s destination for authentic Arabian perfumes and oud fragrances from Lattafa, Armaf, and French Avenue.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'pluteoinfo@gmail.com',
    contactType: 'customer service',
    areaServed: 'HR',
    availableLanguage: ['English', 'Croatian'],
  },
  areaServed: {
    '@type': 'Country',
    name: 'Croatia',
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutContent />
    </>
  );
}
