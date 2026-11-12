/**
 * Promo and affiliate codes are stored uppercase with no spaces, but customers type
 * "petra 15", " Petra15 " or paste a code with a zero-width space from an email.
 * Every code goes through normalizeCode before it is looked up, on the client and
 * on the server, so those all resolve to PETRA15.
 */

// \s misses the zero-width characters that sneak in when a code is copied from an email.
const WHITESPACE = /[\s​-‍⁠﻿]+/g;

export function normalizeCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(WHITESPACE, '').toUpperCase();
}

/**
 * The forms to look a code up by, best first: the normalized code, then the older
 * trim-and-uppercase form, so a code that was saved with a space inside still works.
 */
export function codeLookupCandidates(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  const normalized = normalizeCode(raw);
  const legacy = raw.trim().toUpperCase();
  return [...new Set([normalized, legacy])].filter(Boolean);
}
