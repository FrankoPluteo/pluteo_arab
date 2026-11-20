import { Metadata } from 'next';
import AboutContent from './AboutContent';
import { ORGANIZATION_ID } from '@/lib/company';
import { absoluteUrl } from '@/lib/urls';

export const metadata: Metadata = {
  title: 'O nama - online parfumerija arapskih parfema',
  description: 'Tko stoji iza Pluteo parfumerije: arapski parfemi Lattafa, Armaf, French Avenue, Ahmed Al Maghribi i Riiffs uz dostavu diljem Hrvatske.',
  alternates: {
    canonical: 'https://www.pluteo.shop/about',
  },
  openGraph: {
    title: 'O nama - online parfumerija arapskih parfema | Pluteo',
    description: 'Tko stoji iza Pluteo parfumerije: arapski parfemi Lattafa, Armaf, French Avenue, Ahmed Al Maghribi i Riiffs uz dostavu diljem Hrvatske.',
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
