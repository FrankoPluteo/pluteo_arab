import { Metadata } from 'next';
import ContactContent from './ContactContent';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Kontaktirajte Pluteo - vaš online parfumerijski shop za arapske i nišne parfeme u Hrvatskoj. Odgovaramo u kratkom roku.',
  alternates: {
    canonical: 'https://www.pluteo.shop/contact',
  },
  openGraph: {
    title: 'Kontakt | Pluteo - Arapski parfemi',
    description: 'Kontaktirajte Pluteo - vaš online parfumerijski shop za arapske i nišne parfeme u Hrvatskoj.',
    url: 'https://www.pluteo.shop/contact',
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
