// Logic tab Orders của người mua (SCRUM-342). Hàm thuần, test bằng npm run test:orders.
// Nhãn ở đây dành cho người mua, cố ý khác nhãn tiền của người bán và Admin (utils/moneyStatus.ts trên nhánh Admin):
// đơn xong ghi `Completed`, không ghi `Paid out`.
import type {
  BuyerOrderDto,
  BuyerOrderStatus,
  BuyerOrderTicketDto,
  MyOrdersParams,
} from '@ticketshield/api-client';
import { formatEventDateTime, formatShortDate, formatVND } from './formatters';

export const BUYER_ORDER_STATUS_LABEL: Record<string, string> = {
  Pending: 'Awaiting payment',
  Locked: 'Held in escrow',
  // Với người mua, khoá tiền đã xong là đơn đã xong. Giải ngân cho người bán không phải việc của họ.
  Releasing: 'Completed',
  Released: 'Completed',
  Disputed: 'In dispute',
  RefundQueued: 'Refunding',
  Refunded: 'Refunded',
  Expired: 'Expired',
  Cancelled: 'Cancelled',
};

/** Giá trị lạ hiện nguyên văn, không rơi về một nhãn mặc định nào. */
export const orderStatusLabel = (status?: string | null): string => {
  if (!status) return '—';
  return BUYER_ORDER_STATUS_LABEL[status] ?? status;
};

export type OrderTone = 'amber' | 'emerald' | 'rose' | 'indigo' | 'zinc';

const STATUS_TONE: Record<string, OrderTone> = {
  Pending: 'amber',
  Locked: 'amber',
  Releasing: 'emerald',
  Released: 'emerald',
  Disputed: 'rose',
  RefundQueued: 'indigo',
  Refunded: 'indigo',
};

export const orderStatusTone = (status?: string | null): OrderTone =>
  (status && STATUS_TONE[status]) || 'zinc';

const UNPAID = new Set(['Pending', 'Expired', 'Cancelled']);

/** Đơn chưa từng trả tiền: số tiền trên đơn chỉ là số phải trả. */
export const isUnpaidOrder = (status?: string | null): boolean => !!status && UNPAID.has(status);

/** Vé đã chuyển cho người mua. Chưa chuyển thì mã vé BE trả là mã đã che. */
export const isTicketIssued = (order: Pick<BuyerOrderDto, 'transferredAt'>): boolean => !!order.transferredAt;

export interface OrderTicket {
  ticketCode: string;
  seatZone: string | null;
}

/**
 * Từng vé trong đơn. Ưu tiên `tickets` của BE. BE cũ chỉ có `ticketCode` nối dấu phẩy:
 * khi đó chỉ gán khu ghế nếu đơn có đúng 1 vé, để không gán nhầm ghế cho vé trong combo.
 */
