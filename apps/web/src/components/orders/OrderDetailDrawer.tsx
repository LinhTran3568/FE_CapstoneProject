import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Check, MapPin, ShieldAlert, Ticket, X } from 'lucide-react';
import type { BuyerOrderDto } from '@ticketshield/api-client';
import { CopyButton } from '../ui/CopyButton';
import { OrderStatusPill } from './OrderStatusPill';
import {
  REFUND_SOURCE_TEXT,
  canOpenMyTickets,
  isTicketIssued,
  isUnpaidOrder,
  orderTickets,
  orderTierLabel,
  orderTimeline,
  refundLine,
  refundSource,
  type TimelineStep,
} from '../../utils/buyerOrders';
import { formatEventDateTime, formatShortDate, formatVND } from '../../utils/formatters';

interface OrderDetailDrawerProps {
  order: BuyerOrderDto;
  onClose: () => void;
  /** Đơn có khiếu nại: trang đóng khung này rồi mở khung tiến độ khiếu nại. */
  onViewDispute: (order: BuyerOrderDto) => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-2 text-[10px] font-mono font-extrabold uppercase tracking-[0.12em] text-[#8B929C]">{children}</h3>
);

const MoneyRow: React.FC<{ label: string; value: string; strong?: boolean; children?: React.ReactNode }> = ({
  label,
  value,
  strong,
  children,
}) => (
  <div className={`flex items-center justify-between gap-3 ${strong ? 'border-t border-white/10 pt-2 mt-1' : ''}`}>
    <span className={`text-xs ${strong ? 'font-bold text-white' : 'text-slate-300'}`}>
      {label}
      {children}
    </span>
    <span className={`font-mono tabular-nums ${strong ? 'text-[15px] font-extrabold text-white' : 'text-xs text-slate-200'}`}>
      {value}
    </span>
  </div>
);

const ReferenceRow: React.FC<{ label: string; value?: string | null; emptyHint: string }> = ({ label, value, emptyHint }) => (
  <div className="flex items-start justify-between gap-3 py-1.5">
    <div className="min-w-0">
      <p className="text-[11px] text-[#8B929C]">{label}</p>
      {value ? (
        <p className="font-mono text-[13px] font-bold text-white break-all">{value}</p>
      ) : (
        <>
          <p className="font-mono text-[13px] text-[#8B929C]">—</p>
          <p className="text-[11px] text-[#8B929C]">{emptyHint}</p>
        </>
      )}
    </div>
    {value && <CopyButton value={value} iconOnly ariaLabel={`Copy ${label.toLowerCase()}`} />}
  </div>
);

const StepItem: React.FC<{ step: TimelineStep; isLast: boolean }> = ({ step, isLast }) => {
  const done = step.state === 'done';
  const current = step.state === 'current';
  const dotClasses = done
    ? 'bg-emerald-500 text-white'
    : current
      ? 'bg-[#FF5A36] text-white ring-4 ring-[#FF5A36]/25'
      : 'border-2 border-white/25 text-white/30';
  const when = step.at ? formatEventDateTime(step.at) : null;

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
      </span>
      <div className="min-w-0">
        <p className={`text-[13px] font-bold ${current ? 'text-[#FF9C85]' : done ? 'text-white' : 'text-[#8B929C]'}`}>
          {step.label}
        </p>
        {step.detail ? (
          <p className="text-[11.5px] text-[#8B929C]">{step.detail}</p>
        ) : (
          when && <p className="text-[11.5px] text-[#8B929C]">{when}</p>
        )}
        <span className="sr-only">{done ? 'Done' : current ? 'In progress' : 'Not yet'}</span>
      </div>
    </li>
  );
};

