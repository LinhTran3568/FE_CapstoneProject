// Mảnh giao diện dùng chung cho trang Giao dịch, Tin đăng và phần thống kê Dashboard (SCRUM-333).
// Màu và cỡ chữ chép theo các trang Admin đang có (AdminUsersPage).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw, Search, X } from 'lucide-react';
import type { CeilingVerdict } from '../../utils/adminOps';

export const errorText = (error: unknown, fallback = 'Could not load data.') =>
  error instanceof Error && error.message ? error.message : fallback;

// ── Đầu trang ──

export const PageHeader: React.FC<{
  title: string;
  badge?: string;
  onRefresh: () => void;
  refreshing: boolean;
  children?: React.ReactNode;
}> = ({ title, badge, onRefresh, refreshing, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAF0] pb-4">
    <h1 className="text-xl font-bold text-[#101722] tracking-tight flex items-center gap-2">
      <span>{title}</span>
      {badge && (
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {badge}
        </span>
      )}
    </h1>
    <div className="flex items-center gap-2 flex-wrap">
      {children}
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-[#667085] ${refreshing ? 'animate-spin text-[#F45135]' : ''}`} />
        <span>Refresh</span>
      </button>
    </div>
  </div>
);

// ── Ô tổng ──

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; allTime?: boolean }> = ({
  label,
  value,
  hint,
  allTime,
}) => (
  <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10.5px] font-mono text-[#667085] uppercase tracking-wider font-semibold truncate">{label}</span>
      {allTime && (
        <span className="shrink-0 text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
          All time
        </span>
      )}
    </div>
    <div className="mt-1.5 text-lg font-bold text-[#101722] font-mono tabular-nums truncate">{value}</div>
    {hint && <div className="mt-0.5 text-[11px] text-[#667085] truncate">{hint}</div>}
  </div>
);

// ── Hàng lọc ──

export const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border border-[#E5EAF0] rounded-xl p-3 shadow-2xs flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-center gap-2.5">
    {children}
  </div>
);

