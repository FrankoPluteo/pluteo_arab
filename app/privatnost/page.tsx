import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'Politika privatnosti i kolačića',
  description: 'Kako Pluteo prikuplja i koristi osobne podatke, koje kolačiće koristimo i kako promijeniti postavke.',
  alternates: { canonical: 'https://www.pluteo.shop/privatnost' },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
