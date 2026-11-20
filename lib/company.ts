/**
 * Company details shown on the legal page and in the Organization JSON-LD. One place, so
 * the site, structured data and (later) Merchant Center all say the same thing.
 *
 * Only facts the owner has confirmed go here. `null` means "not provided yet": the field is
 * left out of the page and the JSON-LD instead of being guessed.
 */
import { SITE_URL } from '@/lib/urls';

export const COMPANY = {
  /** Shop name customers know. */
  brandName: 'Pluteo',
  /** Registered company name, already shown on /legal before this change. */
  legalName: 'Vonta Grupa d.o.o.',
  email: 'pluteoinfo@gmail.com',
  // TODO(owner): registered address (street, postcode, city), if it may be shown publicly.
  address: null as null | { street: string; postalCode: string; city: string },
  // TODO(owner): OIB.
  oib: null as string | null,
  // TODO(owner): MBS and registry court (trgovački sud).
  registry: null as string | null,
  // TODO(owner): customer service phone, if it may be shown publicly.
  phone: null as string | null,
  // TODO(owner): full profile URLs, e.g. https://www.instagram.com/<handle>/ and https://www.tiktok.com/@<handle>
  socialProfiles: [] as string[],
} as const;

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** The site's single Organization node; other JSON-LD refers to it by ORGANIZATION_ID. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: COMPANY.brandName,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/pluteo-logo-email.png`,
    description: 'Pluteo - arapski i orijentalni parfemi uz dostavu diljem Hrvatske.',
    email: COMPANY.email,
    ...(COMPANY.phone && { telephone: COMPANY.phone }),
    ...(COMPANY.oib && { taxID: COMPANY.oib }),
    ...(COMPANY.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY.address.street,
        postalCode: COMPANY.address.postalCode,
        addressLocality: COMPANY.address.city,
        addressCountry: 'HR',
      },
    }),
    ...(COMPANY.socialProfiles.length > 0 && { sameAs: COMPANY.socialProfiles }),
    contactPoint: {
      '@type': 'ContactPoint',
      email: COMPANY.email,
      ...(COMPANY.phone && { telephone: COMPANY.phone }),
      contactType: 'customer service',
      areaServed: 'HR',
      availableLanguage: ['Croatian', 'English'],
    },
  };
}
