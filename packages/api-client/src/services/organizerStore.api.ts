import { getApiBaseUrl } from './client';
import type { MockTicketDto } from '@ticketshield/types';

export const DEFAULT_ORGANIZER_PORT = 5006; // TicketShield.AntiBot.Gateway
export const DEFAULT_MOCK_ORGANIZER_PORT = 5001; // MockOrganizer.API direct
export const ORGANIZER_API_PATH = '/api/organizer';

const dynamicSlugCache = new Map<string, string>();

let customOrganizerApiBase: string | null = null;
let activePortOverride: number | null = null;

export const setOrganizerApiBaseUrl = (url: string): void => {
  customOrganizerApiBase = url;
};

export const resetOrganizerPortOverride = (): void => {
  activePortOverride = null;
};

export const getOrganizerPortFromEnv = (): number => {
  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const env = globalObj?.process?.env || win?.__ENV__ || {};
    const portVal = env.EXPO_PUBLIC_ORGANIZER_PORT || env.VITE_ORGANIZER_PORT || env.ORGANIZER_PORT;
    if (portVal && !isNaN(Number(portVal))) {
      return Number(portVal);
    }
  } catch {}
  return DEFAULT_ORGANIZER_PORT;
};

export const getOrganizerPort = (): number => {
  if (activePortOverride) {
    return activePortOverride;
  }
  return getOrganizerPortFromEnv();
};

export const getMockOrganizerPort = (): number => {
  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const env = globalObj?.process?.env || win?.__ENV__ || {};
    const portVal =
      env.EXPO_PUBLIC_MOCK_ORGANIZER_PORT ||
      env.VITE_MOCK_ORGANIZER_PORT ||
      env.MOCK_ORGANIZER_PORT;
    if (portVal && !isNaN(Number(portVal))) {
      return Number(portVal);
    }
  } catch {}
  return DEFAULT_MOCK_ORGANIZER_PORT;
};

export const getOrganizerApiBase = (): string => {
  if (customOrganizerApiBase) {
    const clean = customOrganizerApiBase.replace(/\/$/, '');
    return clean.endsWith(ORGANIZER_API_PATH) ? clean : `${clean}${ORGANIZER_API_PATH}`;
  }

  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const env = globalObj?.process?.env || win?.__ENV__ || {};
    const envUrl =
      env.VITE_ORGANIZER_API_BASE_URL ||
      env.VITE_ORGANIZER_API_URL ||
      env.EXPO_PUBLIC_ORGANIZER_API_BASE_URL ||
      env.EXPO_PUBLIC_ORGANIZER_API_URL;
    if (envUrl) {
      const clean = String(envUrl).replace(/\/$/, '');
      return clean.endsWith(ORGANIZER_API_PATH) ? clean : `${clean}${ORGANIZER_API_PATH}`;
    }

    const coreApiBase = getApiBaseUrl();
    if (coreApiBase) {
      const parsed = new URL(coreApiBase);
      const port = getOrganizerPort();
      return `${parsed.protocol}//${parsed.hostname}:${port}${ORGANIZER_API_PATH}`;
    }
  } catch {}

  const port = getOrganizerPort();
  return `http://localhost:${port}${ORGANIZER_API_PATH}`;
};

async function fetchWithOrganizerFallback(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const base = getOrganizerApiBase();
  const url = `${base}${path}`;

  try {
    return await fetch(url, options);
  } catch (err: any) {
    const primaryPort = getOrganizerPortFromEnv();
    const fallbackPort = getMockOrganizerPort();
    if (base.includes(`:${primaryPort}`) && primaryPort !== fallbackPort) {
      const fallbackBase = base.replace(`:${primaryPort}`, `:${fallbackPort}`);
      console.log(`[organizerStoreApi] Port :${primaryPort} unreachable. Falling back to :${fallbackPort}...`);
      const response = await fetch(`${fallbackBase}${path}`, options);
      activePortOverride = fallbackPort;
      if (customOrganizerApiBase && customOrganizerApiBase.includes(`:${primaryPort}`)) {
        customOrganizerApiBase = customOrganizerApiBase.replace(`:${primaryPort}`, `:${fallbackPort}`);
      }
      return response;
    }
    throw err;
  }
}

export const getMockOrganizerBaseUrl = (): string => {
  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const env = globalObj?.process?.env || win?.__ENV__ || {};
    const envUrl =
      env.VITE_MOCK_ORGANIZER_API_BASE_URL ||
      env.EXPO_PUBLIC_MOCK_ORGANIZER_API_BASE_URL ||
      env.MOCK_ORGANIZER_API_BASE_URL;

    if (envUrl) {
      return String(envUrl)
        .replace(/\/$/, '')
        .replace(/\/api\/organizer$/, '');
    }

    // MockOrganizer is a separate service from the AntiBot gateway. Do not
    // derive this URL from getOrganizerApiBase(), whose default is :5006.
    const coreApiBase = getApiBaseUrl();
    if (coreApiBase) {
      const parsed = new URL(coreApiBase);
      return `${parsed.protocol}//${parsed.hostname}:${getMockOrganizerPort()}`;
    }
  } catch {}

  return `http://localhost:${getMockOrganizerPort()}`;
};

