export const SHIPPING_COST = 5;

export function calculateShipping(): number {
  return SHIPPING_COST;
}

export function isCountryAllowed(country: string): boolean {
  return country === 'HR' || country === 'Croatia';
}

