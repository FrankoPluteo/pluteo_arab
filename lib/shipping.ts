export const SHIPPING_COST = 4.99;
export const FREE_SHIPPING_THRESHOLD = 50;

export const ALLOWED_COUNTRIES = {
  HR: 'Croatia',
};

export function calculateShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return SHIPPING_COST;
}

export function isCountryAllowed(countryCode: string): boolean {
  return countryCode in ALLOWED_COUNTRIES;
}
