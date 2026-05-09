import { Metadata } from 'next';
import ContactContent from './ContactContent';

export const metadata: Metadata = {
  title: 'Kontakt | Pluteo – Arabijski parfemi',
  description: 'Kontaktirajte Pluteo — vaš online parfumerijski shop za arabijske i nišne parfeme u Hrvatskoj. Odgovaramo u kratkom roku.',
  alternates: {
    canonical: 'https://pluteo.shop/contact',
  },
  openGraph: {
    title: 'Kontakt | Pluteo – Arabijski parfemi',
    description: 'Kontaktirajte Pluteo — vaš online parfumerijski shop za arabijske i nišne parfeme u Hrvatskoj.',
    url: 'https://pluteo.shop/contact',
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
