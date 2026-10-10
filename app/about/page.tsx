import { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'O nama - Arapski parfemi i oud mirisi u Hrvatskoj',
  description: 'Pluteo - vaša destinacija za autentične arapske parfeme i oud mirise u Hrvatskoj. Nudimo 100% originalne parfeme Lattafa, Armaf i French Avenue s brzom dostavom.',
  keywords: 'o pluteo, arapski parfemi hrvatska, arabski parfemi hrvatska, premium arapski parfemi, autentični oud parfemi, Lattafa Armaf hrvatska, luksuzni parfemi online, orijentalni mirisi hrvatska',
  alternates: {
    canonical: 'https://www.pluteo.shop/about',
  },
  openGraph: {
    title: 'O nama - Arapski parfemi i oud mirisi u Hrvatskoj',
    description: 'Saznajte zašto je Pluteo povjerljiv izvor autentičnih arapskih parfema, oud mirisa i dugotrajnih luksuznih mirisa u Hrvatskoj.',
    url: 'https://www.pluteo.shop/about',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pluteo',
  url: 'https://www.pluteo.shop',
  logo: 'https://www.pluteo.shop/pluteo-logo-email.png',
  description: 'Pluteo - vaša destinacija za autentične arapske parfeme i oud mirise iz Lattafa, Armaf i French Avenue u Hrvatskoj.',
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
