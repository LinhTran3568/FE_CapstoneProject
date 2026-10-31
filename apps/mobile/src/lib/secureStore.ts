import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '@ticketshield/types';
import { TokenStorageAdapter } from '@ticketshield/api-client';

export const SECURE_KEYS = {
  ACCESS_TOKEN: 'ticketshield_mobile_access_token',
  REFRESH_TOKEN: 'ticketshield_mobile_refresh_token',
  USER_DATA: 'ticketshield_mobile_user',
  GATEWAY_URL: 'ticketshield_custom_gateway_url',
} as const;

// In-memory fallback if storage is completely unavailable
const memoryFallback = new Map<string, string>();

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryFallback.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[SecureStore] Error reading key "${key}":`, err);
    return memoryFallback.get(key) ?? null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryFallback.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
    memoryFallback.set(key, value);
  } catch (err) {
    console.warn(`[SecureStore] Error setting key "${key}":`, err);
    memoryFallback.set(key, value);
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      memoryFallback.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
    memoryFallback.delete(key);
  } catch (err) {
    console.warn(`[SecureStore] Error deleting key "${key}":`, err);
    memoryFallback.delete(key);
  }
}

export const secureStorage = {
  getAccessToken: async (): Promise<string | null> => {
    return await getSecureItem(SECURE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await getSecureItem(SECURE_KEYS.REFRESH_TOKEN);
  },

  setTokens: async (accessToken?: string, refreshToken?: string): Promise<void> => {
    if (accessToken) {
      await setSecureItem(SECURE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      await setSecureItem(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  clearTokens: async (): Promise<void> => {
    await deleteSecureItem(SECURE_KEYS.ACCESS_TOKEN);
    await deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
  },

  getUser: async (): Promise<User | null> => {
    const raw = await getSecureItem(SECURE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  setUser: async (user: User | null): Promise<void> => {
    if (!user) {
      await deleteSecureItem(SECURE_KEYS.USER_DATA);
    } else {
      await setSecureItem(SECURE_KEYS.USER_DATA, JSON.stringify(user));
    }
  },

  clearAllSessionData: async (): Promise<void> => {
    await deleteSecureItem(SECURE_KEYS.ACCESS_TOKEN);
    await deleteSecureItem(SECURE_KEYS.REFRESH_TOKEN);
    await deleteSecureItem(SECURE_KEYS.USER_DATA);
  },

  getCustomGateway: async (): Promise<string | null> => {
    return await getSecureItem(SECURE_KEYS.GATEWAY_URL);
  },

  setCustomGateway: async (url: string | null): Promise<void> => {
    if (!url) {
      await deleteSecureItem(SECURE_KEYS.GATEWAY_URL);
    } else {
      await setSecureItem(SECURE_KEYS.GATEWAY_URL, url);
    }
  },
};

/**
 * Pluggable Token Storage Adapter for @ticketshield/api-client
 */
export const mobileSecureStoreAdapter: TokenStorageAdapter = {
  getToken: () => secureStorage.getAccessToken(),
  getRefreshToken: () => secureStorage.getRefreshToken(),
  setTokens: (access, refresh) => secureStorage.setTokens(access, refresh),
  clearTokens: () => secureStorage.clearTokens(),
};

