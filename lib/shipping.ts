export const GLS_SHIPPING_COST = 4.99;
export const BOXNOW_SHIPPING_COST = 0.00;

// Keep backward compat alias
export const SHIPPING_COST = GLS_SHIPPING_COST;

export type ShippingMethod = 'gls' | 'boxnow';

export function calculateShipping(method: ShippingMethod = 'gls'): number {
  return method === 'boxnow' ? BOXNOW_SHIPPING_COST : GLS_SHIPPING_COST;
}

export function isCountryAllowed(country: string): boolean {
  return country === 'HR' || country === 'Croatia';
}
