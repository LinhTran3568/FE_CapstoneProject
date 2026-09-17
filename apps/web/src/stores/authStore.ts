import { create } from 'zustand';
import { User } from '@ticketshield/types';
import { authApi, TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '@ticketshield/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for silent refresh failures or expired refresh tokens
  if (typeof window !== 'undefined') {
    window.addEventListener(UNAUTHORIZED_EVENT, () => {
      authApi.logout();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    });
  }

  return {
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null,
    isAuthenticated: false,
    isLoading: true,
    login: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
      set({ user, token, isAuthenticated: true, isLoading: false });
    },
    logout: () => {
      authApi.logout();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },
    checkAuth: async () => {
      const existingToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      if (!existingToken) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        set({ isLoading: true });
        const currentUser = await authApi.getCurrentUser();
        set({ user: currentUser, token: existingToken, isAuthenticated: true, isLoading: false });
      } catch (error) {
        authApi.logout();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    },
  };
});

