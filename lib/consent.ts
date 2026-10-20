'use client';

import { useSyncExternalStore } from 'react';

/**
 * Cookie consent per category. Necessary storage (cart, language, this choice) needs no
 * consent and is not listed here. Optional categories:
 *   analytics  first-touch campaign attribution saved with orders (lib/attribution.ts)
 *   marketing  Meta Pixel (lib/metaPixel.ts)
 * The choice is kept in localStorage and mirrored in a first-party cookie, so it survives
 * either one being cleared. Nothing in an optional category may run until it is granted.
 */

export type ConsentCategory = 'analytics' | 'marketing';
export type ConsentState = Record<ConsentCategory, boolean>;

// Bump when categories change, so everyone is asked again.
const VERSION = 1;
const STORAGE_KEY = 'pluteo-consent';
const COOKIE_NAME = 'pluteo_consent';
const COOKIE_MAX_AGE_S = 180 * 24 * 60 * 60;
const CHANGE_EVENT = 'pluteo-consent-change';
const OPEN_EVENT = 'pluteo-consent-open';

export const ALL_GRANTED: ConsentState = { analytics: true, marketing: true };
export const ALL_DENIED: ConsentState = { analytics: false, marketing: false };

// Cookie value: "v1.a1.m0"
function encode(state: ConsentState): string {
  return `v${VERSION}.a${state.analytics ? 1 : 0}.m${state.marketing ? 1 : 0}`;
}

function decode(value: string | null): ConsentState | null {
  if (!value) return null;
  // Single choice stored before categories existed
  if (value === 'granted') return ALL_GRANTED;
  if (value === 'denied') return ALL_DENIED;
  const match = value.match(/^v(\d+)\.a([01])\.m([01])$/);
  if (!match || Number(match[1]) !== VERSION) return null;
  return { analytics: match[2] === '1', marketing: match[3] === '1' };
}

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
