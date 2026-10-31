/**
 * The stored cookie consent format, without browser APIs, so server code (order success
 * page) can read the pluteo_consent cookie too. lib/consent.ts is the browser side.
 */

export type ConsentCategory = 'analytics' | 'marketing';
export type ConsentState = Record<ConsentCategory, boolean>;

// Bump when categories change, so everyone is asked again.
const VERSION = 1;
export const CONSENT_COOKIE_NAME = 'pluteo_consent';

export const ALL_GRANTED: ConsentState = { analytics: true, marketing: true };
export const ALL_DENIED: ConsentState = { analytics: false, marketing: false };

// Cookie value: "v1.a1.m0"
export function encodeConsent(state: ConsentState): string {
  return `v${VERSION}.a${state.analytics ? 1 : 0}.m${state.marketing ? 1 : 0}`;
}

/** The choice in a stored value, or null when there is none (or it is outdated). */
export function decodeConsent(value: string | null | undefined): ConsentState | null {
  if (!value) return null;
  // Single choice stored before categories existed
  if (value === 'granted') return ALL_GRANTED;
  if (value === 'denied') return ALL_DENIED;
  const match = value.match(/^v(\d+)\.a([01])\.m([01])$/);
  if (!match || Number(match[1]) !== VERSION) return null;
  return { analytics: match[2] === '1', marketing: match[3] === '1' };
}
