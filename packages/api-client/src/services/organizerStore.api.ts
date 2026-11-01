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
  // 1. Nếu có cấu hình tùy chỉnh qua setOrganizerApiBaseUrl (do apiResolver truyền vào)
  if (customOrganizerApiBase) {
    const clean = customOrganizerApiBase.replace(/\/$/, '');
    return clean.endsWith(ORGANIZER_API_PATH) ? clean : `${clean}${ORGANIZER_API_PATH}`;
  }

  // 2. Kiểm tra biến môi trường
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

    // 3. FE-MOB-9.1.1: Tự động kế thừa Host IP từ Core API Gateway
    const coreApiBase = getApiBaseUrl();
    if (coreApiBase) {
      const parsed = new URL(coreApiBase);
      const port = getOrganizerPort();
      return `${parsed.protocol}//${parsed.hostname}:${port}${ORGANIZER_API_PATH}`;
    }
  } catch {}

  // 4. Fallback mặc định
  const port = getOrganizerPort();
  return `http://localhost:${port}${ORGANIZER_API_PATH}`;
};

/**
 * Robust fetch wrapper for Organizer API:
 * Tự động gọi endpoint qua URL chính (:5006 AntiBot Gateway hoặc dynamic host LAN).
 * Nếu cổng chính bị từ chối kết nối (chưa bật AntiBot Gateway), tự động fallback sang cổng trực tiếp (:5001 MockOrganizer).
 */
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
      // Dùng console.log thay cho console.warn để không trigger khung LogBox vàng trên ứng dụng React Native Mobile
      console.log(`[organizerStoreApi] Cổng :${primaryPort} không phản hồi. Tự động chuyển fallback sang :${fallbackPort}...`);
      const response = await fetch(`${fallbackBase}${path}`, options);
      // Ghi nhớ cổng hoạt động thành công để các request tiếp theo trong session gọi thẳng vào cổng fallback
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
  const orgBase = getOrganizerApiBase();
  return orgBase.replace(/\/api\/organizer$/, '');
};

export interface OrganizerBackendTier {
  id: string;
  eventId: string;
  tierName: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  createdAt?: string;
}

/**
 * Tín hiệu do Client Telemetry SDK đo trong trình duyệt (Spec 08 + SCRUM-247).
 * Tên trường giữ snake_case đúng hợp đồng với MockOrganizer.API.
 */
export interface ClientTelemetry {
  is_webdriver: 0 | 1;
  /** Bỏ trường khi có ít hơn 3 lần bấm. */
  action_interval_std_dev?: number;
  device_fingerprint: string;
  nonce: string;
  /** Epoch ms đã chỉnh theo giờ server. */
  client_timestamp: number;
}

/** Session token cấp khi mở trang chọn vé, dùng đo time_to_checkout (BE-PIPE-8.2.1). */
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
  updatedAtUtc?: string;
  updatedBy?: string;
}

export interface UpdateAntiBotPolicyRequest {
  eventId?: string;
  allowThreshold?: number;
  blockThreshold?: number;
  guardTimeoutMs?: number;
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
}

