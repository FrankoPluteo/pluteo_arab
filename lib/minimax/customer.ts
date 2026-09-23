import crypto from 'crypto';
import { minimaxFetch } from './client';

// Confirmed against this org's Minimax data (/countries, /currencies): Croatia and EUR.
// The shop only ships within Croatia (see lib/shipping.ts isCountryAllowed), so this is fixed.
const CROATIA_COUNTRY_ID = 95;
const EUR_CURRENCY_ID = 7;

// Customer.Code truncates silently above ~30 chars, and the code(...) lookup route 404s
// (IIS treats it as a static file request) whenever the code contains a ".", so a raw
// email can't be used directly. A short deterministic hash sidesteps both: fixed length,
// hex-only, and still maps 1:1 back to the email for the find-or-create lookup below.
function customerCodeForEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24);
}

function extractCustomerId(locationHeader: string | null): number {
  const match = locationHeader?.match(/\/customers\/(\d+)/);
  if (!match) {
    throw new Error(`Minimax customer creation succeeded but no CustomerId found in Location header: ${locationHeader}`);
  }
  return Number(match[1]);
}

interface OrderForCustomer {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
}

// The Minimax Customer entity has no Email field, so the order's email is mapped to a
// Customer Code (see customerCodeForEmail above) and used as the lookup key via
// GET /customers/code({code}) — this is how repeat customers are recognized.
export async function findOrCreateMinimaxCustomer(order: OrderForCustomer): Promise<number> {
  const code = customerCodeForEmail(order.customerEmail);

  const existing = await minimaxFetch(`/customers/code(${code})`);

  if (existing.ok) {
    const customer = await existing.json();
    return customer.CustomerId;
  }

  if (existing.status !== 404) {
    const text = await existing.text();
    throw new Error(`Minimax customer lookup failed for "${order.customerEmail}" (${existing.status}): ${text}`);
  }

  const created = await minimaxFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      Code: code,
      Name: order.customerName,
      Address: order.shippingAddress || '',
      City: order.shippingCity || '',
      PostalCode: order.shippingZip || '',
      Country: { ID: CROATIA_COUNTRY_ID },
      Currency: { ID: EUR_CURRENCY_ID },
      // No TaxNumber/VATIdentificationNumber: this is a private individual (B2C),
      // not a VAT-registered legal entity, so those fields are intentionally left blank.
      SubjectToVAT: 'N',
    }),
  });

  if (!created.ok) {
    const text = await created.text();
    throw new Error(`Minimax customer creation failed for "${order.customerEmail}" (${created.status}): ${text}`);
  }

  // The create response body is empty (201 with []) — the new id is only in Location.
  return extractCustomerId(created.headers.get('location'));
}
