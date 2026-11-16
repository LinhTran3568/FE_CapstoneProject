import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import type { BuyerOrderDto } from '@ticketshield/api-client';
import { DisputeProgressDrawer, type DisputeProgressTarget } from '../dispute/DisputeProgressDrawer';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { OrderStatusPill } from './OrderStatusPill';
import { useMyOrders } from '../../hooks/useMyOrders';
import {
  ORDER_FILTERS,
  isUnpaidOrder,
  orderTickets,
  orderTierLabel,
  refundLine,
  toOrderParams,
  type OrderListState,
} from '../../utils/buyerOrders';
import { formatEventDateTime, formatVND } from '../../utils/formatters';

const INITIAL_STATE: OrderListState = { page: 1, keyword: '', filter: 'all' };

const errorText = (error: unknown, fallback = 'Could not load your orders.') =>
  error instanceof Error && error.message ? error.message : fallback;

const SummaryCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-[#05070A] px-4 py-3">
    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B929C]">{label}</p>
    <p className="mt-1 text-lg font-extrabold tabular-nums text-white truncate">{value}</p>
  </div>
);

const RetryButton: React.FC<{ onClick: () => void; busy: boolean }> = ({ onClick, busy }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-100 transition-colors hover:bg-rose-500/30 disabled:opacity-60 cursor-pointer"
  >
    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
    Retry
  </button>
);

