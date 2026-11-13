'use client';

import posthog, { type CaptureResult } from 'posthog-js';
import { hasConsent, onConsentChange as onStoredConsentChange } from '@/lib/consent';

export { brandList, productCaptureAttributes, productProps, type TrackedProduct } from '@/lib/analyticsProps';

/**
 * PostHog (EU cloud), started once from instrumentation-client.ts. Components use the
 * functions here and never import posthog-js themselves.
 *
 * Without analytics consent PostHog runs cookieless: the anonymous ID lives in memory only
 * (so it lasts until the next full page load), nothing is written to cookies or storage,
 * there is no session replay and nobody is identified. With consent it switches to
 * localStorage+cookie and starts replay; withdrawing consent switches back and wipes it.
 *
 * Without NEXT_PUBLIC_POSTHOG_KEY nothing starts and every function here is a no-op.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Error reports only from the built site: local dev errors (hot reload, half-typed code)
// would otherwise land in the live PostHog project, since local .env uses the same key.
const REPORT_ERRORS = process.env.NODE_ENV === 'production';

// Admin pages are our own work, not shopper behaviour.
const IGNORED_PATH_PREFIXES = ['/admin'];

// Our own devices: set by ?internal=1 (cleared by ?internal=0) or by using /admin, and sent
// as the internal_user super property, which the PostHog project filters out.
const INTERNAL_FLAG_KEY = 'pluteo-internal';

function readInternalFlag(): boolean {
  try {
    return localStorage.getItem(INTERNAL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function writeInternalFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    else localStorage.removeItem(INTERNAL_FLAG_KEY);
  } catch {
    // storage unavailable: the flag can't be remembered on this device
  }
}

/** Reads ?internal=1 / ?internal=0, and marks devices that use the admin pages. */
function syncInternalFlagFromPage() {
  const value = new URLSearchParams(window.location.search).get('internal');
  if (value === '1') writeInternalFlag(true);
  else if (value === '0') writeInternalFlag(false);
  // The middleware sends anyone who isn't logged in to /admin/login, so any other admin
  // page means a logged-in admin.
  else if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
    writeInternalFlag(true);
  }
}

/** Puts the stored flag on (or takes it off) every event this page sends. */
function applyInternalFlag() {
  if (!isReady()) return;
  if (readInternalFlag()) posthog.register({ internal_user: true });
  else posthog.unregister('internal_user');
}

/** Marks this device as ours, e.g. right after an admin login. */
export function markInternalDevice() {
  writeInternalFlag(true);
  applyInternalFlag();
}

function isReady(): boolean {
  return typeof window !== 'undefined' && posthog.__loaded;
}

function dropIgnoredPaths(event: CaptureResult | null): CaptureResult | null {
  // Errors are kept everywhere: a broken admin page still needs fixing.
  if (event?.event === '$exception') return event;
  const path = window.location.pathname;
  return IGNORED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix)) ? null : event;
}

/** Removes whatever PostHog stored while consent was granted (ph_<key>_posthog and friends). */
function clearStoredIds() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      Object.keys(storage)
        .filter((key) => key.startsWith('ph_') || key.startsWith('__ph'))
        .forEach((key) => storage.removeItem(key));
    } catch {
      // storage unavailable: nothing was stored there
    }
  }
  document.cookie
    .split('; ')
    .map((cookie) => cookie.split('=')[0])
    .filter((name) => name.startsWith('ph_'))
    .forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; Path=/`;
      // PostHog sets its cookie on the top level domain (.pluteo.shop) when it can
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${window.location.hostname.replace(/^www\./, '')}`;
    });
}

export function initAnalytics() {
  if (!KEY || typeof window === 'undefined' || posthog.__loaded) return;

  // Returning visitors who already accepted start with storage and replay right away.
  const consented = hasConsent('analytics');

  posthog.init(KEY, {
    api_host: '/ingest',
    ui_host: 'https://eu.posthog.com',
    // PostHog loads its add-ons (surveys.js, recorder.js...) before React hydrates. By
    // default it inserts them before the first <body> script, which is the layout's
    // JSON-LD, and that breaks hydration. React 19 skips unknown tags at the end of <head>.
    external_scripts_inject_target: 'head',
    // Only analytics and session replay are used; this skips downloading surveys.js.
    disable_surveys: true,
    autocapture: true,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // Error tracking: uncaught errors and unhandled promise rejections. Errors caught by
    // the React error boundaries (app/error.tsx, app/global-error.tsx) never reach the
    // window handlers, so those report themselves through captureError below.
    capture_exceptions: REPORT_ERRORS,
    person_profiles: 'identified_only',
    persistence: consented ? 'localStorage+cookie' : 'memory',
    disable_session_recording: !consented,
    session_recording: {
      maskAllInputs: true,
      // Elements with the ph-mask class have their text masked as well (rrweb's maskTextClass).
    },
    before_send: dropIgnoredPaths,
    // Super properties are registered only once PostHog is up, under whichever
    // persistence the consent choice above picked.
    loaded: () => {
      syncInternalFlagFromPage();
      applyInternalFlag();
    },
  });

  onStoredConsentChange((state) => onConsentChange(state.analytics));
}

