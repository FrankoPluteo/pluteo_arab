import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  addPackItems: (product1: Product, product2: Product, packId: string, discount: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === product.id && !item.valentinePackId);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id && !item.valentinePackId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity: 1 }] });
        }
      },

      addPackItems: (product1, product2, packId, discount) => {
        const items = get().items;
        // Check if this pack is already in the cart
        const existingPack = items.find((item) => item.valentinePackId === packId);
        if (existingPack) {
          return; // Pack already in cart
        }

        const perItemDiscount = discount / 2;
        set({
          items: [
            ...items,
            { product: product1, quantity: 1, valentinePackId: packId, packDiscount: perItemDiscount },
            { product: product2, quantity: 1, valentinePackId: packId, packDiscount: perItemDiscount },
          ],
        });
      },

      removeItem: (productId) => {
        const items = get().items;
        const itemToRemove = items.find((item) => item.product.id === productId);

        if (itemToRemove?.valentinePackId) {
          // Remove entire pack — both items with same valentinePackId
          set({
            items: items.filter((item) => item.valentinePackId !== itemToRemove.valentinePackId),
          });
        } else {
          set({ items: items.filter((item) => item.product.id !== productId) });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const items = get().items;
        const item = items.find((i) => i.product.id === productId);

        // Valentine pack items are locked to quantity 1
        if (item?.valentinePackId) {
          return;
        }

        set({
          items: items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const basePrice = item.product.price - item.product.discountAmount;
          const packDiscount = item.packDiscount || 0;
          const price = basePrice - packDiscount;
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
