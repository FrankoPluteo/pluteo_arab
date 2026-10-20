'use client';

import { hasMarketingConsent } from '@/lib/consent';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: Fbq;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const PIXEL_ID = '1530674275072054';
const RETRY_MS = 250;
const MAX_TRIES = 20;

// Only the live shop reports to Meta. localhost, 127.0.0.1 and Vercel preview
// deployments (*.vercel.app) never load the pixel, so tests can't pollute the data.
const TRACKING_HOSTS = ['pluteo.shop', 'www.pluteo.shop'];

function isTrackingHost(): boolean {
  return TRACKING_HOSTS.includes(window.location.hostname);
}

/** Everything that would have gone to Meta on a non-production host, for local testing. */
function logSkipped(...args: unknown[]) {
  console.info(`[meta-pixel] not sent on ${window.location.hostname}:`, ...args);
}

/**
 * Loads Meta's script and sends the PageView. Only call after consent: this is what sets
 * the _fbp cookie. Safe to call more than once.
 */
export function loadMetaPixel() {
  if (typeof window === 'undefined' || window.fbq || !hasMarketingConsent()) return;
  if (!isTrackingHost()) {
    logSkipped('init + PageView');
    return;
  }

  // Meta's standard base code, minus the inline <script> wrapper.
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = window._fbq ?? fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

/** Tells an already loaded pixel to stop sending, after the visitor withdraws consent. */
export function revokeMetaPixel() {
  window.fbq?.('consent', 'revoke');
}

/**
 * Sends a standard Meta Pixel event. A no-op without marketing consent. The pixel loads
 * after consent and asynchronously, so an event fired on mount can run before `fbq`
 * exists: wait for it briefly instead of dropping the event.
 * Returns whether the event was handed to the pixel (false without consent or off the
 * production host).
 */
export function trackMetaEvent(
  event: string,
  params: Record<string, unknown>,
  options?: { eventID?: string }
): boolean {
  if (typeof window === 'undefined' || !hasMarketingConsent()) return false;
  if (!isTrackingHost()) {
    logSkipped(event, params, options ?? '');
    return false;
  }

  let tries = 0;
  const send = () => {
    // Re-check: consent can be withdrawn while we wait for the script.
    if (!hasMarketingConsent()) return;
    if (window.fbq) {
      if (options?.eventID) window.fbq('track', event, params, { eventID: options.eventID });
      else window.fbq('track', event, params);
      return;
    }
    if (++tries < MAX_TRIES) setTimeout(send, RETRY_MS);
  };
  send();
  return true;
}
