import { Metadata } from 'next';
import AboutContent from './AboutContent';
import { ORGANIZATION_ID } from '@/lib/company';
import { absoluteUrl } from '@/lib/urls';

export const metadata: Metadata = {
  title: 'O nama - Arapski parfemi i oud mirisi u Hrvatskoj',
  description: 'Pluteo - vaša destinacija za autentične arapske parfeme i oud mirise u Hrvatskoj. Nudimo 100% originalne parfeme Lattafa, Armaf i French Avenue s brzom dostavom.',
  alternates: {
    canonical: 'https://www.pluteo.shop/about',
  },
  openGraph: {
    title: 'O nama - Arapski parfemi i oud mirisi u Hrvatskoj',
    description: 'Saznajte zašto je Pluteo povjerljiv izvor autentičnih arapskih parfema, oud mirisa i dugotrajnih luksuznih mirisa u Hrvatskoj.',
    url: 'https://www.pluteo.shop/about',
  },
};

// The Organization itself is in the root layout; this page only says it is about it.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  url: absoluteUrl('/about'),
  about: { '@id': ORGANIZATION_ID },
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
