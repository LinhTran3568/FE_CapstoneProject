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

  /**
   * Lấy danh sách toàn bộ Ban tổ chức đối tác (US-7.5 / BE-CORE-7.5.1 / FE-7.5.3)
   */
  getOrganizers: async (): Promise<AdminOrganizerDto[]> => {
    return await httpClient<AdminOrganizerDto[]>('/admin/organizers');
  },

  /**
   * Lấy thông tin chi tiết một Ban tổ chức đối tác kèm cấu hình kết nối
   */
  getOrganizerDetail: async (id: string): Promise<AdminOrganizerDto> => {
    return await httpClient<AdminOrganizerDto>(`/admin/organizers/${id}`);
  },

  /**
   * Đăng ký đối tác Ban tổ chức mới vào hệ thống
   */
  createOrganizer: async (payload: CreateOrganizerRequest): Promise<AdminOrganizerDto> => {
    return await httpClient<AdminOrganizerDto>('/admin/organizers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cập nhật thông số kết nối gRPC/Webhook của Ban tổ chức đối tác
   */
  updateOrganizer: async (id: string, payload: UpdateOrganizerConnectionRequest): Promise<AdminOrganizerDto> => {
    return await httpClient<AdminOrganizerDto>(`/admin/organizers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Kiểm tra trực tiếp khả năng kết nối gRPC/HTTP tới hệ thống Ban tổ chức (Healthcheck probe)
   */
  testOrganizerConnection: async (id: string): Promise<TestOrganizerConnectionResult> => {
    return await httpClient<TestOrganizerConnectionResult>(`/admin/organizers/${id}/test-connection`, {
      method: 'POST',
    });
  },

  /**
   * Đồng bộ danh mục sự kiện và hạng vé từ Ban tổ chức về sàn (Catalog Ingestion)
   */
  syncOrganizerEvents: async (id: string): Promise<SyncOrganizerEventsResult> => {
    return await httpClient<SyncOrganizerEventsResult>(`/admin/organizers/${id}/sync-events`, {
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

export interface AdminOrganizerEventItemDto {
  id: string;
  name: string;
  artist?: string;
  venue?: string;
  city?: string;
  eventStartAt: string;
  status: string;
  tiersCount: number;
}

export interface AdminOrganizerDto {
  id: string;
  name: string;
  officialEmail: string;
  contactPhone?: string;
  taxCode?: string;
  contactPerson?: string;
  status: string; // 'DRAFT' | 'CONNECTED' | 'CATALOG_SYNCED' | 'ACTIVE' | 'INACTIVE'
  apiBaseUrl?: string;
  grpcEndpoint?: string;
  webhookUrl?: string;
  webhookSecretKey?: string;
  connectionStatus: string;
  eventsCount: number;
  totalEvents?: number;
  lastPingAt?: string;
  lastPingLatencyMs?: number;
  lastCatalogSyncedAt?: string;
  createdAt: string;
  updatedAt?: string;
  events?: AdminOrganizerEventItemDto[];
}

export interface CreateOrganizerRequest {
  name: string;
  officialEmail: string;
  contactPhone?: string;
  taxCode?: string;
  contactPerson?: string;
  apiBaseUrl?: string;
  grpcEndpoint?: string;
  webhookUrl?: string;
  webhookSecretKey?: string;
}

export interface UpdateOrganizerConnectionRequest {
  name: string;
  contactPhone?: string;
  taxCode?: string;
  contactPerson?: string;
  apiBaseUrl?: string;
  grpcEndpoint?: string;
  webhookUrl?: string;
  webhookSecretKey?: string;
  status: string;
  connectionStatus: string;
}

export interface TestOrganizerConnectionResult {
  organizerId: string;
  connectionStatus: string;
  status?: string;
  latencyMs: number;
  targetEndpoint: string;
  testedEndpoint?: string;
  message: string;
}

export interface SyncOrganizerEventsResult {
  organizerId: string;
  eventsCount: number;
  tiersCount: number;
  message: string;
  syncedAt: string;
}

