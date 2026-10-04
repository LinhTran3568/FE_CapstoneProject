import { httpClient, API_CONFIG, TOKEN_STORAGE_KEY } from './client';
import type { SellerListingDto, CancelResaleListingResponse } from '@ticketshield/types';

export type { SellerListingDto, CancelResaleListingResponse };

export interface VerificationResult {
  verificationId: string;
  status: string;
  operationId?: string;
  expiresAt?: string;
  resendAfter?: string;
  deliveryState?: string;
  originalPrice?: number;
  listingId?: string;
  privateAccessToken?: string;
  /** Event markup % snapshotted for this verification (0–100). */
  markupPercent?: number;
  /** Integer VND ceiling: Truncate(originalPrice * (1 + markupPercent/100)). */
  priceCeiling?: number;
}

/** Một vé thật trong gói vé (combo). Mỗi item mang verificationId của chính vé đó. */
export interface BulkPublishItem {
  verificationId: string;
  /** Giá bán lại của riêng vé này, không phải tổng tiền cả gói. */
  resalePrice: number;
  isPrivate: boolean;
}

export interface BulkPublishItemResult {
  listingId: string;
  verificationId: string;
  status: string;
}

export interface BulkPublishResult {
  bundleId: string;
  allOrNothing: boolean;
  totalListings: number;
  listings: BulkPublishItemResult[];
}

const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
};

export const resaleApi = {
  /**
   * Khởi tạo phiên xác thực vé chính chủ & yêu cầu Nhà tổ chức gửi OTP qua gRPC
   */
  requestVerificationOtp: async (ticketCode: string, organizerId?: string): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>('/ticket-verifications', {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
      body: JSON.stringify({ ticketCode, organizerId }),
    });
  },

  /**
   * Gửi lại mã OTP xác thực vé
   */
  resendVerificationOtp: async (verificationId: string): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>(`/ticket-verifications/${verificationId}/resend`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
    });
  },

  /**
   * Xác nhận mã OTP và thực hiện Khóa vé (Lock) bên Nhà tổ chức
   */
  confirmVerificationOtp: async (verificationId: string, otp: string): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>(`/ticket-verifications/${verificationId}/confirm`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
      body: JSON.stringify({ otp }),
    });
  },

  /**
   * Tra cứu thông tin chi tiết phiên xác thực vé
   */
  getVerificationStatus: async (verificationId: string): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>(`/ticket-verifications/${verificationId}`, {
      method: 'GET',
    });
  },

  /**
   * Hủy phiên xác thực vé dở dang và giải phóng khóa vé tại Ban Tổ Chức (Release Lock)
   */
  closeVerification: async (verificationId: string): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>(`/ticket-verifications/${verificationId}/close`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
    });
  },

  /**
   * Gửi yêu cầu đóng phiên qua beacon/keepalive khi người dùng đóng tab hoặc thoát trang
   */
  closeVerificationBeacon: (verificationId: string): void => {
    if (typeof window === 'undefined' || !verificationId) return;
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const url = `${API_CONFIG.baseURL}/ticket-verifications/${verificationId}/close`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': generateIdempotencyKey(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        keepalive: true,
      }).catch(() => {});
    } catch (e) {
      console.warn('Beacon close failed', e);
    }
  },

  /**
   * Niêm yết MỘT vé lên Sàn thị trường bán lại (Marketplace).
   * Vé phải đã qua OTP + khóa tại BTC. Không nhận tham số bundle:
   * gói vé phải dùng `bulkPublishListing` để mỗi vé mang verificationId riêng.
   */
  publishListing: async (
    verificationId: string,
    resalePrice: number,
    isPrivate: boolean = false
  ): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>('/resale-listings/publish', {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
      body: JSON.stringify({
        verificationId,
        resalePrice,
        isPrivate,
      }),
    });
  },

  /**
   * Niêm yết gói vé (combo) 2–3 vé lên Marketplace.
   * Mỗi item là một vé thật đã có OTP riêng; BE tạo đồng thời N listing trong
   * một transaction, all-or-nothing: chỉ cần một vé lỗi là toàn gói bị rollback.
   */
  bulkPublishListing: async (
    items: BulkPublishItem[],
    allOrNothing: boolean = true
  ): Promise<BulkPublishResult> => {
    return await httpClient<BulkPublishResult>('/resale-listings/bulk', {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
      body: JSON.stringify({ items, allOrNothing }),
    });
  },

  /**
   * Lấy danh sách toàn bộ vé đang đăng rao bán của người bán (Seller)
   */
  getMyListings: async (status?: string): Promise<SellerListingDto[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return await httpClient<SellerListingDto[]>(`/resale-listings/my-listings${query}`, {
      method: 'GET',
    });
  },

  /**
   * Hủy tin đăng bán vé và yêu cầu mở khóa vé (Release Lock)
   */
  cancelListing: async (listingId: string): Promise<CancelResaleListingResponse> => {
    return await httpClient<CancelResaleListingResponse>(`/resale-listings/${listingId}/cancel`, {
      method: 'POST',
    });
  },
};
