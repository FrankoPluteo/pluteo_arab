import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const perMinuteLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, '1 m'),
      prefix: 'ratelimit:recommend:min',
    })
  : null;

const perDayLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, '1 d'),
      prefix: 'ratelimit:recommend:day',
    })
  : null;

export type RateLimitResult = { limited: false } | { limited: true; scope: 'minute' | 'day' };

// Fails open (no limiting) if Upstash env vars aren't configured, so local dev
// isn't blocked on infra setup. Production must have the env vars set for this
// to actually protect the endpoint.
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  if (!perMinuteLimiter || !perDayLimiter) {
    console.warn('Rate limiting is not configured (missing UPSTASH_REDIS_REST_URL/TOKEN) — skipping.');
    return { limited: false };
  }

  const [minuteResult, dayResult] = await Promise.all([
    perMinuteLimiter.limit(ip),
    perDayLimiter.limit(ip),
  ]);

  if (!dayResult.success) return { limited: true, scope: 'day' };
  if (!minuteResult.success) return { limited: true, scope: 'minute' };
  return { limited: false };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'unknown';
}
