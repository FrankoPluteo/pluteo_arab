import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/urls';

// A partner's private dashboard: nothing here belongs in search results.
export const metadata: Metadata = {
  title: { absolute: 'Affiliate nadzorna ploča | Pluteo' },
  robots: { index: false, follow: false },
  alternates: { canonical: absoluteUrl('/affiliate/dashboard') },
};

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
