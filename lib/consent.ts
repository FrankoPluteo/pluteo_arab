'use client';

import { useSyncExternalStore } from 'react';
import {
  ALL_DENIED,
  ALL_GRANTED,
  CONSENT_COOKIE_NAME as COOKIE_NAME,
  decodeConsent as decode,
  encodeConsent as encode,
  type ConsentCategory,
  type ConsentState,
} from '@/lib/consentCookie';

/**
 * Cookie consent per category. Necessary storage (cart, language, this choice) needs no
 * consent and is not listed here. Optional categories:
 *   analytics  first-touch campaign attribution saved with orders (lib/attribution.ts)
 *              and PostHog storage + session replay (lib/analytics.ts)
 *   marketing  Meta Pixel (lib/metaPixel.ts)
 * The choice is kept in localStorage and mirrored in a first-party cookie, so it survives
 * either one being cleared. Nothing in an optional category may run until it is granted.
 */

export { ALL_DENIED, ALL_GRANTED, type ConsentCategory, type ConsentState };

const STORAGE_KEY = 'pluteo-consent';
const COOKIE_MAX_AGE_S = 180 * 24 * 60 * 60;
const CHANGE_EVENT = 'pluteo-consent-change';
const OPEN_EVENT = 'pluteo-consent-open';

function readCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

/** The stored choice, or null when the visitor has not decided yet. */
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = decode(localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // localStorage unavailable: fall back to the cookie
  }
  return decode(readCookie());
}

export function hasConsent(category: ConsentCategory): boolean {
  return getConsent()?.[category] === true;
}

export function hasMarketingConsent(): boolean {
  return hasConsent('marketing');
}

export function setConsent(state: ConsentState) {
  const value = encode(state);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // the cookie below still records the choice
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE_S}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<ConsentState>(CHANGE_EVENT, { detail: state }));
}

/** Calls back whenever the visitor saves a choice. Returns the unsubscribe function. */
export function onConsentChange(callback: (state: ConsentState) => void): () => void {
  const handler = (e: Event) => callback((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/**
 * Whether the visitor has made a choice: null while unknown (server render and hydration),
 * so nothing flashes for returning visitors before the stored choice is read.
 */
export function useConsentChosen(): boolean | null {
  return useSyncExternalStore(
    onConsentChange,
    () => getConsent() !== null,
    () => null
  );
}

/** Reopens the banner, from the footer link or /privatnost. */
export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentSettingsOpen(callback: () => void): () => void {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}
