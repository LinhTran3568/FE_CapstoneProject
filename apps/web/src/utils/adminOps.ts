// Logic thuần cho các trang Admin (US-11.1: SCRUM-335, 337, 339).
// Không gọi API, không đụng React: test được bằng npm run test:admin.
import type {
  AdminListingDto,
  AdminListingsParams,
  AdminTransactionDto,
  AdminTransactionsParams,
  EventTransactionAnalyticsDto,
} from '@ticketshield/api-client';
import { formatEventDateTime, formatVND } from './formatters';
import { ESCROW_STATUS_LABEL, LISTING_STATUS_LABEL, PAYOUT_STATUS_LABEL, VERIFICATION_STATUS_LABEL } from './moneyStatus';

// ── Tiền ──

/** Dùng lại formatVND của web cho cùng một kiểu ghi tiền. Chưa có số thì ra "—". */
export const formatMoney = (amount?: number | null): string =>
  amount === null || amount === undefined ? '—' : formatVND(amount);

// ── Giao dịch ký quỹ ──

const MINUTE_MS = 60 * 1000;

/** Giao dịch còn giữ tiền thì đếm ngược tới lúc mở khoá, ngược lại ghi ngày giờ mở khoá. */
export const unlockLabel = (tx: Pick<AdminTransactionDto, 'status' | 'unlockAt'>, now: Date): string => {
  if (!tx.unlockAt) return '—';
  const at = new Date(tx.unlockAt);
  if (Number.isNaN(at.getTime())) return '—';

  const diff = at.getTime() - now.getTime();
  if (tx.status === 'Locked' && diff > 0) {
    const totalMinutes = Math.floor(diff / MINUTE_MS);
    if (totalMinutes < 1) return 'in <1m';
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  }
  return formatEventDateTime(tx.unlockAt);
};

export interface MoneySplit {
  ticketPrice: number;
  buyerFee: number;
  buyerPaid: number;
  sellerFee: number;
  sellerReceives: number;
  platformKeeps: number;
}

type MoneyFields = Pick<
  AdminTransactionDto,
  'originalTicketPrice' | 'buyerFee' | 'sellerFee' | 'totalBuyerPaid' | 'netSellerPayout'
>;

/** Đọc thẳng số BE trả, chỉ tự tính phần sàn giữ = phí người mua + phí người bán. */
export const moneySplit = (tx: MoneyFields): MoneySplit => ({
  ticketPrice: tx.originalTicketPrice,
  buyerFee: tx.buyerFee,
  buyerPaid: tx.totalBuyerPaid,
  sellerFee: tx.sellerFee,
  sellerReceives: tx.netSellerPayout,
  platformKeeps: tx.buyerFee + tx.sellerFee,
});

export type TimelineKey = 'created' | 'transferred' | 'dispute' | 'unlock' | 'settled';

export interface TimelineStep {
  key: TimelineKey;
  label: string;
  /** Mốc chưa có ngày là chưa xảy ra. */
  at: string | null;
  /** Đã xảy ra: có ngày và ngày đó không ở tương lai. */
  done: boolean;
}

type TimelineFields = Pick<
  AdminTransactionDto,
  | 'createdAt'
  | 'transferredAt'
  | 'disputeDeadline'
  | 'disputeWaived'
  | 'disputeWaivedAt'
  | 'unlockAt'
  | 'refundedAt'
  | 'payoutStatus'
  | 'payoutProcessedAt'
>;

export const transactionTimeline = (tx: TimelineFields, now: Date): TimelineStep[] => {
  const step = (key: TimelineKey, label: string, at: string | null | undefined): TimelineStep => {
    const value = at ?? null;
    const time = value ? new Date(value).getTime() : NaN;
    return { key, label, at: value, done: !Number.isNaN(time) && time <= now.getTime() };
  };

  const dispute = tx.disputeWaived
    ? step('dispute', 'Dispute waived', tx.disputeWaivedAt)
    : step('dispute', 'Dispute window ends', tx.disputeDeadline);

  // Lần giải ngân lỗi cũng có payoutProcessedAt, nên chỉ Success mới tính là đã trả tiền.
  const settled = tx.refundedAt
    ? step('settled', 'Refunded', tx.refundedAt)
    : step('settled', 'Paid out', tx.payoutStatus === 'Success' ? tx.payoutProcessedAt : null);

  return [
    step('created', 'Created', tx.createdAt),
    step('transferred', 'Ticket transferred', tx.transferredAt),
    dispute,
    step('unlock', 'Unlocks', tx.unlockAt),
    settled,
  ];
};

