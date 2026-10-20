'use client';

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

const RETRY_MS = 250;
const MAX_TRIES = 20;

/**
 * Sends a standard Meta Pixel event. The pixel snippet in app/layout.tsx loads
 * afterInteractive, so an event fired on mount can run before `fbq` exists:
 * wait for it briefly instead of dropping the event.
 */
export function trackMetaEvent(event: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  let tries = 0;
  const send = () => {
    if (window.fbq) {
      window.fbq('track', event, params);
      return;
    }
    if (++tries < MAX_TRIES) setTimeout(send, RETRY_MS);
  };
  send();
}
