import { PostHog } from 'posthog-node';

function createClient(key: string) {
  return new PostHog(key, { host: 'https://eu.i.posthog.com', flushAt: 1, flushInterval: 0 });
}

/**
 * Sends one event to PostHog (EU cloud) from the server. A fresh client per call, flushed
 * before returning, so nothing is left queued when the serverless function freezes.
 * A no-op without POSTHOG_KEY. Never throws: analytics must not affect the caller.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>
) {
  const key = process.env.POSTHOG_KEY;
  if (!key) return;

  const client = createClient(key);
  try {
    client.capture({ distinctId, event, properties });
  } catch (error) {
    console.error(`[posthog] ${event} capture failed:`, error);
  } finally {
    await client.shutdown().catch((error) => console.error(`[posthog] ${event} flush failed:`, error));
  }
}

/**
 * Reports a server error to PostHog error tracking (called from instrumentation.ts).
 * Anonymous: no distinct ID, so PostHog makes one up and creates no person profile.
 * Same fresh-client-per-call and never-throws rules as captureServerEvent.
 */
export async function captureServerException(error: unknown, properties: Record<string, unknown>) {
  const key = process.env.POSTHOG_KEY;
  if (!key) return;

  const client = createClient(key);
  try {
    await client.captureExceptionImmediate(error, undefined, properties);
  } catch (captureError) {
    console.error('[posthog] exception capture failed:', captureError);
  } finally {
    await client.shutdown().catch((flushError) => console.error('[posthog] exception flush failed:', flushError));
  }
}
