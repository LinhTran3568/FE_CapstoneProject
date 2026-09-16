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
  requestVerificationOtp: async (ticketCode: string): Promise<VerificationResult> => {
    return await httpClient<VerificationResult>('/ticket-verifications', {
      method: 'POST',
      headers: {
        'Idempotency-Key': generateIdempotencyKey(),
      },
      body: JSON.stringify({ ticketCode }),
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
   * Niêm yết vé lên Sàn thị trường bán lại (Marketplace)
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