/** Ô tìm có chờ 400ms sau lần gõ cuối mới báo ra ngoài. */
export const SearchBox: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Giá trị ô tìm đã tự báo ra ngoài. Chỉ giá trị khác cái này mới là bị đổi từ ngoài.
  const emittedRef = useRef(value);

  // Bộ lọc bị xoá từ ngoài (nút Clear filters) thì ô tìm xoá theo, mà không đè chữ đang gõ dở.
  useEffect(() => {
    if (value !== emittedRef.current) {
      emittedRef.current = value;
      setDraft(value);
    }
  }, [value]);

  const emit = useCallback((next: string) => {
    emittedRef.current = next;
    onChangeRef.current(next);
  }, []);

  useEffect(() => {
    if (draft === emittedRef.current) return;
    const id = setTimeout(() => emit(draft), 400);
    return () => clearTimeout(id);
  }, [draft, emit]);

  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-[#E5EAF0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F45135] focus:bg-white text-[#101722] placeholder:text-[#667085]"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            emit('');
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface SelectOption {
  value: string;
  label: string;
}

export const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
}> = ({ value, onChange, options, ariaLabel }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={ariaLabel}
    className="text-xs bg-slate-50 border border-[#E5EAF0] rounded-lg px-2.5 py-1.5 text-[#101722] focus:outline-none focus:ring-1 focus:ring-[#F45135] cursor-pointer max-w-full"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export const FilterToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <label
    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer select-none ${
      checked ? 'bg-[#FFF4F1] border-[#F45135]/40 text-[#B4321C]' : 'bg-slate-50 border-[#E5EAF0] text-[#101722]'
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="accent-[#F45135] cursor-pointer"
    />
    {label}
  </label>
);

export const DateRangeInputs: React.FC<{
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}> = ({ from, to, onChange }) => (
  <div className="flex items-center gap-1.5 text-xs text-[#667085]">
    <input
      type="date"
      value={from}
      max={to || undefined}
      onChange={(e) => onChange({ from: e.target.value, to })}
      aria-label="From date"
      className="bg-slate-50 border border-[#E5EAF0] rounded-lg px-2 py-1 text-[#101722] focus:outline-none focus:ring-1 focus:ring-[#F45135]"
    />
    <span>–</span>
    <input
      type="date"
      value={to}
      min={from || undefined}
      onChange={(e) => onChange({ from, to: e.target.value })}
      aria-label="To date"
      className="bg-slate-50 border border-[#E5EAF0] rounded-lg px-2 py-1 text-[#101722] focus:outline-none focus:ring-1 focus:ring-[#F45135]"
    />
  </div>
);

export const ClearFiltersButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-xs font-semibold text-[#F45135] hover:underline px-1 cursor-pointer self-start lg:self-auto"
  >
    Clear filters
  </button>
);

// ── Nhãn màu ──

export type PillTone = 'slate' | 'amber' | 'sky' | 'emerald' | 'rose' | 'violet' | 'orange' | 'zinc';

const TONE_CLASS: Record<PillTone, string> = {
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  sky: 'bg-sky-50 text-sky-800 border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-800 border-violet-200',
  orange: 'bg-[#FFF4F1] text-[#B4321C] border-[#F45135]/30',
  zinc: 'bg-zinc-50 text-zinc-500 border-zinc-200',
};

export const Pill: React.FC<{ tone: PillTone; children: React.ReactNode; title?: string }> = ({ tone, children, title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border whitespace-nowrap ${TONE_CLASS[tone]}`}
  >
    {children}
  </span>
);

const ESCROW_TONE: Record<string, PillTone> = {
  Pending: 'slate',
  Locked: 'amber',
  Releasing: 'sky',
  Released: 'emerald',
  Refunded: 'violet',
  Disputed: 'rose',
  RefundQueued: 'violet',
  Expired: 'zinc',
  Cancelled: 'zinc',
};

const PAYOUT_TONE: Record<string, PillTone> = {
  Pending: 'slate',
  Processing: 'sky',
  Success: 'emerald',
  Failed: 'rose',
};

const LISTING_TONE: Record<string, PillTone> = {
  Draft: 'slate',
  Verified: 'orange',
  Transacting: 'amber',
  Sold: 'emerald',
  Cancelled: 'zinc',
  Expired: 'zinc',
};

export const escrowTone = (status?: string | null): PillTone => (status && ESCROW_TONE[status]) || 'slate';
export const payoutTone = (status?: string | null): PillTone => (status && PAYOUT_TONE[status]) || 'slate';
export const listingTone = (status?: string | null): PillTone => (status && LISTING_TONE[status]) || 'slate';

/** Màu của mức trần giá: vượt trần đỏ, chạm trần cảnh báo, dưới trần xanh. */
export const verdictTone = (verdict: CeilingVerdict): PillTone =>
  verdict === 'OVER' ? 'rose' : verdict === 'AT_CAP' ? 'amber' : 'emerald';

// ── Bảng ──

export const TableShell: React.FC<{ head: React.ReactNode; children: React.ReactNode }> = ({ head, children }) => (
  <div className="bg-white border border-[#E5EAF0] rounded-xl overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#F4F6F9] text-[#667085] border-b border-[#E5EAF0] text-[10px] font-mono font-bold uppercase tracking-wider">
          {head}
        </thead>
        <tbody className="divide-y divide-[#E5EAF0]">{children}</tbody>
      </table>
    </div>
  </div>
);

export const TableMessage: React.FC<{
  colSpan: number;
  kind: 'loading' | 'empty' | 'error';
  title: string;
  detail?: string;
  action?: React.ReactNode;
}> = ({ colSpan, kind, title, detail, action }) => (
  <tr>
    <td colSpan={colSpan} className="py-14 px-4 text-center text-[#667085]">
      {kind === 'loading' && <Loader2 className="w-7 h-7 text-[#F45135] animate-spin mx-auto mb-2" />}
      {kind === 'empty' && <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />}
      {kind === 'error' && <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />}
      <p className={kind === 'loading' ? 'text-xs font-mono' : 'text-sm font-semibold text-[#101722]'}>{title}</p>
      {detail && <p className="text-xs text-[#667085] mt-0.5">{detail}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </td>
  </tr>
);

export const RetryButton: React.FC<{ onClick: () => void; busy?: boolean }> = ({ onClick, busy }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
  >
    <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
    Retry
  </button>
);

/** Lỗi khi đã có dữ liệu cũ trên màn hình: báo bằng dải, giữ nguyên bảng. */
export const ErrorBanner: React.FC<{ message: string; onRetry: () => void; busy?: boolean }> = ({ message, onRetry, busy }) => (
  <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
    <span className="flex-1">{message}</span>
    <RetryButton onClick={onRetry} busy={busy} />
  </div>
);

export const Pagination: React.FC<{
  page: number;
  totalPages: number;
  totalCount: number;
  onPage: (page: number) => void;
}> = ({ page, totalPages, totalCount, onPage }) => {
  if (totalCount === 0) return null;
  const last = Math.max(totalPages, 1);
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-[#667085]">
      <span className="font-mono">
        {totalCount} result{totalCount === 1 ? '' : 's'} · page {page} of {last}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= last}
          aria-label="Next page"
          className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
