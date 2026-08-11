import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret = process.env.LINK_SIGNING_SECRET;
  if (!secret) {
    throw new Error('LINK_SIGNING_SECRET is not defined');
  }
  return secret;
}

export function signPayload(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function verifyPayload(payload: string, signature: string): boolean {
  const expected = Buffer.from(signPayload(payload), 'hex');
  const actual = Buffer.from(signature, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
