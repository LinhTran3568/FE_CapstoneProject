import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, Minus, RefreshCw, X } from 'lucide-react';
import type {
  DisputeMoneyDto,
  DisputeTimelineStepDto,
  MyDisputeProgressDto,
} from '@ticketshield/api-client';
import { isProgressStillChanging, useMyDisputeProgress } from '../../hooks/useMyDisputeProgress';
import { formatVND } from '../../utils/formatters';
import { disputeReasonTitle } from './disputeReasons';

/** What the page knows about the row the drawer was opened from; the progress API does not return it. */
export interface DisputeProgressTarget {
  disputeId: string;
  eventName: string;
  ticketCode?: string;
}

interface DisputeProgressDrawerProps {
  target: DisputeProgressTarget;
  onClose: () => void;
}

const STEP_LABELS: Record<string, string> = {
  SUBMITTED: 'Đã nộp khiếu nại',
  GATE_LOG_CHECK: 'Đối chiếu dữ liệu soát vé tại cổng',
  RESOLVED: 'Đã phân xử',
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} ${time}`;
};

const statusPill = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return { label: 'Được chấp nhận', classes: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' };
    case 'REJECTED':
      return { label: 'Không được chấp nhận', classes: 'bg-rose-500/15 border-rose-500/40 text-rose-300' };
    default:
      return { label: 'Đang xử lý', classes: 'bg-amber-500/15 border-amber-500/40 text-amber-300' };
  }
};

const MONEY_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Đang chờ chuyển',
  PROCESSING: 'Đang chuyển',
  SUCCESS: 'Đã chuyển',
  FAILED: 'Chuyển chưa thành công',
};

/** Green when the outcome favours the viewer, red when it goes against them, neutral for the seller of a refunded sale. */
const resultTone = (outcome: string | null | undefined, viewerRole: string) => {
  if (outcome === 'REFUND_BUYER') return viewerRole === 'BUYER' ? 'good' : 'neutral';
  if (outcome === 'RELEASE_SELLER') return viewerRole === 'SELLER' ? 'good' : 'bad';
  return 'neutral';
};

const TONE_CLASSES = {
  good: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
  bad: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
  neutral: 'bg-white/[0.05] border-white/15 text-slate-200',
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-2 text-[10px] font-mono font-extrabold uppercase tracking-[0.12em] text-[#8B929C]">{children}</h3>
);

const TimelineStep: React.FC<{ step: DisputeTimelineStepDto; isLast: boolean }> = ({ step, isLast }) => {
  const label = STEP_LABELS[step.step] ?? step.step;
  const done = step.state === 'DONE';
  const current = step.state === 'CURRENT';
  const skipped = step.state === 'SKIPPED';

  let detail = 'Chưa tới bước này';
  if (done) detail = formatDateTime(step.at) || 'Đã xong';
  else if (current) detail = 'Đang thực hiện…';
  else if (skipped) detail = 'Đã bỏ qua';

  const dotClasses = done
    ? 'bg-emerald-400 text-[#05140f]'
    : current
      ? 'bg-[#FF5A36] text-white ring-4 ring-[#FF5A36]/25'
      : skipped
        ? 'border-2 border-dashed border-white/30 text-white/50'
        : 'border-2 border-white/25 text-white/30';

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${done ? 'bg-emerald-400/50' : 'bg-white/10'}`}
        />
      )}
      <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${dotClasses}`}>
        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        {current && <span className="h-2 w-2 rounded-full bg-white" />}
        {skipped && <Minus className="h-3 w-3" />}
      </span>
      <div className="min-w-0">
        <p className={`text-[13px] font-bold ${current ? 'text-[#FF9C85]' : done ? 'text-white' : 'text-[#8B929C]'}`}>
          {label}
        </p>
        <p className="text-[11.5px] text-[#8B929C]">{detail}</p>
      </div>
    </li>
  );
};

const MoneyBlock: React.FC<{ money: DisputeMoneyDto }> = ({ money }) => {
  const isRefund = money.kind === 'REFUND';
  const statusLabel = MONEY_STATUS_LABELS[money.status] ?? 'Đang xử lý';
  const processedAt = formatDateTime(money.processedAt);
  const settled = money.status === 'APPROVED' || money.status === 'SUCCESS';

  return (
    <section>
      <SectionLabel>Tiền của bạn</SectionLabel>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
          <span>{isRefund ? 'Hoàn tiền' : 'Tiền bán vé'}</span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-mono font-extrabold uppercase ${
              settled
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 text-[22px] font-extrabold tabular-nums text-white">{formatVND(money.amount)}</p>
        {processedAt && <p className="text-[11.5px] text-[#8B929C]">Xử lý lúc {processedAt}</p>}
      </div>
    </section>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Đang tải tiến độ khiếu nại">
    <div className="h-6 w-32 rounded-full bg-white/10" />
    <div className="h-14 rounded-xl bg-white/[0.06]" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex gap-3">
        <div className="h-6 w-6 rounded-full bg-white/10" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
        </div>
      </div>
    ))}
  </div>
);

const errorMessage = (error: unknown): string => {
  const status = (error as { status?: number } | null)?.status;
  if (status === 403 || status === 404) return 'Không tìm thấy khiếu nại này, hoặc bạn không có quyền xem.';
  return 'Không tải được tiến độ khiếu nại. Vui lòng thử lại.';
};

const ProgressBody: React.FC<{ data: MyDisputeProgressDto }> = ({ data }) => {
  const pill = statusPill(data.status);
  const isBuyer = data.viewerRole === 'BUYER';
  const tone = resultTone(data.outcome, data.viewerRole);

  return (
    <div className="space-y-5">
      <div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-wider ${pill.classes}`}
        >
          {pill.label}
        </span>
      </div>

      <section>
        <SectionLabel>Lý do khiếu nại</SectionLabel>
        <div className="rounded-xl border border-white/10 bg-[#05070A] px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-200">
          {disputeReasonTitle(Number(data.reasonCode))}
          {isBuyer && data.description && (
            <p className="mt-1.5 border-l-2 border-white/20 pl-2 text-[11.5px] text-[#8B929C]">
              <span className="block text-[10.5px] font-bold uppercase tracking-wide text-[#8B929C]/80">
                Lời bạn đã nêu
              </span>
              “{data.description}”
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionLabel>Các bước xử lý</SectionLabel>
        <ol>
          {data.timeline.map((step, index) => (
            <TimelineStep key={step.step} step={step} isLast={index === data.timeline.length - 1} />
          ))}
        </ol>
      </section>

      {data.resolutionMessage && (
        <section>
          <SectionLabel>Kết quả</SectionLabel>
          <p className={`rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed ${TONE_CLASSES[tone]}`}>
            {data.resolutionMessage}
          </p>
        </section>
      )}

      {data.money && <MoneyBlock money={data.money} />}
    </div>
  );
};

