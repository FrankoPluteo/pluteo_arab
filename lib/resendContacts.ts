import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function splitName(fullName: string): { firstName?: string; lastName?: string } {
  const [first, ...rest] = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: first || undefined, lastName: rest.join(' ') || undefined };
}

interface ResendResult<T> {
  data: T | null;
  error: { message: string; statusCode: number | null; name: string } | null;
}

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Resend's default limit is a couple of requests per second; back off and retry on 429
// instead of failing the whole flow (the SDK returns errors rather than throwing).
async function call<T>(fn: () => Promise<ResendResult<T>>): Promise<ResendResult<T>> {
  let result = await fn();
  for (const delay of RETRY_DELAYS_MS) {
    if (result.error?.name !== 'rate_limit_exceeded') break;
    await sleep(delay);
    result = await fn();
  }
  return result;
}

function fail(action: string, error: { message: string; name: string }): never {
  throw new Error(`Resend ${action} failed (${error.name}): ${error.message}`);
}

export interface ResendContact {
  id: string;
  email: string;
  unsubscribed: boolean;
}

async function getExactContact(email: string): Promise<ResendContact | null> {
  const { data, error } = await call(() => resend.contacts.get(email));
  if (error) {
    if (error.name === 'not_found') return null;
    fail('contacts.get', error);
  }
  return data ? { id: data.id, email: data.email, unsubscribed: data.unsubscribed } : null;
}

// Resend treats emails case-sensitively ("Ana@x.com" and "ana@x.com" are two contacts,
// and a lowercase lookup does not find the first). Older contacts were stored exactly as
// typed, usually with the first letter auto-capitalised by a phone keyboard, so before
// creating anything we also probe the address as typed and first-letter-capitalised.
// Returns the canonical (lowercase) contact first when both exist.
export async function getContactByEmail(email: string): Promise<ResendContact | null> {
  const lower = normalizeEmail(email);
  const variants = [...new Set([lower, email.trim(), lower.charAt(0).toUpperCase() + lower.slice(1)])];
  for (const variant of variants) {
    const contact = await getExactContact(variant);
    if (contact) return contact;
  }
  return null;
}

export async function listAllContacts(): Promise<
  { id: string; email: string; unsubscribed: boolean }[]
> {
  const all: { id: string; email: string; unsubscribed: boolean }[] = [];
  let after: string | undefined;
  for (;;) {
    const { data, error } = await call(() =>
      resend.contacts.list({ limit: 100, ...(after ? { after } : {}) })
    );
    if (error) fail('contacts.list', error);
    const page = data?.data ?? [];
    all.push(...page.map((c) => ({ id: c.id, email: c.email, unsubscribed: c.unsubscribed })));
    if (!data?.has_more || page.length === 0) break;
    after = page[page.length - 1].id;
    await sleep(600);
  }
  return all;
}

export async function listSegmentMemberEmails(segmentId: string): Promise<Set<string>> {
  const members = new Set<string>();
  let after: string | undefined;
  for (;;) {
    const { data, error } = await call(() =>
      resend.contacts.list({ segmentId, limit: 100, ...(after ? { after } : {}) })
    );
    if (error) fail('contacts.list(segment)', error);
    const page = data?.data ?? [];
    page.forEach((c) => members.add(normalizeEmail(c.email)));
    if (!data?.has_more || page.length === 0) break;
    after = page[page.length - 1].id;
    await sleep(600);
  }
  return members;
}

export interface KupciOutcome {
  contact: 'created' | 'existing';
  unsubscribedSet: boolean;
}

// Puts a buyer into the "Kupci" segment inside the single Resend subscriber base.
//
//   opt-out NOT ticked: missing contact -> created subscribed; existing contact -> left
//                       exactly as is (a past unsubscribe is never reversed).
//   opt-out ticked:     missing contact -> created unsubscribed; existing -> set unsubscribed.
//
// Either way the contact ends up in Kupci. Throws on unexpected Resend errors; callers
// (webhook, backfill) are responsible for catching and logging.
export async function addBuyerToKupci(opts: {
  email: string;
  fullName?: string;
  optOut?: boolean;
  // Backfill already holds every contact in memory, so it passes the match (or null for
  // "known missing") instead of paying for lookups. undefined means "look it up".
  knownContact?: ResendContact | null;
}): Promise<KupciOutcome> {
  const segmentId = process.env.RESEND_SEGMENT_KUPCI_ID;
  if (!segmentId) throw new Error('RESEND_SEGMENT_KUPCI_ID is not set');

  const email = normalizeEmail(opts.email);
  const optOut = opts.optOut === true;
  const { firstName, lastName } = splitName(opts.fullName ?? '');

  let contact = opts.knownContact !== undefined ? opts.knownContact : await getContactByEmail(opts.email);

  if (!contact) {
    const { error } = await call(() =>
      resend.contacts.create({
        email,
        firstName,
        lastName,
        unsubscribed: optOut,
        segments: [{ id: segmentId }],
      })
    );
    if (!error) return { contact: 'created', unsubscribedSet: optOut };

    // Two webhooks for the same buyer can race; if the contact appeared meanwhile,
    // fall through to the existing-contact path instead of failing.
    contact = await getContactByEmail(opts.email);
    if (!contact) fail('contacts.create', error);
  }

  let unsubscribedSet = false;
  if (optOut && !contact.unsubscribed) {
    const { error } = await call(() => resend.contacts.update({ id: contact!.id, unsubscribed: true }));
    if (error) fail('contacts.update', error);
    unsubscribedSet = true;
  }

  const { error } = await call(() => resend.contacts.segments.add({ contactId: contact!.id, segmentId }));
  if (error) fail('contacts.segments.add', error);

  return { contact: 'existing', unsubscribedSet };
}

// Global marketing opt out: the Resend contact's unsubscribed flag is the single source of
// truth. A buyer who has no contact yet is created already unsubscribed, so a later
// Kupci sync (which never touches the flag on existing contacts) can't resubscribe them.
export async function unsubscribeContact(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const contact = await getContactByEmail(normalized);

  if (!contact) {
    const { error } = await call(() => resend.contacts.create({ email: normalized, unsubscribed: true }));
    if (error) fail('contacts.create', error);
    return;
  }

  if (!contact.unsubscribed) {
    const { error } = await call(() => resend.contacts.update({ id: contact.id, unsubscribed: true }));
    if (error) fail('contacts.update', error);
  }
}
