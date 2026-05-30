import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types';
import { AFFILIATE_DISCOUNT_RATE } from '@/lib/affiliateConfig';

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface CartStore {
  items: CartItem[];
  cartSessionId: string;
  promoCode: string | null;
  promoDiscount: number;
  promoFreeShipping: boolean;
  affiliateCode: string | null;
  affiliateName: string | null;
  affiliateDiscountRate: number;
  selectedTester: Product | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string, discount: number, freeShipping: boolean) => void;
  removePromo: () => void;
  applyAffiliate: (code: string, name: string) => void;
  removeAffiliate: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  setTester: (product: Product | null) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartSessionId: generateSessionId(),
      promoCode: null,
      promoDiscount: 0,
      promoFreeShipping: false,
      affiliateCode: null,
      affiliateName: null,
      affiliateDiscountRate: 0,
      selectedTester: null,

      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === product.id);
        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () =>
        set({ items: [], promoCode: null, promoDiscount: 0, promoFreeShipping: false, affiliateCode: null, affiliateName: null, affiliateDiscountRate: 0, selectedTester: null }),

      setTester: (product) => set({ selectedTester: product }),

      applyPromo: (code, discount, freeShipping) =>
        set({ promoCode: code, promoDiscount: discount, promoFreeShipping: freeShipping }),

      removePromo: () =>
        set({ promoCode: null, promoDiscount: 0, promoFreeShipping: false }),

      applyAffiliate: (code, name) => set({ affiliateCode: code, affiliateName: name, affiliateDiscountRate: AFFILIATE_DISCOUNT_RATE }),

      removeAffiliate: () => set({ affiliateCode: null, affiliateName: null, affiliateDiscountRate: 0 }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.price - item.product.discountAmount;
          return total + price * item.quantity;
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
