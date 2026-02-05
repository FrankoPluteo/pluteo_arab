export const SHIPPING_COST = 0.99;

export function calculateShipping(): number {
  return SHIPPING_COST;
}

export function isCountryAllowed(country: string): boolean {
  return country === 'HR' || country === 'Croatia';
}

