import type { PaginatedList } from '@ticketshield/types';
import { httpClient } from './client';

/** Trạng thái đơn do BE trả dạng chữ. Giá trị lạ vẫn qua được kiểu để hiện nguyên văn. */
export type BuyerOrderStatus =
  | 'Pending'
  | 'Locked'
  | 'Releasing'
  | 'Released'
  | 'Refunded'
  | 'Disputed'
  | 'RefundQueued'
  | 'Expired'
  | 'Cancelled'
  | (string & {});

/** Một vé trong đơn. Đơn chưa giao vé thì `ticketCode` là mã đã che. */
export interface BuyerOrderTicketDto {
  ticketCode: string;
  seatZone?: string | null;
}

/** Một đơn mua vé của người mua, tức một giao dịch ký quỹ (SCRUM-341). */
export interface BuyerOrderDto {
  orderId: string;
  /** `ORD-` cộng mã chuyển khoản. */
  orderCode: string;
  listingId: string;
  bundleId?: string | null;
  isBundle: boolean;
  bundleTotalTickets: number;
  eventId: string;
  eventName: string;
  eventVenue: string;
  eventStartAt: string;
  tierName: string;
  seatZone?: string | null;
  /** Bản cũ: các mã nối bằng dấu phẩy. Dùng `tickets` khi có. */
  ticketCode?: string | null;
  tickets?: BuyerOrderTicketDto[];
  originalTicketPrice: number;
  buyerFee: number;
  totalBuyerPaid: number;
  /** Mã chuyển khoản, cũng là nội dung chuyển khoản VietQR (`TS` + 8 ký tự). */
  paymentReference?: string | null;
  /** Mã tham chiếu SePay, chỉ có sau khi SePay báo tiền về. */
  bankTransactionReference?: string | null;
  status: BuyerOrderStatus;
  /** Câu tiếng Việt của BE. Web không hiện. */
  statusDescription?: string;
  transferredAt?: string | null;
  disputeDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
  isRefunded: boolean;
  isRefundQueued: boolean;
  refundAmount: number;
  refundedAt?: string | null;
  /** Câu tiếng Việt của BE, có mã lý do nội bộ. Web không hiện. */
  refundReason?: string | null;
  disputeId?: string | null;
  disputeStatus?: string | null;
  /** Người mua đã đăng bán lại vé nên bỏ quyền khiếu nại. */
  disputeWaived: boolean;
}

/** Tính trên mọi đơn của người mua, không theo bộ lọc. */
export interface BuyerOrderSummaryDto {
  totalOrders: number;
  totalSpent: number;
  totalRefunded: number;
  inEscrowOrdersCount: number;
}

export interface BuyerOrderHistoryResponse {
  orders: PaginatedList<BuyerOrderDto>;
  summary: BuyerOrderSummaryDto;
}

export interface MyOrdersParams {
  page?: number;
  size?: number;
  status?: BuyerOrderStatus;
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

const buildQuery = (params: MyOrdersParams): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const ordersApi = {
  /**
   * Đơn mua vé của người đang đăng nhập, mới nhất lên đầu, kèm ô tổng.
   * GET /api/v1/orders/my-orders (JWT required)
   */
  getMyOrders: async (params: MyOrdersParams = {}): Promise<BuyerOrderHistoryResponse> => {
    return httpClient<BuyerOrderHistoryResponse>(`/orders/my-orders${buildQuery(params)}`, {
      method: 'GET',
    });
  },
};
