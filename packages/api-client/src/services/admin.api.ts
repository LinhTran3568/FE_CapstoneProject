import type { PaginatedList } from '@ticketshield/types';
import { httpClient } from './client';

/** Dựng query string, bỏ giá trị rỗng và cờ `false` (BE coi như không lọc). */
const buildQuery = (params: object): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export interface ResaleFeeConfigDto {
  buyerFeePercentage: number;
  sellerFeePercentage: number;
  minimumBuyerFee: number;
  minimumSellerFee: number;
  settlementBufferDurationSeconds?: number;
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
  reactivateUser: (userId: string): Promise<AdminUserDto> =>
    httpClient<AdminUserDto>(`/admin/users/${userId}/suspension`, { method: 'DELETE' }),

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

  /**
   * GET /admin/transactions (SCRUM-334): giao dịch ký quỹ kèm sổ giải ngân, phân trang.
   * `summary` là số toàn sàn, không theo bộ lọc.
   */
  getTransactions: async (params: AdminTransactionsParams = {}): Promise<AdminTransactionsResponse> => {
    return await httpClient<AdminTransactionsResponse>(`/admin/transactions${buildQuery(params)}`);
  },

  /**
   * GET /admin/listings (SCRUM-336): tin bán lại và vé trong combo, kèm soát trần giá.
   * Mỗi vé một dòng. Lọc `bundleId` để lấy đủ vé của một combo.
   */
  getListings: async (params: AdminListingsParams = {}): Promise<AdminListingsResponse> => {
    return await httpClient<AdminListingsResponse>(`/admin/listings${buildQuery(params)}`);
  },

  /**
   * GET /admin/analytics/platform-revenue-inventory (SCRUM-338).
   * Khoảng ngày chỉ áp cho doanh thu và bảng sự kiện, kho vé và người dùng luôn tính toàn bộ.
   */
  getPlatformAnalytics: async (params: AdminAnalyticsParams = {}): Promise<AdminPlatformAnalyticsDto> => {
    return await httpClient<AdminPlatformAnalyticsDto>(
      `/admin/analytics/platform-revenue-inventory${buildQuery(params)}`
    );
  },
};

// ── Epic-11: Admin Operations (SCRUM-333) ──
// Trạng thái là union chữ cộng string: giá trị lạ từ BE vẫn qua được kiểu và hiện nguyên văn.

export type AdminEscrowStatus =
  | 'Pending' | 'Locked' | 'Releasing' | 'Released' | 'Refunded'
  | 'Disputed' | 'RefundQueued' | 'Expired' | 'Cancelled' | (string & {});
export type AdminPayoutStatus = 'Pending' | 'Processing' | 'Success' | 'Failed' | (string & {});
export type AdminDisputeStatus = 'Open' | 'UnderReview' | 'Resolved' | 'Rejected' | (string & {});
export type AdminListingStatus =
  | 'Draft' | 'Verified' | 'Transacting' | 'Sold' | 'Cancelled' | 'Expired' | (string & {});
export type AdminVerificationStatus = 'PendingOtp' | 'Verified' | 'Rejected' | (string & {});

