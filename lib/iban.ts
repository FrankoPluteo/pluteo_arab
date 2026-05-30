/**
 * Validates an IBAN using the ISO 13616 MOD-97 checksum algorithm.
 * Works for any country's IBAN — no country-specific length tables needed.
 */
export function validateIBAN(raw: string): boolean {
  const iban = raw.replace(/\s+/g, '').toUpperCase();

  // Must be 5–34 chars: 2-letter country + 2 check digits + 1-30 BBAN chars
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(iban)) return false;

  // Move first 4 chars to end, then replace each letter with its numeric value (A=10…Z=35)
  const rearranged = (iban.slice(4) + iban.slice(0, 4))
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 65 ? (code - 55).toString() : c;
    })
    .join('');

  // Compute MOD 97 of the large integer in digit-by-digit chunks (avoids overflow)
  let remainder = 0;
  for (const digit of rearranged) {
    remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
  }

  return remainder === 1;
}
