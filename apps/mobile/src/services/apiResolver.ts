import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { setApiBaseUrl, setTokenAdapter } from '@ticketshield/api-client';
import { secureStorage, mobileSecureStoreAdapter } from './secureStore';

declare const process: any;

export interface GatewayInfo {
  url: string;
  host: string;
  port: number;
  source: 'custom_override' | 'lan_auto_detect' | 'emulator_alias' | 'env_config' | 'localhost_fallback';
  isLan: boolean;
}

const DEFAULT_BACKEND_PORT = 5000;
const API_PATH = '/api/v1';

/**
 * Extracts host IP from Expo Constants / debugger runtime
 */
function extractMetroHostIp(): string | null {
  try {
    const constantsObj = (Constants as any)?.default || Constants;

    // Expo SDK 49+ / 50 Expo Config hostUri (e.g. "192.168.1.15:8081")
    const hostUri = constantsObj?.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    // Expo Go manifest2 fallback
    const manifest2DebuggerHost = constantsObj?.manifest2?.extra?.expoGo?.debuggerHost;
    if (manifest2DebuggerHost && typeof manifest2DebuggerHost === 'string') {
      const ip = manifest2DebuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    // Older manifest fallback
    const manifestDebuggerHost = constantsObj?.manifest?.debuggerHost;
    if (manifestDebuggerHost && typeof manifestDebuggerHost === 'string') {
      const ip = manifestDebuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (err) {
    console.warn('[ApiResolver] Could not inspect Expo host URI:', err);
  }

  return null;
}

/**
 * Resolves the active backend gateway URL
 */
export async function resolveApiGatewayUrl(): Promise<GatewayInfo> {
  // 1. Check user manual override stored in SecureStore
  const customOverride = await secureStorage.getCustomGateway();
  if (customOverride && customOverride.trim().length > 0) {
    const cleanUrl = customOverride.trim().replace(/\/+$/, '');
    return {
      url: cleanUrl.endsWith(API_PATH) ? cleanUrl : `${cleanUrl}${API_PATH}`,
      host: cleanUrl.replace(/^https?:\/\//, '').split(':')[0],
      port: Number(cleanUrl.split(':').pop()?.split('/')[0]) || DEFAULT_BACKEND_PORT,
      source: 'custom_override',
      isLan: false,
    };
  }

  // 2. Check if LAN IP is auto-detected via Expo Metro host
  const lanIp = extractMetroHostIp();
  if (lanIp) {
    return {
      url: `http://${lanIp}:${DEFAULT_BACKEND_PORT}${API_PATH}`,
      host: lanIp,
      port: DEFAULT_BACKEND_PORT,
      source: 'lan_auto_detect',
      isLan: true,
    };
  }

  // 3. Android Emulator specific localhost bridge (10.0.2.2)
  if (Platform.OS === 'android') {
    return {
      url: `http://10.0.2.2:${DEFAULT_BACKEND_PORT}${API_PATH}`,
      host: '10.0.2.2',
      port: DEFAULT_BACKEND_PORT,
      source: 'emulator_alias',
      isLan: false,
    };
  }

  // 4. Check EXPO_PUBLIC_API_BASE_URL from .env
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return {
      url: envUrl.replace(/\/+$/, ''),
      host: envUrl.replace(/^https?:\/\//, '').split(':')[0],
      port: Number(envUrl.split(':').pop()?.split('/')[0]) || DEFAULT_BACKEND_PORT,
      source: 'env_config',
      isLan: false,
    };
  }

  // 5. Default fallback for iOS Simulator / Web
  return {
    url: `http://localhost:${DEFAULT_BACKEND_PORT}${API_PATH}`,
    host: 'localhost',
    port: DEFAULT_BACKEND_PORT,
    source: 'localhost_fallback',
    isLan: false,
  };
}

/**
 * Pings backend gateway to check connectivity & latency
 */
export async function checkGatewayHealth(
  targetUrl?: string
): Promise<{ ok: boolean; status?: number; latencyMs: number; error?: string }> {
  const urlToPing = targetUrl || (await resolveApiGatewayUrl()).url;
  // Use gateway ping endpoint or root
  const healthEndpoint = urlToPing.replace(/\/api\/v1\/?$/, '') + '/health';
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(healthEndpoint, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      ok: false,
      latencyMs,
      error: err?.message || 'Không thể kết nối đến Gateway',
    };
  }
}

/**
 * Initializes API Gateway and SecureStore Token Adapter for the Mobile app
 */
let isInitialized = false;

export async function initApiGateway(): Promise<GatewayInfo> {
  // Always hook secure store token adapter
  setTokenAdapter(mobileSecureStoreAdapter);

  const gatewayInfo = await resolveApiGatewayUrl();
  setApiBaseUrl(gatewayInfo.url);

  if (!isInitialized) {
    console.log(`[TicketShield Mobile] Dynamic Gateway Resolved: ${gatewayInfo.url} (Source: ${gatewayInfo.source})`);
    isInitialized = true;
  }

  return gatewayInfo;
}