export const orderTickets = (
  order: Pick<BuyerOrderDto, 'tickets' | 'ticketCode' | 'seatZone'>
): OrderTicket[] => {
  if (order.tickets && order.tickets.length > 0) {
    return order.tickets.map((t: BuyerOrderTicketDto) => ({ ticketCode: t.ticketCode, seatZone: t.seatZone ?? null }));
  }
  const codes = (order.ticketCode ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return codes.map((ticketCode) => ({
    ticketCode,
    seatZone: codes.length === 1 ? order.seatZone ?? null : null,
  }));
};

/** Chữ giống tab My Tickets: `VIP · Combo (4 tickets)`. */
export const orderTierLabel = (order: Pick<BuyerOrderDto, 'tierName' | 'bundleTotalTickets'>): string => {
  const tier = order.tierName || '—';
  return order.bundleTotalTickets >= 2 ? `${tier} · Combo (${order.bundleTotalTickets} tickets)` : tier;
};

export interface RefundLine {
  state: 'done' | 'queued';
  amount: number;
  at: string | null;
  text: string;
}

const refundAmountOf = (order: Pick<BuyerOrderDto, 'refundAmount' | 'totalBuyerPaid'>) =>
  order.refundAmount > 0 ? order.refundAmount : order.totalBuyerPaid;

/** Dòng hoàn tiền trên thẻ và trong khung chi tiết. `null` khi đơn không hoàn. */
export const refundLine = (
  order: Pick<BuyerOrderDto, 'status' | 'refundAmount' | 'totalBuyerPaid' | 'refundedAt'>
): RefundLine | null => {
  const amount = refundAmountOf(order);
  if (order.status === 'Refunded') {
    const at = order.refundedAt ?? null;
    // refundedAt của BE là updatedAt của đơn, nên chỉ ghi ngày.
    return { state: 'done', amount, at, text: `Refunded ${formatVND(amount)}${at ? ` on ${formatShortDate(at)}` : ''}` };
  }
  if (order.status === 'RefundQueued') {
    return { state: 'queued', amount, at: null, text: `Refund of ${formatVND(amount)} queued` };
  }
  return null;
};

export type RefundSource = 'dispute' | 'transfer_failed' | 'platform';

export const REFUND_SOURCE_TEXT: Record<RefundSource, string> = {
  dispute: 'Refunded because your dispute was accepted.',
  transfer_failed: 'The ticket could not be transferred to you, so the payment goes back to you.',
  platform: 'Refunded by TicketShield.',
};

/** Vì sao đơn được hoàn. Đọc từ dữ liệu, không đọc câu `refundReason` tiếng Việt của BE. */
export const refundSource = (
  order: Pick<BuyerOrderDto, 'status' | 'disputeId' | 'transferredAt'>
): RefundSource | null => {
  if (order.status !== 'Refunded' && order.status !== 'RefundQueued') return null;
  if (order.disputeId) return 'dispute';
  if (order.status === 'RefundQueued' && !order.transferredAt) return 'transfer_failed';
  return 'platform';
};

export type TimelineState = 'done' | 'current' | 'upcoming';

export interface TimelineStep {
  key: 'placed' | 'paid' | 'dispute' | 'final';
  label: string;
  detail?: string;
  state: TimelineState;
  at: string | null;
}

type TimelineOrder = Pick<
  BuyerOrderDto,
  'status' | 'createdAt' | 'updatedAt' | 'transferredAt' | 'disputeDeadline' | 'disputeId' | 'disputeWaived' | 'refundedAt'
>;

const disputeStep = (order: TimelineOrder, now: Date): TimelineStep => {
  if (order.status === 'Pending') {
    return { key: 'dispute', label: 'Dispute window', state: 'upcoming', at: null };
  }
  if (order.disputeWaived) {
    return {
      key: 'dispute',
      label: 'Dispute right waived',
      detail: 'You resold this ticket, so it can no longer be disputed.',
      state: 'done',
      at: null,
    };
  }
  if (order.disputeId) {
    return { key: 'dispute', label: 'Dispute opened', state: 'done', at: null };
  }
  const deadline = order.disputeDeadline ?? null;
  if (deadline) {
    const open = order.status === 'Locked' && new Date(deadline).getTime() > now.getTime();
    return open
      ? { key: 'dispute', label: 'Dispute window open', detail: `Until ${formatEventDateTime(deadline)}`, state: 'current', at: deadline }
      : { key: 'dispute', label: 'Dispute window closed', state: 'done', at: deadline };
  }
  return order.status === 'Locked'
    ? { key: 'dispute', label: 'Dispute window', state: 'upcoming', at: null }
    : { key: 'dispute', label: 'Dispute window closed', state: 'done', at: null };
};

const finalStep = (order: TimelineOrder): TimelineStep => {
  switch (order.status) {
    case 'Released':
      return { key: 'final', label: 'Completed', state: 'done', at: order.updatedAt ?? null };
    case 'Releasing':
      return { key: 'final', label: 'Completed', state: 'done', at: null };
    case 'Refunded':
      return { key: 'final', label: 'Refunded', state: 'done', at: order.refundedAt ?? null };
    case 'RefundQueued':
      return { key: 'final', label: 'Refund queued', state: 'current', at: null };
    case 'Disputed':
      return { key: 'final', label: 'Waiting for the dispute result', state: 'current', at: null };
    case 'Expired':
    case 'Cancelled':
      return { key: 'final', label: order.status, state: 'done', at: order.updatedAt ?? null };
    case 'Locked':
    case 'Pending':
      return { key: 'final', label: 'Completed', state: 'upcoming', at: null };
    default:
      return { key: 'final', label: orderStatusLabel(order.status), state: 'current', at: null };
  }
};

/**
 * Các bước của đơn: đặt đơn, trả tiền và nhận vé, hạn khiếu nại, kết thúc.
 * Đơn hết hạn hoặc bị huỷ trước khi trả tiền chỉ có bước đặt đơn và bước kết thúc.
 */
export const orderTimeline = (order: TimelineOrder, now: Date): TimelineStep[] => {
  const steps: TimelineStep[] = [{ key: 'placed', label: 'Order placed', state: 'done', at: order.createdAt }];
  const transferred = !!order.transferredAt;

  if (!transferred && (order.status === 'Expired' || order.status === 'Cancelled')) {
    return [...steps, finalStep(order)];
  }

  if (transferred) {
    steps.push({ key: 'paid', label: 'Paid · ticket transferred', state: 'done', at: order.transferredAt ?? null });
  } else if (order.status === 'Pending') {
    steps.push({ key: 'paid', label: 'Waiting for payment', state: 'current', at: null });
  } else if (order.status === 'RefundQueued' || order.status === 'Refunded') {
    // Đã trả tiền nhưng chuyển vé lỗi: không có hạn khiếu nại vì vé chưa từng tới tay người mua.
    steps.push({ key: 'paid', label: 'Paid · ticket not transferred', state: 'done', at: null });
    return [...steps, finalStep(order)];
  } else {
    steps.push({ key: 'paid', label: 'Paid · ticket transferred', state: 'done', at: null });
  }

  return [...steps, disputeStep(order, now), finalStep(order)];
};

/** BE tìm trong mã chuyển khoản, không tìm trong mã đơn, nên bỏ tiền tố `ORD-`. */
export const normalizeOrderKeyword = (value: string): string =>
  value.trim().replace(/^ord-/i, '').trim();

export type OrderFilter = 'all' | 'escrow' | 'completed' | 'dispute' | 'refunded';

/** BE chỉ nhận một `status`. `Completed` lọc theo `Released`; đơn `Releasing` chỉ thoáng qua và vẫn có ở `All`. */
export const ORDER_FILTERS: Array<{ value: OrderFilter; label: string; status?: BuyerOrderStatus }> = [
  { value: 'all', label: 'All' },
  { value: 'escrow', label: 'Held in escrow', status: 'Locked' },
  { value: 'completed', label: 'Completed', status: 'Released' },
  { value: 'dispute', label: 'In dispute', status: 'Disputed' },
  { value: 'refunded', label: 'Refunded', status: 'Refunded' },
];

export const ORDERS_PAGE_SIZE = 10;

export interface OrderListState {
  page: number;
  keyword: string;
  filter: OrderFilter;
}

export const toOrderParams = (state: OrderListState): MyOrdersParams => {
  const params: MyOrdersParams = { page: state.page, size: ORDERS_PAGE_SIZE };
  const status = ORDER_FILTERS.find((f) => f.value === state.filter)?.status;
  if (status) params.status = status;
  const keyword = normalizeOrderKeyword(state.keyword);
  if (keyword) params.keyword = keyword;
  return params;
};

export type ProfileTab = 'account' | 'tickets' | 'listings' | 'orders';

const PROFILE_TABS: ProfileTab[] = ['tickets', 'listings', 'orders'];

/** Tab của trang Tài khoản trên URL (`?tab=`). Giá trị lạ về `account`. */
export const readProfileTab = (value?: string | null): ProfileTab =>
  PROFILE_TABS.includes(value as ProfileTab) ? (value as ProfileTab) : 'account';

/** Có vé trong ví để mở mã QR vào cổng: vé đã chuyển và đơn không bị hoàn. */
export const canOpenMyTickets = (order: Pick<BuyerOrderDto, 'status' | 'transferredAt'>): boolean =>
  !!order.transferredAt && order.status !== 'Refunded' && order.status !== 'RefundQueued';
