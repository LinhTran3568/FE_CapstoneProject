import { create } from 'zustand';
import { User } from '@ticketshield/types';
import { LoginFormData, RegisterFormData } from '@ticketshield/validation';
import { authApi, onUnauthorized } from '@ticketshield/api-client';
import { secureStorage } from '../lib/secureStore';
import { initApiGateway, GatewayInfo } from '../lib/apiResolver';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  gatewayInfo: GatewayInfo | null;

  // Actions
  login: (credentials: LoginFormData) => Promise<boolean>;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  refreshGateway: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Setup listener for silent refresh token failure / unauthorized
  onUnauthorized(() => {
    console.warn('[AuthStore] Session expired or unauthorized, logging out...');
    get().logout();
  });

  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    gatewayInfo: null,

    login: async (credentials: LoginFormData): Promise<boolean> => {
      set({ isLoading: true, error: null });
      try {
        // Ensure gateway and adapter are initialized
        const gw = await initApiGateway();
        set({ gatewayInfo: gw });

        // Call backend login
        const response = await authApi.login(credentials);

        // Store tokens securely in hardware keystore / keychain
        await secureStorage.setTokens(response.token, response.refreshToken);
        await secureStorage.setUser(response.user);

        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        const errorMsg =
          err?.message ||
          err?.response?.data?.message ||
          'Sign in failed. Please check your credentials or server connection.';
        set({
          isLoading: false,
          error: errorMsg,
          isAuthenticated: false,
        });
        return false;
      }
    },

    register: async (data: RegisterFormData): Promise<boolean> => {
      set({ isLoading: true, error: null });
      try {
        const gw = await initApiGateway();
        set({ gatewayInfo: gw });

        const response = await authApi.register(data);

        await secureStorage.setTokens(response.token, response.refreshToken);
        await secureStorage.setUser(response.user);

        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        const errorMsg =
          err?.message ||
          err?.response?.data?.message ||
          'Registration failed. Please check your information.';
        set({
          isLoading: false,
          error: errorMsg,
          isAuthenticated: false,
        });
        return false;
      }
    },

    logout: async (): Promise<void> => {
      try {
        await authApi.logout();
      } catch (e) {
        // Continue clearing client session even if remote logout fails
      }
      await secureStorage.clearAllSessionData();
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },

    checkAuth: async (): Promise<void> => {
      set({ isLoading: true });
      try {
        // 1. Resolve dynamic gateway & wire adapter
        const gw = await initApiGateway();
        set({ gatewayInfo: gw });

        // 2. Read stored tokens from SecureStore
        const storedToken = await secureStorage.getAccessToken();
        const storedRefreshToken = await secureStorage.getRefreshToken();
        const cachedUser = await secureStorage.getUser();

        if (!storedToken) {
          // First launch or logged out
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // 3. User has token: attempt to verify with backend
        try {
          const freshUser = await authApi.getCurrentUser();
          await secureStorage.setUser(freshUser);
          set({
            user: freshUser,
            token: storedToken,
            refreshToken: storedRefreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (fetchErr: any) {
          // If offline or network error, fallback to cached user
          if (cachedUser) {
            set({
              user: cachedUser,
              token: storedToken,
              refreshToken: storedRefreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid/expired and no cache
            await secureStorage.clearAllSessionData();
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } catch (err) {
        console.warn('[AuthStore] Auth check error:', err);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    setUser: (user: User) => {
      secureStorage.setUser(user);
      set({ user });
    },

    clearError: () => {
      set({ error: null });
    },

    refreshGateway: async () => {
      const gw = await initApiGateway();
      set({ gatewayInfo: gw });
    },
  };
});
