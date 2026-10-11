import { httpClient } from './client';

export interface ResaleFeeConfigDto {
  buyerFeePercentage: number;
  sellerFeePercentage: number;
  minimumBuyerFee: number;
  minimumSellerFee: number;
}

export interface UpdateFeeSettingsRequest {
  buyerFeePercentage: number;
  sellerFeePercentage: number;
  minimumBuyerFee: number;
  minimumSellerFee: number;
}

export interface EscrowBufferConfigDto {
  bufferSeconds: number;
  cutoffSeconds: number;
}

export interface UpdateEscrowBufferRequest {
  bufferSeconds: number;
  cutoffSeconds: number;
}

export interface EventResaleMarkupDto {
  eventId: string;
  eventName: string;
  maxResaleMarkupPercentage: number;
  venue?: string;
  category?: string;
  eventStartAt?: string;
}

export interface UpdateEventResaleMarkupRequest {
  maxResaleMarkupPercentage: number;
}

export const adminApi = {
  /**
   * Lấy cấu hình biểu phí chuyển nhượng động hiện tại của hệ thống
   */
  getFeeSettings: async (): Promise<ResaleFeeConfigDto> => {
    return await httpClient<ResaleFeeConfigDto>('/admin/fee-settings');
  },

  /**
   * Cập nhật cấu hình biểu phí chuyển nhượng và hủy cache
   */
  updateFeeSettings: async (payload: UpdateFeeSettingsRequest): Promise<string> => {
    return await httpClient<string>('/admin/fee-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Lấy cấu hình thời gian đệm ký quỹ an toàn Escrow (Buffer & Cutoff)
   */
  getEscrowBuffer: async (): Promise<EscrowBufferConfigDto> => {
    return await httpClient<EscrowBufferConfigDto>('/admin/escrow-buffer');
  },

  /**
   * Cập nhật thời gian đệm ký quỹ an toàn
   */
  updateEscrowBuffer: async (payload: UpdateEscrowBufferRequest): Promise<EscrowBufferConfigDto> => {
    return await httpClient<EscrowBufferConfigDto>('/admin/escrow-buffer', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Lấy danh sách toàn bộ sự kiện và trần giá bán lại tối đa
   */
  getAllEventMarkups: async (): Promise<EventResaleMarkupDto[]> => {
    return await httpClient<EventResaleMarkupDto[]>('/admin/events');
  },

  /**
   * Lấy trần giá bán lại của một sự kiện cụ thể
   */
  getEventMarkup: async (eventId: string): Promise<EventResaleMarkupDto> => {
    return await httpClient<EventResaleMarkupDto>(`/admin/events/${eventId}/resale-markup`);
  },

  /**
   * Cập nhật trần giá bán lại (MaxResaleMarkupPercentage) cho một sự kiện
   */
  updateEventMarkup: async (eventId: string, payload: UpdateEventResaleMarkupRequest): Promise<EventResaleMarkupDto> => {
    return await httpClient<EventResaleMarkupDto>(`/admin/events/${eventId}/resale-markup`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Lấy danh sách toàn bộ tài khoản người dùng từ Identity Service (FE-6.5.4)
   */
  getUsers: async (): Promise<AdminUserDto[]> => {
    return await httpClient<AdminUserDto[]>('/admin/users');
  },

  /**
   * Khóa vĩnh viễn tài khoản người dùng vi phạm (SCRUM-220 / FE-6.5.4)
   */
  suspendUser: async (userId: string): Promise<AdminUserDto> => {
    return await httpClient<AdminUserDto>(`/admin/users/${userId}/suspension`, {
      method: 'POST',
    });
  },
};

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  trustScore?: number;
  bankCode?: string;
  bankAccountNumber?: string;
  accountHolderName?: string;
  createdAt?: string;
  isKycVerified?: boolean;
}

