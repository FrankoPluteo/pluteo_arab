'use client';

import { hasConsent } from '@/lib/consent';

/**
 * First-touch campaign attribution, only with analytics consent. On any landing page, the
 * UTM params and a promo code in the URL are kept for 30 days and sent with the order at
 * checkout (see CheckoutForm). A later campaign link does not overwrite an unexpired first
 * touch; a visit without any of these params never touches what is stored.
 */

export interface Attribution {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  /** Promo or affiliate code from the landing URL (?promo=, ?code= or ?ref=). */
  promo: string;
  captured_at: number;
}

// Same key the /jesen page used before this was site wide, so stored touches carry over.
const STORAGE_KEY = 'utm';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** The code a landing URL brings, in the precedence the /jesen page applies it. */
export function getUrlCode(params: URLSearchParams): string {
  return (params.get('promo') || params.get('code') || params.get('ref') || '').trim().toUpperCase();
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<Attribution>;
    // Touches saved before captured_at existed are at most a few days old: start their clock now.
    if (typeof stored.captured_at !== 'number') {
      const upgraded: Attribution = {
        utm_source: stored.utm_source ?? '',
        utm_medium: stored.utm_medium ?? '',
        utm_campaign: stored.utm_campaign ?? '',
        promo: stored.promo ?? '',
        captured_at: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
      return upgraded;
    }
    if (Date.now() - stored.captured_at > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored as Attribution;
  } catch {
    return null;
  }
}

type Touch = Omit<Attribution, 'captured_at'>;

// The landing URL's params, held in memory only. If the visitor grants analytics consent
// later in the same visit (usually on the banner of that same page), they are stored then.
let landingTouch: Touch | null | undefined;

function readLandingTouch(): Touch | null {
  if (landingTouch !== undefined) return landingTouch;
  const params = new URLSearchParams(window.location.search);
  const touch = {
    utm_source: params.get('utm_source')?.trim() ?? '',
    utm_medium: params.get('utm_medium')?.trim() ?? '',
    utm_campaign: params.get('utm_campaign')?.trim() ?? '',
    promo: getUrlCode(params),
  };
  const empty = !touch.utm_source && !touch.utm_medium && !touch.utm_campaign && !touch.promo;
  landingTouch = empty ? null : touch;
  return landingTouch;
}

/** Stores the first touch from the landing URL, if it has campaign params and consent. */
export function captureAttribution() {
  const touch = readLandingTouch();
  if (!touch || !hasConsent('analytics')) return;
  if (readStored()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...touch, captured_at: Date.now() }));
  } catch {
    // localStorage not available: the order simply has no attribution
  }
}

/** Removes any stored touch, when analytics consent is withdrawn. */
export function clearAttribution() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing stored
  }
}

/** The unexpired first touch for checkout, only while analytics consent is granted. */
export function getAttribution(): Attribution | null {
  return hasConsent('analytics') ? readStored() : null;
}