/** Chỉ để lộ 4 số cuối. Số quá ngắn thì che hết. */
export const maskAccountNumber = (accountNumber?: string | null): string => {
  const value = (accountNumber ?? '').trim();
  if (!value) return '—';
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
};

// ── Tin đăng và trần giá ──

export type CeilingVerdict = 'UNDER' | 'AT_CAP' | 'OVER';

/** Đọc cờ BE (BE làm tròn xuống giá trần). Vượt trần thắng bằng trần. */
export const ceilingVerdict = (
  listing: Pick<AdminListingDto, 'isAtPriceCeiling' | 'isPriceCeilingExceeded'>
): CeilingVerdict => {
  if (listing.isPriceCeilingExceeded) return 'OVER';
  if (listing.isAtPriceCeiling) return 'AT_CAP';
  return 'UNDER';
};

/** Trần lúc đăng tin khác trần hiện tại của sự kiện. Trần sự kiện bằng 0 là tin thiếu sự kiện, bỏ qua. */
export const capChanged = (
  listing: Pick<AdminListingDto, 'appliedMarkupPercentage' | 'eventMaxMarkupPercentage'>
): boolean =>
  listing.eventMaxMarkupPercentage > 0 &&
  listing.eventMaxMarkupPercentage !== listing.appliedMarkupPercentage;

/** Chép điều kiện nhãn combo của MyListingsPage. */
export const comboLabel = (listing: Pick<AdminListingDto, 'bundleId' | 'bundleTotalTickets'>): string | null => {
  if (!listing.bundleId && !(listing.bundleTotalTickets >= 2)) return null;
  return `COMBO (${listing.bundleTotalTickets || 2} TICKETS)`;
};

// ── Dashboard ──

export type EventMetric = 'revenue' | 'gmv';

type EventMetricFields = Pick<
  EventTransactionAnalyticsDto,
  'eventId' | 'eventName' | 'totalPlatformRevenue' | 'totalTransactionVolume'
>;

export const topEvents = <T extends EventMetricFields>(
  events: T[],
  metric: EventMetric,
  limit = 8
): Array<T & { value: number }> =>
  events
    .map((e) => ({ ...e, value: metric === 'revenue' ? e.totalPlatformRevenue : e.totalTransactionVolume }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

export type DashboardRange = '7d' | '30d' | 'All';

const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** 7d và 30d tính cả hôm nay, bắt đầu từ đầu ngày theo giờ máy. */
export const rangeToDates = (range: DashboardRange, now: Date): { fromDate?: string } => {
  if (range === 'All') return {};
  const days = range === '7d' ? 7 : 30;
  const from = startOfLocalDay(now);
  from.setDate(from.getDate() - (days - 1));
  return { fromDate: from.toISOString() };
};

// ── Bộ lọc trên URL ──

const DEFAULT_PAGE_SIZE = 20;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LISTING_STATUSES = ['Draft', ...Object.keys(LISTING_STATUS_LABEL)];

const readPage = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
};

const readSize = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : DEFAULT_PAGE_SIZE;
};

const readDate = (value: string | null) => {
  if (!value || !DATE_RE.test(value)) return '';
  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? '' : value;
};

const oneOf = (allowed: readonly string[], value: string | null) =>
  value && allowed.includes(value) ? value : '';

const readGuid = (value: string | null) => (value && GUID_RE.test(value) ? value : '');

/** "YYYY-MM-DD" → đầu ngày hoặc cuối ngày theo giờ máy, dạng ISO. */
const dayBoundaryIso = (value: string, end: boolean): string | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  const date = end ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
  return date.toISOString();
};

/** Đổi bộ lọc thì về trang 1. Chỉ đổi trang thì giữ nguyên bộ lọc. */
export const withFilter = <T extends { page: number }>(filters: T, patch: Partial<T>): T =>
  'page' in patch ? { ...filters, ...patch } : { ...filters, ...patch, page: 1 };

