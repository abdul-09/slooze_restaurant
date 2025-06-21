import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    re_password: string;
    first_name: string;
    last_name: string;
    region: 'india' | 'america';
  }) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (uid: string, token: string, new_password: string, re_new_password: string) => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.login({ email, password });
          
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || error.response?.data?.email?.[0] || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.register(data);
          
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || error.response?.data?.email?.[0] || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      getCurrentUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await apiService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiService.resetPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Password reset failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      confirmPasswordReset: async (uid: string, token: string, new_password: string, re_new_password: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiService.confirmPasswordReset(uid, token, new_password, re_new_password);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Password reset confirmation failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 