/** Direct HTTP API exposed by MockOrganizer (:5001 by default). */
export const getMockOrganizerApiBase = (): string =>
  `${getMockOrganizerBaseUrl()}${ORGANIZER_API_PATH}`;

export interface OrganizerBackendTier {
  id: string;
  eventId: string;
  tierName: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  createdAt?: string;
}

export interface ClientTelemetry {
  is_webdriver: 0 | 1;
  action_interval_std_dev?: number;
  device_fingerprint: string;
  nonce: string;
  client_timestamp: number;
}

export interface SessionTokenResponse {
  sessionToken: string;
  tierId: string;
  issuedAtUtc: string;
  expiresInSeconds: number;
}

export interface OrganizerCheckoutRequest {
  tierId: string;
  quantity: number;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  telemetry?: ClientTelemetry;
  sessionToken?: string;
  challengeToken?: string;
  challengeProvider?: string;
}

export interface OrganizerCheckoutResponse {
  orderId: string;
  tierId: string;
  eventId: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  remainingAvailable: number;
  tickets: Array<{
    ticketCode: string;
    seatZone?: string;
    ownerEmail: string;
    ownerName: string;
    ownerPhone: string;
    status: string;
  }>;
  antiBot?: {
    decision: string;
    riskScore: number;
    isFailOpen: boolean;
    guardDurationMs: number;
  };
  telemetry?: {
    timeToCheckoutSeconds: number;
    concurrentHoldCount: number;
    burstRate10s: number;
    deviceAccountOverlap: number;
    executionDurationMs: number;
    redisDurationMs: number;
    isSessionValid: boolean;
  };
}

export interface OrganizerGenerateTicketRequest {
  eventId: string;
  seatZone: string;
  tierName: string;
  originalPrice: number;
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string;
  organizerId?: string;
}

export interface AntiBotPolicyConfig {
  allowThreshold: number;
  blockThreshold: number;
  guardTimeoutMs: number;
  challengeMode?: 'turnstile' | 'recaptcha' | 'sequential';
  updatedAtUtc?: string;
  lastUpdatedAtUtc?: string;
  updatedBy?: string;
}

export interface UpdateAntiBotPolicyRequest {
  eventId?: string;
  allowThreshold?: number;
  blockThreshold?: number;
  guardTimeoutMs?: number;
  challengeMode?: string;
  updatedBy?: string;
}

export interface AntiBotAnalyticsSummary {
  totalRequests: number;
  totalAllow: number;
  totalChallenge: number;
  totalBlock: number;
  failOpenCount: number;
  meanLatencyMs: number;
  botRatePercent: number;
  p95LatencyMs: number;
  eventId?: string;
  tierId?: string;

  // Web portal metrics & policy
  currentPolicy?: AntiBotPolicyConfig;
  totalEvaluations?: number;
  averageLatencyMs?: number;
  allowCount?: number;
  allowPercentage?: number;
  challengeCount?: number;
  challengePercentage?: number;
  blockCount?: number;
  blockPercentage?: number;
  recentLogs?: any[];
}

