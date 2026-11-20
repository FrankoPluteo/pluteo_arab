import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/urls';

// The page itself is a client component, so its metadata lives here. Its own canonical,
// instead of none (it used to inherit the home page's).
export const metadata: Metadata = {
  title: 'Affiliate program',
  description: 'Pluteo affiliate program: preporučite naše parfeme i zaradite proviziju na svaku narudžbu s vašim kodom.',
  alternates: { canonical: absoluteUrl('/affiliate') },
};

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
