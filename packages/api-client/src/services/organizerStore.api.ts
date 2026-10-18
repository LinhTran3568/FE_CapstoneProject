import type { MockTicketDto } from '@ticketshield/types';

export const getOrganizerApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl =
      import.meta.env.VITE_ORGANIZER_API_BASE_URL ||
      import.meta.env.VITE_ORGANIZER_API_URL ||
      (window as { __ENV__?: { VITE_ORGANIZER_API_BASE_URL?: string } }).__ENV__
        ?.VITE_ORGANIZER_API_BASE_URL;
    if (envUrl) {
      const clean = String(envUrl).replace(/\/$/, '');
      return clean.endsWith('/api/organizer') ? clean : `${clean}/api/organizer`;
    }
  }
  return 'http://localhost:5001/api/organizer';
};

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
  buyerName?: string;
  buyerPhone?: string;
  sessionToken?: string;
  deviceFingerprint?: string;
  telemetry?: ClientTelemetry;
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
  tickets?: Array<{
    ticketCode: string;
    seatZone: string;
    ownerEmail: string;
    ownerName?: string;
    ownerPhone?: string;
    status: string;
  }>;
  telemetry?: {
    timeToCheckoutSeconds?: number;
    concurrentHoldCount?: number;
    executionDurationMs?: number;
    isSessionValid?: boolean;
  };
}

export interface AntiBotPolicyConfig {
  allowThreshold: number;
  blockThreshold: number;
  challengeMode?: 'recaptcha' | 'turnstile' | 'sequential';
  lastUpdatedAtUtc: string;
  updatedBy: string;
}

export interface UpdateAntiBotPolicyRequest {
  allowThreshold: number;
  blockThreshold: number;
  challengeMode?: 'recaptcha' | 'turnstile' | 'sequential';
  eventId?: string;
  updatedBy?: string;
}

export interface AntiBotEvaluationLog {
  requestId: string;
  timestampUtc: string;
  buyerEmail: string;
  eventId?: string;
  decision: 'Allow' | 'Challenge' | 'Block';
  riskScore: number;
  latencyMs: number;
  isFailOpen: boolean;
  reason: string;
}

export interface AntiBotAnalyticsSummary {
  totalEvaluations: number;
  allowCount: number;
  challengeCount: number;
  blockCount: number;
  allowPercentage: number;
  challengePercentage: number;
  blockPercentage: number;
  averageLatencyMs: number;
  currentPolicy: AntiBotPolicyConfig;
  recentLogs: AntiBotEvaluationLog[];
}

export interface OrganizerGenerateTicketRequest {
  ticketCode?: string;
  eventName?: string;
  seatZone?: string;
  originalPrice?: number;
  ownerEmail?: string;
  ownerName?: string;
  ownerPhone?: string;
  organizerId?: string;
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
   * Lấy danh sách các hạng vé trực tiếp từ Ban Tổ Chức (BE-MOCK-7.1.1)
   */
  getEventTiers: async (eventId: string): Promise<OrganizerBackendTier[]> => {
    const base = getOrganizerApiBase();
    const res = await fetch(`${base}/events/${encodeURIComponent(eventId)}/tiers`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Không tìm thấy hạng vé cho sự kiện ${eventId} (HTTP ${res.status})`);
    }
    return res.json();
  },

  /**
   * Lấy session token cho một hạng vé khi mở trang chọn vé (BE-PIPE-8.2.1)
   */
  getCheckoutSession: async (tierId: string): Promise<SessionTokenResponse> => {
    const base = getOrganizerApiBase();
    const res = await fetch(`${base}/orders/session?tierId=${encodeURIComponent(tierId)}`, {
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
    const base = getOrganizerApiBase();
    const res = await fetch(`${base}/orders/checkout`, {
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
    const base = getOrganizerApiBase();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const res = await fetch(`${base}/tickets?${params.toString()}`, {
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
    const base = getOrganizerApiBase();
    const res = await fetch(`${base}/tickets/generate`, {
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
