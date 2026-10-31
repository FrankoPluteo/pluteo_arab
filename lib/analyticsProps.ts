import type { Product } from '@/types';

/**
 * Product properties for analytics, shared by lib/analytics.ts (browser events) and
 * server components that render product markup (the /jesen page). No browser APIs here.
 */

const toCents = (amount: number) => Math.round(amount * 100) / 100;

/** The fields product events need; search results and quiz results carry only these. */
export type TrackedProduct = Pick<Product, 'id' | 'name' | 'price' | 'discountAmount'> & {
  brand: { name: string };
};

/** The product properties every product event carries; price is what one bottle costs. */
export function productProps(product: TrackedProduct) {
  return {
    product_id: product.id,
    name: product.name,
    brand: product.brand.name,
    price: toCents(product.price - product.discountAmount),
  };
}

/**
 * Autocapture attributes for a product shown in a list. PostHog reads them off the clicked
 * element or any parent, so they go on the card's outer element.
 * @param list where the card is shown, e.g. "homepage-bestsellers" or "brand-lattafa"
 * @param position 0-based index in that list
 */
export function productCaptureAttributes(
  product: TrackedProduct,
  list: string,
  position: number
): Record<`data-ph-capture-attribute-${string}`, string> {
  const props = productProps(product);
  return {
    'data-ph-capture-attribute-product-id': props.product_id,
    'data-ph-capture-attribute-product-name': props.name,
    'data-ph-capture-attribute-brand': props.brand,
    'data-ph-capture-attribute-price': String(props.price),
    'data-ph-capture-attribute-list': list,
    'data-ph-capture-attribute-position': String(position),
  };
}

/** List name for a brand, e.g. "French Avenue" -> "brand-french-avenue". */
export function brandList(brand: string): string {
  return `brand-${brand.toLowerCase().trim().replace(/\s+/g, '-')}`;
}
