import { create } from 'zustand';
import { Order } from '../types';
import { apiService } from '../services/api';

interface OrderStoreState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: number) => Promise<void>;
  cancelOrder: (id: number) => Promise<void>;
}

export const useOrderStore = create<OrderStoreState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await apiService.getOrders();
      set({ orders });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch orders' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrder: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const order = await apiService.getOrder(id);
      set({ currentOrder: order });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch order' });
    } finally {
      set({ isLoading: false });
    }
  },

  cancelOrder: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedOrder = await apiService.cancelOrder(id);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to cancel order' });
    } finally {
      set({ isLoading: false });
    }
  },
}));