export const organizerStoreApi = {
  createSession: async (tierId: string): Promise<SessionTokenResponse> => {
    return organizerStoreApi.getCheckoutSession(tierId);
  },

  getEventsCatalog: async (): Promise<any[]> => {
    const res = await fetchWithOrganizerFallback('/events', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return res.json();
  },

  getEventTiers: async (eventIdOrSlug: string, eventName?: string): Promise<OrganizerBackendTier[]> => {
    const key = eventIdOrSlug.toLowerCase().trim();

    const cachedSlug = dynamicSlugCache.get(key);
    const targetSlug = cachedSlug || eventIdOrSlug;

    try {
      const directRes = await fetchWithOrganizerFallback(`/events/${encodeURIComponent(targetSlug)}/tiers`, {
        headers: { Accept: 'application/json' },
      });
      if (directRes.ok) {
        return await directRes.json();
      }
    } catch {}

    try {
      const catalog = await organizerStoreApi.getEventsCatalog();
      if (Array.isArray(catalog) && catalog.length > 0) {
        const targetName = (eventName || '').toLowerCase().trim();
        const matched = catalog.find((e: any) => {
          if (!e) return false;
          const extId = String(e.externalEventId || '').toLowerCase();
          const name = String(e.name || '').toLowerCase();
          if (extId === key) return true;
          if (targetName && (name.includes(targetName) || targetName.includes(name))) return true;
          return false;
        }) || catalog[0];

        if (matched?.externalEventId) {
          dynamicSlugCache.set(key, matched.externalEventId);
          const matchedRes = await fetchWithOrganizerFallback(`/events/${encodeURIComponent(matched.externalEventId)}/tiers`, {
            headers: { Accept: 'application/json' },
          });
          if (matchedRes.ok) {
            return await matchedRes.json();
          }
        }
      }
    } catch (err) {
      console.log('[organizerStoreApi] Dynamic catalog resolution error:', err);
    }

    throw new Error(`Ticket tiers not found for event "${eventName || eventIdOrSlug}"`);
  },

  getCheckoutSession: async (tierId: string): Promise<SessionTokenResponse> => {
    const res = await fetchWithOrganizerFallback(`/orders/session?tierId=${encodeURIComponent(tierId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Unable to obtain checkout session for tier ${tierId} (HTTP ${res.status})`);
    }
    return res.json();
  },

  checkout: async (request: OrganizerCheckoutRequest): Promise<OrganizerCheckoutResponse> => {
    const res = await fetchWithOrganizerFallback(`/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      let errMsg = `Organizer checkout failed (HTTP ${res.status})`;
      let errorJson: Record<string, any> | null = null;
      try {
        errorJson = await res.json();
      } catch {}

      if (errorJson) {
        if (res.status === 409 && errorJson.code) {
          errMsg = 'Checkout session expired. Please refresh and try again.';
        } else if (res.status === 403 && (errorJson.challengeRequired || errorJson.decision === 'Challenge')) {
          const challengeErr = new Error('CHALLENGE_REQUIRED');
          Object.assign(challengeErr, {
            challengeRequired: true,
            preferredProvider: errorJson.preferredProvider || 'turnstile',
            riskScore: errorJson.riskScore,
          });
          throw challengeErr;
        } else if (res.status === 429) {
          errMsg = 'Too many requests detected. Please try again shortly.';
        } else if (errorJson.message) {
          if (res.status === 409) {
            errMsg = `Ticket tier is sold out or has insufficient inventory (Remaining: ${errorJson.available ?? 0})`;
          } else if (res.status === 404) {
            errMsg = 'Ticket tier not found in organizer inventory.';
          } else if (res.status === 503) {
            errMsg = 'Organizer service is temporarily busy. Please retry shortly.';
          } else {
            errMsg = errorJson.message;
          }
        } else if (errorJson.errors && typeof errorJson.errors === 'object') {
          const detailMsgs = Object.values(errorJson.errors).flat().join(', ');
          errMsg = detailMsgs || errorJson.title || errMsg;
        } else if (errorJson.title) {
          errMsg = errorJson.title;
        }
      }
      throw new Error(errMsg);
    }

    return res.json();
  },

  getTickets: async (search?: string, status?: string): Promise<MockTicketDto[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const res = await fetchWithOrganizerFallback(`/tickets?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Unable to fetch tickets from organizer (HTTP ${res.status})`);
    }
    return res.json();
  },

  generateTicket: async (request: OrganizerGenerateTicketRequest): Promise<any> => {
    const res = await fetchWithOrganizerFallback(`/tickets/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const msg = errorJson?.message || `HTTP ${res.status}`;
      throw new Error(`Unable to issue ticket in organizer system (${msg})`);
    }
    return res.json();
  },

  getAntiBotPolicy: async (eventId?: string): Promise<AntiBotPolicyConfig> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/policy?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/policy`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Unable to load policy configuration (HTTP ${res.status})`);
    return res.json();
  },

  updateAntiBotPolicy: async (payload: UpdateAntiBotPolicyRequest): Promise<AntiBotPolicyConfig> => {
    const base = getMockOrganizerBaseUrl();
    const res = await fetch(`${base}/api/anti-bot/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Policy update failed (HTTP ${res.status})`);
    }
    return res.json();
  },

  resetAntiBotPolicy: async (eventId?: string): Promise<AntiBotPolicyConfig> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/policy/reset?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/policy/reset`;
    const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Unable to reset policy configuration (HTTP ${res.status})`);
    return res.json();
  },

  getAntiBotAnalytics: async (eventId?: string): Promise<AntiBotAnalyticsSummary> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/analytics?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/analytics`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Unable to load anti-bot analytics (HTTP ${res.status})`);
    return res.json();
  },

  resetAntiBotAnalytics: async (eventId?: string): Promise<void> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/analytics/reset?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/analytics/reset`;
    await fetch(url, { method: 'POST' });
  },
};
