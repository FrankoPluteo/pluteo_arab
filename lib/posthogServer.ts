import { PostHog } from 'posthog-node';

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

  const client = new PostHog(key, { host: 'https://eu.i.posthog.com', flushAt: 1, flushInterval: 0 });
  try {
    client.capture({ distinctId, event, properties });
  } catch (error) {
    console.error(`[posthog] ${event} capture failed:`, error);
  } finally {
    await client.shutdown().catch((error) => console.error(`[posthog] ${event} flush failed:`, error));
  }
}
