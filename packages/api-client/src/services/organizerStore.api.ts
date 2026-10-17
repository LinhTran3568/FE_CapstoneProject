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

export interface OrganizerBackendTier {
  id: string;
  eventId: string;
  tierName: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  createdAt?: string;
}

export interface OrganizerCheckoutRequest {
  tierId: string;
  quantity: number;
  buyerEmail: string;
  buyerName?: string;
  buyerPhone?: string;
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
  tickets?: MockTicketDto[];
  telemetry?: {
    timeToCheckoutSeconds?: number;
    concurrentHoldCount?: number;
    executionDurationMs?: number;
    isSessionValid?: boolean;
  };
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
      try {
        const errorJson = await res.json();
        if (errorJson.message) {
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
      } catch {
        // Keep default error message
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
};
