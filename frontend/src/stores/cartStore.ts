import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, MenuItem } from '../types';
import { apiService } from '../services/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  getCart: () => Promise<void>;
  addToCart: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  checkout: (paymentMethod: string, specialInstructions?: string) => Promise<void>;
  clearError: () => void;
}

type CartStore = CartState & CartActions;

// src/stores/cartStore.ts
// ... (imports and interfaces as before)

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,

      getCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const cart = await apiService.getCart();
          set({ cart, isLoading: false });
        } catch (error: any) {
          // IMPORTANT: Ensure errors from apiService are propagated here
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Failed to load cart',
          });
          // Re-throw the error so component can catch it
          throw new Error(error.response?.data?.detail || 'Failed to load cart');
        }
      },

      addToCart: async (menuItem: MenuItem, quantity: number, specialInstructions?: string) => {
        set({ isLoading: true, error: null });
        try {
          const updatedCart = await apiService.addToCart(menuItem.id, quantity, specialInstructions);
          set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Failed to add item to cart',
          });
          throw new Error(error.response?.data?.detail || 'Failed to add item to cart');
        }
      },

      removeFromCart: async (cartItemId: number) => {
        set({ isLoading: true, error: null });
        try {
            const currentCart = get().cart;
            if (!currentCart) {
                // If cart is null, means no cart loaded. Don't proceed.
                throw new Error('Cart not loaded. Cannot remove item.');
            }
            const updatedCart = await apiService.removeFromCart(currentCart.id, cartItemId);
            set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Failed to remove item from cart',
          });
          throw new Error(error.response?.data?.detail || 'Failed to remove item from cart');
        }
      },

      updateQuantity: async (cartItemId: number, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
            const currentCart = get().cart;
            if (!currentCart) {
                // If cart is null, means no cart loaded. Don't proceed.
                throw new Error('Cart not loaded. Cannot update quantity.');
            }
            const updatedCart = await apiService.updateCartItemQuantity(currentCart.id, cartItemId, quantity);
            set({ cart: updatedCart, isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Failed to update quantity',
          });
          throw new Error(error.response?.data?.detail || 'Failed to update quantity');
        }
      },

      clearCart: () => {
        set({ cart: null, error: null });
      },

      checkout: async (paymentMethod: string, specialInstructions?: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiService.checkout(paymentMethod, specialInstructions);
          set({ cart: null, isLoading: false }); // Cart is cleared after checkout
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Checkout failed',
          });
          throw new Error(error.response?.data?.detail || 'Checkout failed');
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'cart-storage', // unique name
      getStorage: () => localStorage,
    }
  )
);