export interface AdminTransactionsParams {
  page?: number;
  size?: number;
  status?: AdminEscrowStatus;
  payoutStatus?: AdminPayoutStatus;
  inSettlementBufferOnly?: boolean;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AdminTransactionDto {
  escrowId: string;
  listingId: string;
  bundleId: string | null;
  eventId: string;
  eventName: string;
  originalTicketCode: string;
  newTicketCode: string | null;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string | null;
  originalTicketPrice: number;
  buyerFee: number;
  sellerFee: number;
  totalBuyerPaid: number;
  netSellerPayout: number;
  paymentReference: string | null;
  bankTransactionReference: string | null;
  status: AdminEscrowStatus;
  inSettlementBuffer: boolean;
  transferredAt: string | null;
  unlockAt: string | null;
  disputeDeadline: string | null;
  disputeWaived: boolean;
  disputeWaivedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payoutId: string | null;
  payoutCode: string | null;
  payoutStatus: AdminPayoutStatus | null;
  payoutAmount: number | null;
  recipientBankCode: string | null;
  recipientAccountNumber: string | null;
  recipientAccountName: string | null;
  bankReferenceCode: string | null;
  payoutProcessedAt: string | null;
  payoutErrorMessage: string | null;
  payoutRetryCount: number;
  disputeId: string | null;
  disputeStatus: AdminDisputeStatus | null;
}

/**
 * Ô tổng trang Giao dịch, tính trên đúng các dòng khớp bộ lọc (SCRUM-394).
 * Tên field giữ như cũ, nghĩa theo SCRUM-390: `totalEscrowLockedAmount` là Held in escrow,
 * `totalPayoutCompletedAmount` là tổng lệnh chuyển tiền thành công, `totalDisputedCount` chỉ đếm đơn đang khiếu nại.
 */
export interface AdminTransactionsSummaryDto {
  /** Inflow. Thiếu khi BE chưa lên bản SCRUM-390. */
  totalInflowAmount?: number;
  totalEscrowLockedAmount: number;
  totalLockedCount: number;
  totalPayoutCompletedAmount: number;
  totalRefundedAmount: number;
  totalDisputedCount: number;
}

export interface AdminTransactionsResponse {
  transactions: PaginatedList<AdminTransactionDto>;
  summary: AdminTransactionsSummaryDto;
}

export interface AdminListingsParams {
  page?: number;
  size?: number;
  status?: AdminListingStatus;
  verificationStatus?: AdminVerificationStatus;
  isBundleOnly?: boolean;
  isSingleOnly?: boolean;
  isAtPriceCeilingOnly?: boolean;
  eventId?: string;
  sellerId?: string;
  bundleId?: string;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AdminListingDto {
  listingId: string;
  bundleId: string | null;
  isBundle: boolean;
  isBundleAllOrNothing: boolean;
  bundleTotalTickets: number;
  eventId: string;
  eventName: string;
  tierId: string;
  tierName: string;
  originalTicketCode: string;
  maskedTicketCode: string;
  seatZone: string | null;
  ticketId: string | null;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string | null;
  originalPrice: number;
  resalePrice: number;
  appliedMarkupPercentage: number;
  eventMaxMarkupPercentage: number;
  maxAllowedPrice: number;
  actualMarkupPercentage: number;
  isAtPriceCeiling: boolean;
  isPriceCeilingExceeded: boolean;
  discountAmount: number;
  discountPercentage: number;
  listingStatus: AdminListingStatus;
  verificationStatus: AdminVerificationStatus;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListingsSummaryDto {
  totalListings: number;
  totalSingleTickets: number;
  totalBundles: number;
  totalActiveListings: number;
  totalSoldListings: number;
  totalAtCeilingListings: number;
}

export interface AdminListingsResponse {
  listings: PaginatedList<AdminListingDto>;
  summary: AdminListingsSummaryDto;
}

export interface AdminAnalyticsParams {
  fromDate?: string;
  toDate?: string;
}

export interface PlatformRevenueStatsDto {
  totalNetRevenue: number;
  totalBuyerFees: number;
  totalSellerFees: number;
  totalGmv: number;
  pendingFeesInEscrow: number;
  totalRefundedAmount: number;
  /** Inflow, Payout, Held in escrow (SCRUM-392/393). Thiếu khi BE chưa lên bản SCRUM-390. */
  totalInflow?: number;
  totalPayout?: number;
  totalHeldInEscrow?: number;
}

/** Doanh thu sàn một ngày theo giờ Việt Nam. BE chỉ trả ngày có doanh thu. */
export interface DailyRevenueDto {
  /** `yyyy-MM-dd` */
  date: string;
  netRevenue: number;
  gmv: number;
}

export interface PlatformUserAnalyticsDto {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  dualRoleUsers: number;
  activeUsers: number;
}

export interface TicketInventoryAnalyticsDto {
  totalTicketsInInventory: number;
  validTickets: number;
  lockedForResaleTickets: number;
  transferredTickets: number;
  usedTickets: number;
  cancelledTickets: number;
}

export interface EventTransactionAnalyticsDto {
  eventId: string;
  eventName: string;
  venue: string;
  eventStartAt: string;
  totalListings: number;
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  totalTransactionVolume: number;
  totalPlatformRevenue: number;
}

export interface AdminPlatformAnalyticsDto {
  revenue: PlatformRevenueStatsDto;
  users: PlatformUserAnalyticsDto;
  inventory: TicketInventoryAnalyticsDto;
  eventTransactions: EventTransactionAnalyticsDto[];
  /** Thiếu khi BE chưa lên bản SCRUM-390. */
  dailyRevenue?: DailyRevenueDto[];
}

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