/** Khung chi tiết một đơn của người mua: vé, thanh toán VietQR và mã SePay, tiến trình, hoàn tiền. */
export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({ order, onClose, onViewDispute }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Trang render lại mỗi lần danh sách tải xong và đưa onClose mới: giữ bản mới nhất trong ref
  // để không chạy lại effect và cướp focus.
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

  const unpaid = isUnpaidOrder(order.status);
  const issued = isTicketIssued(order);
  const tickets = orderTickets(order);
  const timeline = orderTimeline(order, new Date());
  const refund = refundLine(order);
  const source = refundSource(order);

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
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8B929C]">
                Order · <span className="text-slate-200">{order.orderCode}</span>
              </p>
              <CopyButton value={order.orderCode} iconOnly variant="ghost" ariaLabel="Copy order code" />
            </div>
            <h2 id={titleId} className="text-[17px] font-extrabold text-white leading-snug">
              {order.eventName || 'Order details'}
            </h2>
            <OrderStatusPill status={order.status} />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section>
            <SectionLabel>Event</SectionLabel>
            <div className="space-y-1 text-[12px] text-slate-300">
              <p className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#8B929C]" />
                {order.eventStartAt ? formatEventDateTime(order.eventStartAt) : '—'}
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#8B929C]" />
                {order.eventVenue || '—'}
              </p>
              <p className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-[#8B929C]" />
                {orderTierLabel(order)}
              </p>
            </div>
            <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.03]" aria-label="Tickets">
              {tickets.length === 0 ? (
                <li className="px-3.5 py-2.5 text-xs text-[#8B929C]">No ticket code yet.</li>
              ) : (
                tickets.map((t, i) => (
                  <li key={`${t.ticketCode}-${i}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="font-mono text-[12.5px] font-bold text-white break-all">{t.ticketCode}</span>
                    <span className="shrink-0 text-[11.5px] text-[#8B929C]">{t.seatZone || '—'}</span>
                  </li>
                ))
              )}
            </ul>
            {!issued && (
              <p className="mt-2 text-[11.5px] text-[#8B929C]">
                Ticket codes stay masked: the ticket has not been transferred to you.
              </p>
            )}
          </section>

          <section>
            <SectionLabel>Payment (VietQR)</SectionLabel>
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <MoneyRow label="Ticket price" value={formatVND(order.originalTicketPrice)} />
              <MoneyRow label="Service fee" value={formatVND(order.buyerFee)} />
              <MoneyRow label={unpaid ? 'Amount due' : 'You paid'} value={formatVND(order.totalBuyerPaid)} strong>
                {unpaid && (
                  <span className="ml-2 rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-zinc-300">
                    Not paid
                  </span>
                )}
              </MoneyRow>
            </div>
            <div className="mt-2 divide-y divide-white/5">
              <ReferenceRow
                label="Transfer note"
                value={order.paymentReference}
                emptyHint="This order has no transfer note."
              />
              <ReferenceRow
                label="SePay reference"
                value={order.bankTransactionReference}
                emptyHint="Shown after SePay confirms the transfer."
              />
            </div>
          </section>

          <section>
            <SectionLabel>Progress</SectionLabel>
            <ol>
              {timeline.map((step, i) => (
                <StepItem key={step.key} step={step} isLast={i === timeline.length - 1} />
              ))}
            </ol>
          </section>

          {refund && (
            <section>
              <SectionLabel>Refund</SectionLabel>
              <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-3">
                <p className="text-[22px] font-extrabold tabular-nums text-white">{formatVND(refund.amount)}</p>
                <p className="text-[12px] font-bold text-indigo-200">
                  {refund.state === 'done'
                    ? `Refund completed${refund.at ? ` on ${formatShortDate(refund.at)}` : ''}`
                    : 'Refund queued'}
                </p>
                {source && <p className="mt-1 text-[11.5px] text-indigo-100/80">{REFUND_SOURCE_TEXT[source]}</p>}
              </div>
            </section>
          )}

          {(order.disputeId || canOpenMyTickets(order)) && (
            <section className="flex flex-col gap-2">
              {order.disputeId && (
                <button
                  type="button"
                  onClick={() => onViewDispute(order)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/20"
                >
                  <ShieldAlert className="h-4 w-4" />
                  View dispute progress
                </button>
              )}
              {canOpenMyTickets(order) && (
                <Link
                  to="/my-tickets"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
                >
                  View ticket in My Tickets
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </section>
          )}
        </div>

        <footer className="flex items-center justify-end border-t border-white/10 px-5 pb-4 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-mono font-extrabold text-white transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </footer>
      </motion.aside>
    </div>,
    document.body
  );
};