const writeCommon = (search: URLSearchParams, f: { page: number; size: number; keyword: string }) => {
  if (f.page !== 1) search.set('page', String(f.page));
  if (f.size !== DEFAULT_PAGE_SIZE) search.set('size', String(f.size));
  if (f.keyword) search.set('q', f.keyword);
};

const writeDates = (search: URLSearchParams, f: { from: string; to: string }) => {
  if (f.from) search.set('from', f.from);
  if (f.to) search.set('to', f.to);
};

export interface TransactionFilters {
  page: number;
  size: number;
  keyword: string;
  status: string;
  payoutStatus: string;
  holdOnly: boolean;
  from: string;
  to: string;
}

export const readTransactionFilters = (search: URLSearchParams): TransactionFilters => ({
  page: readPage(search.get('page')),
  size: readSize(search.get('size')),
  keyword: search.get('q') ?? '',
  status: oneOf(Object.keys(ESCROW_STATUS_LABEL), search.get('status')),
  payoutStatus: oneOf(Object.keys(PAYOUT_STATUS_LABEL), search.get('payout')),
  holdOnly: search.get('hold') === '1',
  from: readDate(search.get('from')),
  to: readDate(search.get('to')),
});

/** Bỏ giá trị mặc định cho URL gọn. */
export const writeTransactionFilters = (f: TransactionFilters): string => {
  const search = new URLSearchParams();
  writeCommon(search, f);
  if (f.status) search.set('status', f.status);
  if (f.payoutStatus) search.set('payout', f.payoutStatus);
  if (f.holdOnly) search.set('hold', '1');
  writeDates(search, f);
  return search.toString();
};

export const toTransactionParams = (f: TransactionFilters): AdminTransactionsParams => ({
  page: f.page,
  size: f.size,
  keyword: f.keyword.trim() || undefined,
  status: f.status || undefined,
  payoutStatus: f.payoutStatus || undefined,
  inSettlementBufferOnly: f.holdOnly || undefined,
  fromDate: dayBoundaryIso(f.from, false),
  toDate: dayBoundaryIso(f.to, true),
});

export type ListingType = 'all' | 'single' | 'combo';

export interface ListingFilters {
  page: number;
  size: number;
  keyword: string;
  type: ListingType;
  status: string;
  verification: string;
  eventId: string;
  sellerId: string;
  atCapOnly: boolean;
  from: string;
  to: string;
}

export const readListingFilters = (search: URLSearchParams): ListingFilters => ({
  page: readPage(search.get('page')),
  size: readSize(search.get('size')),
  keyword: search.get('q') ?? '',
  type: (oneOf(['single', 'combo'], search.get('type')) || 'all') as ListingType,
  status: oneOf(LISTING_STATUSES, search.get('status')),
  verification: oneOf(Object.keys(VERIFICATION_STATUS_LABEL), search.get('verification')),
  eventId: readGuid(search.get('eventId')),
  sellerId: readGuid(search.get('sellerId')),
  atCapOnly: search.get('cap') === '1',
  from: readDate(search.get('from')),
  to: readDate(search.get('to')),
});

export const writeListingFilters = (f: ListingFilters): string => {
  const search = new URLSearchParams();
  writeCommon(search, f);
  if (f.type !== 'all') search.set('type', f.type);
  if (f.status) search.set('status', f.status);
  if (f.verification) search.set('verification', f.verification);
  if (f.eventId) search.set('eventId', f.eventId);
  if (f.sellerId) search.set('sellerId', f.sellerId);
  if (f.atCapOnly) search.set('cap', '1');
  writeDates(search, f);
  return search.toString();
};

export const toListingParams = (f: ListingFilters): AdminListingsParams => ({
  page: f.page,
  size: f.size,
  keyword: f.keyword.trim() || undefined,
  status: f.status || undefined,
  verificationStatus: f.verification || undefined,
  isBundleOnly: f.type === 'combo' || undefined,
  isSingleOnly: f.type === 'single' || undefined,
  isAtPriceCeilingOnly: f.atCapOnly || undefined,
  eventId: f.eventId || undefined,
  sellerId: f.sellerId || undefined,
  fromDate: dayBoundaryIso(f.from, false),
  toDate: dayBoundaryIso(f.to, true),
});
