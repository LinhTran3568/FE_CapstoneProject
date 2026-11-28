import { create } from 'zustand';
import { User } from '@ticketshield/types';
import { LoginFormData, RegisterFormData } from '@ticketshield/validation';
import { authApi, onUnauthorized, normalizeErrorMessage } from '@ticketshield/api-client';
import { secureStorage } from '../lib/secureStore';
import { initApiGateway, GatewayInfo } from '../lib/apiResolver';

interface AuthState {
  user: User | null;
  userProfile: User | null;
  token: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  gatewayInfo: GatewayInfo | null;

  // Actions
  login: (credentials: LoginFormData) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setUserProfile: (profile: User) => void;
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
    userProfile: null,
    token: null,
    accessToken: null,
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
          userProfile: response.user,
          token: response.token,
          accessToken: response.token,
          refreshToken: response.refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        const rawMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Sign in failed. Please check your credentials or server connection.';
        const errorMsg = normalizeErrorMessage(rawMsg, 'Sign in failed. Please check your credentials or server connection.');
        set({
          isLoading: false,
          error: errorMsg,
          isAuthenticated: false,
        });
        return false;
      }
    },

    googleLogin: async (idToken: string): Promise<boolean> => {
      set({ isLoading: true, error: null });
      try {
        const gw = await initApiGateway();
        set({ gatewayInfo: gw });

        const response = await authApi.googleLogin(idToken);

        await secureStorage.setTokens(response.token, response.refreshToken);
        await secureStorage.setUser(response.user);

        set({
          user: response.user,
          userProfile: response.user,
          token: response.token,
          accessToken: response.token,
          refreshToken: response.refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        const rawMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Google authentication failed. Please try again.';
        const errorMsg = normalizeErrorMessage(rawMsg, 'Google authentication failed. Please try again.');
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
          userProfile: response.user,
          token: response.token,
          accessToken: response.token,
          refreshToken: response.refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        const rawMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Registration failed. Please check your information.';
        const errorMsg = normalizeErrorMessage(rawMsg, 'Registration failed. Please check your information.');
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
        userProfile: null,
        token: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },

    loadStoredAuth: async (): Promise<void> => {
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
            userProfile: null,
            token: null,
            accessToken: null,
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
            userProfile: freshUser,
            token: storedToken,
            accessToken: storedToken,
            refreshToken: storedRefreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (fetchErr: any) {
          // If offline or network error, fallback to cached user from SecureStore
          if (cachedUser) {
            set({
              user: cachedUser,
              userProfile: cachedUser,
              token: storedToken,
              accessToken: storedToken,
              refreshToken: storedRefreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid/expired and no cache
            await secureStorage.clearAllSessionData();
            set({
              user: null,
              userProfile: null,
              token: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      } catch (err) {
        console.warn('[AuthStore] loadStoredAuth error:', err);
        set({
          user: null,
          userProfile: null,
          token: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    checkAuth: async (): Promise<void> => {
      return get().loadStoredAuth();
    },

    setUser: (user: User) => {
      secureStorage.setUser(user);
      set({ user, userProfile: user });
    },

    setUserProfile: (profile: User) => {
      secureStorage.setUser(profile);
      set({ user: profile, userProfile: profile });
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