/**
 * Side panel with the progress of one dispute, for the buyer or the seller of the sale.
 * Mounted only while open: closing it unmounts the query, so polling stops with it.
 */
export const DisputeProgressDrawer: React.FC<DisputeProgressDrawerProps> = ({ target, onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { data, isError, error, refetch, isFetching } = useMyDisputeProgress(target.disputeId, true);

  // The parent re-renders on every list refresh and hands over a new onClose each time,
  // so keep the latest one in a ref instead of re-running the effect (which would steal focus again).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // A failed reload keeps the progress already on screen; the error view is only for a first load that failed.
  const failedFirstLoad = isError && data === undefined;
  const isAutoUpdating = isProgressStillChanging(data);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-full w-full max-w-[460px] flex-col border-l border-white/15 bg-[#0B0E12] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-3.5 pt-[18px]">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8B929C]">
              Khiếu nại{data?.disputeCode ? ` · ${data.disputeCode}` : ''}
            </p>
            <h2 id={titleId} className="mt-0.5 text-[17px] font-extrabold text-white">
              Tiến độ khiếu nại
            </h2>
            <p className="truncate text-[11.5px] text-[#8B929C]">
              {target.eventName}
              {target.ticketCode ? ` · Mã vé ${target.ticketCode}` : ''}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {failedFirstLoad ? (
            <div className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-200" role="alert">
              <p>{errorMessage(error)}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-100 transition-colors hover:bg-rose-500/30 disabled:opacity-60"
              >
                {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Thử lại
              </button>
            </div>
          ) : data ? (
            <ProgressBody data={data} />
          ) : (
            <LoadingSkeleton />
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 px-5 pb-4 pt-3 text-[11px] text-[#8B929C]">
          {isAutoUpdating ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Tự động cập nhật vài giây một lần
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-mono font-extrabold text-white transition-colors hover:bg-white/10"
          >
            Đóng
          </button>
        </footer>
      </motion.aside>
    </div>,
    document.body
  );
};