const OrderCard: React.FC<{ order: BuyerOrderDto; onOpen: () => void }> = ({ order, onOpen }) => {
  const unpaid = isUnpaidOrder(order.status);
  const faded = order.status === 'Expired' || order.status === 'Cancelled';
  const refund = refundLine(order);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Order ${order.orderCode}, ${order.eventName}`}
      className={`group p-4 bg-[#05070A] border border-white/10 hover:border-white/25 focus:border-[#FF5A36]/60 focus:outline-none rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors cursor-pointer ${
        faded ? 'opacity-60' : ''
      }`}
    >
      <div className="hidden sm:block p-3 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] shrink-0">
        <ReceiptText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-bold text-white text-sm truncate">{order.eventName || '—'}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#8B929C] font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {order.eventStartAt ? formatEventDateTime(order.eventStartAt) : '—'}
          </span>
          <span className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{order.eventVenue || '—'}</span>
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">
          {orderTierLabel(order)}
          <span className="text-white/20"> · </span>
          <span className="text-zinc-300">{order.orderCode}</span>
        </p>
        <p className="text-[11px] text-[#8B929C]">Ordered {formatEventDateTime(order.createdAt)}</p>
        {refund && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300">
            <RotateCcw className="w-3 h-3" />
            {refund.text}
          </p>
        )}
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
        <div className="text-left sm:text-right">
          <p className={`text-sm font-bold font-mono tabular-nums ${unpaid ? 'text-zinc-400' : 'text-white'}`}>
            {formatVND(order.totalBuyerPaid)}
          </p>
          {unpaid && <p className="text-[10px] font-mono font-bold uppercase text-zinc-500">Not paid</p>}
        </div>
        <OrderStatusPill status={order.status} />
      </div>
    </div>
  );
};

/**
 * Tab Orders của trang Tài khoản (SCRUM-342): mọi đơn mua vé của người mua, kèm ô tổng,
 * ô tìm, nút lọc, phân trang và khung chi tiết. Chỉ mount khi tab đang mở.
 */
export const OrderHistoryTab: React.FC = () => {
  const [state, setState] = useState<OrderListState>(INITIAL_STATE);
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState<BuyerOrderDto | null>(null);
  const [progressTarget, setProgressTarget] = useState<DisputeProgressTarget | null>(null);

  const params = useMemo(() => toOrderParams(state), [state]);
  const { data, isPending, isError, error, refetch, isFetching } = useMyOrders(params);

  // Ô tìm chờ 400ms sau lần gõ cuối. Ref chặn việc đẩy lại đúng từ khoá vừa áp dụng (ví dụ sau khi xoá bộ lọc).
  const appliedKeyword = useRef(state.keyword);
  appliedKeyword.current = state.keyword;
  useEffect(() => {
    if (draft === appliedKeyword.current) return;
    const timer = window.setTimeout(() => setState((s) => ({ ...s, keyword: draft, page: 1 })), 400);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const summary = data?.summary;
  const page = data?.orders;
  const rows = page?.items ?? [];
  const failedFirstLoad = isError && !data;
  const hasFilters = state.filter !== 'all' || state.keyword.trim() !== '' || draft.trim() !== '';

  const clearFilters = () => {
    setDraft('');
    setState(INITIAL_STATE);
  };

  return (
    <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-5 md:p-8 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <ReceiptText className="w-[18px] h-[18px] text-[#FF5A36]" /> Orders
          </h3>
          <p className="text-xs text-[#8B929C] mt-0.5">
            Every ticket purchase you made, with the VietQR amount and SePay reference.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Refresh orders"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-[#CBD5E1] transition-colors disabled:opacity-60 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Ô tổng do BE tính trên mọi đơn, không theo bộ lọc. */}
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label="Orders" value={summary ? summary.totalOrders : '—'} />
          <SummaryCard label="Spent" value={summary ? formatVND(summary.totalSpent) : '—'} />
          <SummaryCard label="Refunded" value={summary ? formatVND(summary.totalRefunded) : '—'} />
          <SummaryCard label="In escrow" value={summary ? summary.inEscrowOrdersCount : '—'} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search orders</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B929C]" />
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Order code, transfer note, SePay ref, ticket or event"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#05070A] border border-white/10 focus:border-[#FF5A36]/60 focus:outline-none text-xs text-white placeholder:text-[#5C636E]"
          />
        </label>
        <div role="group" aria-label="Order status" className="flex flex-wrap gap-1.5">
          {ORDER_FILTERS.map((f) => {
            const active = state.filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setState((s) => ({ ...s, filter: f.value, page: 1 }))}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FF5A36]/15 border-[#FF5A36]/50 text-[#FF9C85]'
                    : 'bg-white/[0.03] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/25'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isError && data && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorText(error, 'Could not refresh your orders.')}
          </span>
          <RetryButton onClick={() => void refetch()} busy={isFetching} />
        </div>
      )}

      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-400" aria-busy="true">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
          Loading orders...
        </div>
      ) : failedFirstLoad ? (
        <div role="alert" className="py-10 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-200">Unable to load your orders</p>
          <p className="text-xs text-[#8B929C]">{errorText(error)}</p>
          <RetryButton onClick={() => void refetch()} busy={isFetching} />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <ReceiptText className="w-10 h-10 text-zinc-600 mx-auto" />
          {hasFilters ? (
            <>
              <p className="text-sm font-semibold text-zinc-400">No orders match these filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF5A36] hover:text-[#FF7252] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-400">No orders yet.</p>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF5A36] hover:text-[#FF7252] transition-colors"
              >
                Browse the marketplace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((order) => (
            <OrderCard key={order.orderId} order={order} onOpen={() => setSelected(order)} />
          ))}
        </div>
      )}

      {page && page.totalPages > 1 && (
        <nav aria-label="Orders pages" className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, page: s.page - 1 }))}
            disabled={!page.hasPreviousPage || isFetching}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-mono text-[#CBD5E1] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-[11px] font-mono text-[#8B929C]">
            Page {page.pageNumber} of {page.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, page: s.page + 1 }))}
            disabled={!page.hasNextPage || isFetching}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-mono text-[#CBD5E1] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}

      {selected && (
        <OrderDetailDrawer
          key={selected.orderId}
          order={selected}
          onClose={() => setSelected(null)}
          onViewDispute={(order) => {
            if (!order.disputeId) return;
            // Đổi khung chứ không chồng: 2 khung cùng nghe Esc trên window và cùng lớp z-[90].
            setSelected(null);
            setProgressTarget({
              disputeId: order.disputeId,
              eventName: order.eventName,
              ticketCode: orderTickets(order)[0]?.ticketCode,
            });
          }}
        />
      )}

      {progressTarget && (
        <DisputeProgressDrawer target={progressTarget} onClose={() => setProgressTarget(null)} />
      )}
    </div>
  );
};
