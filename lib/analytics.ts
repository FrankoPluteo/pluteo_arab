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
 * promo_applied or promo_failed, with the same properties in every flow so breakdowns by
 * source and reason line up. `reason` is the /api/promo rejection reason (min_order,
 * expired, per_user, ...); `deferred` marks a code kept on an empty cart to be checked later.
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
}) {
  track(result.success ? 'promo_applied' : 'promo_failed', result);
}

/** Ties this browser's events to the buyer. Only ever with analytics consent. */
export function identifyBuyer(email: string, properties: { first_order_at: string }) {
  if (!isReady() || !hasConsent('analytics')) return;
  posthog.identify(email, { email }, { first_order_at: properties.first_order_at });
}

/** Sent with the checkout request, so the server side purchase joins this browser session. */
export function getAnalyticsContext(): { distinctId: string | null; consent: boolean } {
  return {
    distinctId: isReady() ? posthog.get_distinct_id() : null,
    consent: hasConsent('analytics'),
  };
}