export const organizerStoreApi = {
  /**
   * Cấp phát session token chứa timestamp server phục vụ đo time_to_checkout (BE-PIPE-8.2.1)
   */
  createSession: async (tierId: string): Promise<SessionTokenResponse> => {
    return organizerStoreApi.getCheckoutSession(tierId);
  },

  /**
   * Lấy danh mục sự kiện từ Ban Tổ Chức phục vụ Catalog Ingestion và nhận diện động
   */
  getEventsCatalog: async (): Promise<any[]> => {
    const res = await fetchWithOrganizerFallback('/events', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return res.json();
  },

  /**
   * Lấy danh sách các hạng vé trực tiếp từ Ban Tổ Chức (BE-MOCK-7.1.1)
   * Tự động nhận diện slug hoặc tra cứu động qua /api/organizer/events nếu dùng GUID của Gateway.
   */
  getEventTiers: async (eventIdOrSlug: string, eventName?: string): Promise<OrganizerBackendTier[]> => {
    const key = eventIdOrSlug.toLowerCase().trim();

    // 1. Kiểm tra cache đã phân giải động trước đó
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

    // 2. Nếu không tìm thấy (404), tự động truy vấn danh mục sự kiện của BTC để lấy slug chuẩn động
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

    throw new Error(`Không tìm thấy hạng vé cho sự kiện "${eventName || eventIdOrSlug}"`);
  },

  /**
   * Lấy session token cho một hạng vé khi mở trang chọn vé (BE-PIPE-8.2.1)
   */
  getCheckoutSession: async (tierId: string): Promise<SessionTokenResponse> => {
    const res = await fetchWithOrganizerFallback(`/orders/session?tierId=${encodeURIComponent(tierId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Không lấy được phiên đặt vé cho hạng vé ${tierId} (HTTP ${res.status})`);
    }
    return res.json();
  },

  /**
   * Gọi checkout trừ kho nguyên tử từ Ban Tổ Chức (BE-MOCK-7.1.2)
   */
  checkout: async (request: OrganizerCheckoutRequest): Promise<OrganizerCheckoutResponse> => {
    const res = await fetchWithOrganizerFallback(`/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      let errMsg = `Lỗi đặt vé từ Ban Tổ Chức (HTTP ${res.status})`;
      let errorJson: Record<string, any> | null = null;
      try {
        errorJson = await res.json();
      } catch {
        // Non-JSON response
      }

      if (errorJson) {
        // Anti-Bot (US-8.1 / US-8.4): 409 có `code` là bị chặn phát lại, 403 cần xác minh, 429 bị chặn
        if (res.status === 409 && errorJson.code) {
          errMsg = 'Phiên đặt vé đã hết hiệu lực. Vui lòng tải lại trang rồi đặt vé lại.';
        } else if (res.status === 403 && (errorJson.challengeRequired || errorJson.decision === 'Challenge')) {
          const challengeErr = new Error('CHALLENGE_REQUIRED');
          Object.assign(challengeErr, {
            challengeRequired: true,
            preferredProvider: errorJson.preferredProvider || 'turnstile',
            riskScore: errorJson.riskScore,
          });
          throw challengeErr;
        } else if (res.status === 429) {
          errMsg = 'Giao dịch đang bị tạm chặn vì có thao tác bất thường. Vui lòng thử lại sau.';
        } else if (errorJson.message) {
          if (res.status === 409) {
            errMsg = `Hạng vé đã hết hoặc không đủ tồn kho (Còn lại: ${errorJson.available ?? 0} vé)`;
          } else if (res.status === 404) {
            errMsg = 'Hạng vé không tồn tại trên hệ thống Ban Tổ Chức';
          } else if (res.status === 503) {
            errMsg = 'Máy chủ Ban Tổ Chức đang bận, vui lòng thử lại sau giây lát';
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

  /**
   * Lấy danh sách toàn bộ vé có sẵn từ hệ thống Ban Tổ Chức (/api/organizer/tickets)
   */
  getTickets: async (search?: string, status?: string): Promise<MockTicketDto[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const res = await fetchWithOrganizerFallback(`/tickets?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Không thể lấy danh sách vé từ Ban Tổ Chức (HTTP ${res.status})`);
    }
    return res.json();
  },

  /**
   * Tạo vé chính thức trong cơ sở dữ liệu của Ban Tổ Chức
   */
  generateTicket: async (request: OrganizerGenerateTicketRequest): Promise<any> => {
    const res = await fetchWithOrganizerFallback(`/tickets/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      const msg = errorJson?.message || `HTTP ${res.status}`;
      throw new Error(`Không thể phát hành vé vào hệ thống Ban Tổ Chức (${msg})`);
    }
    return res.json();
  },

  /**
   * Lấy cấu hình ngưỡng phân luồng quyết định (US-8.4, SCRUM-260)
   */
  getAntiBotPolicy: async (eventId?: string): Promise<AntiBotPolicyConfig> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/policy?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/policy`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Không thể tải cấu hình ngưỡng (HTTP ${res.status})`);
    return res.json();
  },

  /**
   * Cập nhật ngưỡng động không cần restart server (US-8.4, SCRUM-260)
   */
  updateAntiBotPolicy: async (payload: UpdateAntiBotPolicyRequest): Promise<AntiBotPolicyConfig> => {
    const base = getMockOrganizerBaseUrl();
    const res = await fetch(`${base}/api/anti-bot/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || `Cập nhật ngưỡng thất bại (HTTP ${res.status})`);
    }
    return res.json();
  },

  /**
   * Đặt lại ngưỡng về mặc định ban đầu
   */
  resetAntiBotPolicy: async (eventId?: string): Promise<AntiBotPolicyConfig> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/policy/reset?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/policy/reset`;
    const res = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Không thể đặt lại cấu hình ngưỡng (HTTP ${res.status})`);
    return res.json();
  },

  /**
   * Lấy báo cáo phân tích lưu lượng an ninh (US-8.4, SCRUM-259)
   */
  getAntiBotAnalytics: async (eventId?: string): Promise<AntiBotAnalyticsSummary> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/analytics?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/analytics`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Không thể tải số liệu phân tích lưu lượng (HTTP ${res.status})`);
    return res.json();
  },

  /**
   * Đặt lại số liệu thống kê phân tích
   */
  resetAntiBotAnalytics: async (eventId?: string): Promise<void> => {
    const base = getMockOrganizerBaseUrl();
    const url = eventId ? `${base}/api/anti-bot/analytics/reset?eventId=${encodeURIComponent(eventId)}` : `${base}/api/anti-bot/analytics/reset`;
    await fetch(url, { method: 'POST' });
  },
};