/** Applies a new analytics consent choice. Wired to the cookie banner by initAnalytics. */
export function onConsentChange(granted: boolean) {
  if (!isReady()) return;
  if (granted) {
    posthog.set_config({ persistence: 'localStorage+cookie' });
    posthog.startSessionRecording();
  } else {
    posthog.stopSessionRecording();
    posthog.reset();
    posthog.set_config({ persistence: 'memory' });
    clearStoredIds();
    // reset() drops super properties; an internal device stays internal.
    applyInternalFlag();
  }
}

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined | object>;

export function track(event: string, properties?: AnalyticsProps) {
  if (!isReady()) return;
  posthog.capture(event, properties);
}

/**
 * Reports an error caught by a React error boundary. `digest` (set by Next.js on errors
 * thrown on the server) matches the server side report from instrumentation.ts.
 */
export function captureError(error: unknown, properties?: AnalyticsProps) {
  if (!isReady() || !REPORT_ERRORS) return;
  posthog.captureException(error, properties);
}

/**
 * Where a promo/affiliate code came from: typed in the cart, a link (?promo=), a landing
 * page's own campaign code, or the cart's re-check of a saved code.
 */
export type PromoSource = 'manual' | 'url' | 'landing' | 'recheck';

/**
 * How a failed code was shown: 'shown' a red error under the field (typed by hand),
 * 'silent' dropped with at most a neutral note (link or re-check), 'fallback' replaced by
 * the current campaign code (FALLBACK_PROMO_CODE).
 */
export type PromoFailureHandling = 'silent' | 'fallback' | 'shown';

/**
 * promo_applied or promo_failed, with the same properties in every flow so breakdowns by
 * source and reason line up. `reason` is the /api/promo rejection reason (min_order,
 * expired, per_user, ...); `deferred` marks a code kept on an empty cart to be checked later.
 * `fallback_for` is set on the promo_applied of a fallback code: the dead code it replaced.
 */
export function trackPromo(result: {
  code: string;
  code_type: 'promo' | 'affiliate';
  source: PromoSource;
  success: boolean;
  reason?: string;
  server_reason?: string;
  discount?: number;
  deferred?: boolean;
  handled?: PromoFailureHandling;
  fallback_for?: string;
}) {
  track(result.success ? 'promo_applied' : 'promo_failed', result);
}

/** Ties this browser's events to the buyer. Only ever with analytics consent. */
export function identifyBuyer(email: string, properties: { first_order_at: string }) {
  if (!isReady() || !hasConsent('analytics')) return;
  posthog.identify(email, { email }, { first_order_at: properties.first_order_at });
}

/** Sent with the checkout request, so the server side purchase joins this browser session. */
export function getAnalyticsContext(): { distinctId: string | null; sessionId: string | null; consent: boolean } {
  return {
    distinctId: isReady() ? posthog.get_distinct_id() : null,
    sessionId: isReady() ? posthog.get_session_id() || null : null,
    consent: hasConsent('analytics'),
  };
}

// The same search is often reported twice in a row: once while typing in the navbar,
// then again by the results page when Enter is pressed.
const SEARCH_REPEAT_MS = 10_000;
let lastSearch: { query: string; at: number } | null = null;

/**
 * search_performed { query, results_count, source }. Called once per search, never for the
 * partial queries typed on the way: by the navbar dropdown when that search ends (result
 * opened, dropdown closed, page left, or 3 s without typing), or by the results page when a
 * search is submitted. The same query within 10 s is only sent once.
 */
export function trackSearch(query: string, resultsCount: number, source: 'instant' | 'results_page') {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalized.length < 2) return;
  const now = Date.now();
  if (lastSearch && lastSearch.query === normalized && now - lastSearch.at < SEARCH_REPEAT_MS) return;
  lastSearch = { query: normalized, at: now };
  track('search_performed', { query: normalized, results_count: resultsCount, source });
}
