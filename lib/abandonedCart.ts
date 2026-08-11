import { signPayload } from '@/lib/signedToken';

const RECOVERY_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getFirstName(customerName: string): string {
  return customerName.trim().split(/\s+/)[0] || customerName;
}

// "Khamrah Dukhan", "Khamrah Dukhan i Vulcan Feu", "A, B i C"
export function buildItemNameList(items: any[]): string {
  const names = items.map((item) => item?.product?.name).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} i ${names[names.length - 1]}`;
}

// Only send between 09:00-21:00 Europe/Zagreb. Rather than pre-computing a
// "push to next morning" timestamp, the cron simply skips sending outside this
// window — the order stays unsent and the next run (there's always one before
// 21:00 or after 09:00) picks it up, which lands it at the next morning open
// without any extra state.
export function isWithinSendWindow(date: Date): boolean {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zagreb',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(date),
    10
  );
  return hour >= 9 && hour < 21;
}

export function buildRecoveryLink(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const exp = Date.now() + RECOVERY_LINK_TTL_MS;
  const sig = signPayload(`${orderId}:${exp}`);
  return `${baseUrl}/api/cart/recover?order=${orderId}&exp=${exp}&sig=${sig}`;
}

export function buildUnsubscribeLink(email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const normalized = email.trim().toLowerCase();
  const sig = signPayload(normalized);
  return `${baseUrl}/api/unsubscribe/abandoned-cart?email=${encodeURIComponent(normalized)}&sig=${sig}`;
}
