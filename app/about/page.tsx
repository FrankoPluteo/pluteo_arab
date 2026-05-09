import { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'O nama | Pluteo – Arabijski parfemi Hrvatska',
  description: 'Pluteo — vaša destinacija za autentične arabijske parfeme i oud mirise u Hrvatskoj. Nudimo 100% originalne parfeme Lattafa, Armaf i French Avenue s brzom dostavom.',
  keywords: 'o pluteo, arabski parfemi hrvatska, autentični oud parfemi, Lattafa Armaf hrvatska, luksuzni parfemi online, orijentalni mirisi hrvatska',
  alternates: {
    canonical: 'https://pluteo.shop/about',
  },
  openGraph: {
    title: 'O nama | Pluteo – Arabijski parfemi Hrvatska',
    description: 'Saznajte zašto je Pluteo povjerljiv izvor autentičnih arabijskih parfema, oud mirisa i dugotrajnih luksuznih mirisa u Hrvatskoj.',
    url: 'https://pluteo.shop/about',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pluteo',
  url: 'https://pluteo.shop',
  logo: 'https://pluteo.shop/logo.png',
  description: 'Pluteo — vaša destinacija za autentične arabijske parfeme i oud mirise iz Lattafa, Armaf i French Avenue u Hrvatskoj.',
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
