/**
 * FE-MOB-9.1.1: Setup dynamic API Base URL & Network config in apps/mobile
 * 
 * Auto-detects local host IP via Constants.expoConfig.hostUri / LAN IP
 * to connect to Backend Gateway (:5000) and prevent 'localhost' connection
 * errors on physical mobile devices.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  resolveApiGatewayUrl,
  initApiGateway,
  checkGatewayHealth,
  type GatewayInfo,
} from './apiResolver';

export const BACKEND_PORT = 5000;
export const API_PATH = '/api/v1';

/**
 * Extracts host IP dynamically from Expo configuration.
 */
export function getMetroHostIp(): string | null {
  try {
    const constantsObj = (Constants as any)?.default || Constants;
    const hostUri = constantsObj?.expoConfig?.hostUri;
    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (err) {
    console.warn('[ApiConfig] Could not inspect hostUri:', err);
  }
  return null;
}

/**
 * Resolves API Base URL dynamically for current device/emulator environment.
 */
export async function resolveApiBaseUrl(): Promise<string> {
  const gw = await resolveApiGatewayUrl();
  return gw.url;
}

// Re-export core gateway resolution utilities for full compatibility
export {
  resolveApiGatewayUrl,
  initApiGateway,
  checkGatewayHealth,
  type GatewayInfo,
};

