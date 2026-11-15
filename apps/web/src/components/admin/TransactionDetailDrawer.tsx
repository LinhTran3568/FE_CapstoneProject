import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, Circle, Eye, EyeOff } from 'lucide-react';
import type { AdminTransactionDto } from '@ticketshield/api-client';
import { AdminDetailDrawer, DrawerRow, DrawerSection } from './AdminDetailDrawer';
import { Pill, escrowTone, payoutTone } from './AdminOpsUi';
import { CopyButton } from '../ui/CopyButton';
import { ESCROW_STATUS_LABEL, PAYOUT_STATUS_LABEL, labelOf } from '../../utils/moneyStatus';
import { formatEventDateTime } from '../../utils/formatters';
import { formatMoney, maskAccountNumber, moneySplit, transactionTimeline } from '../../utils/adminOps';

const DISPUTE_STATUS_LABEL: Record<string, string> = {
  Open: 'Open',
  UnderReview: 'Under review',
  Resolved: 'Resolved',
  Rejected: 'Rejected',
};

const RefRow: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 py-1 text-xs">
    <span className="shrink-0 text-[#667085]">{label}</span>
    {value ? (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-[#101722]" title={value}>
          {value}
        </span>
        <CopyButton value={value} iconOnly variant="ghost" ariaLabel={`Copy ${label.toLowerCase()}`} />
      </span>
    ) : (
      <span className="text-[#667085]">—</span>
    )}
  </div>
);

interface TransactionDetailDrawerProps {
  tx: AdminTransactionDto;
  now: Date;
  onClose: () => void;
}

/** Chi tiết một giao dịch ký quỹ (SCRUM-335). Đọc nguyên dòng của bảng, không gọi lại API. */
export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({ tx, now, onClose }) => {
  const [showAccount, setShowAccount] = useState(false);
  const split = moneySplit(tx);
  const timeline = transactionTimeline(tx, now);
  const ticketCode = tx.newTicketCode || tx.originalTicketCode;

  return (
    <AdminDetailDrawer
      eyebrow="Transaction"
      title={tx.eventName || 'Unknown event'}
      subtitle={`${ticketCode} · created ${formatEventDateTime(tx.createdAt)}`}
      onClose={onClose}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill tone={escrowTone(tx.status)}>{labelOf(ESCROW_STATUS_LABEL, tx.status)}</Pill>
        {tx.inSettlementBuffer && <Pill tone="amber">In hold window</Pill>}
        {tx.bundleId && <Pill tone="slate">COMBO</Pill>}
      </div>

      <DrawerSection title="Money split">
        <div className="rounded-lg border border-[#E5EAF0] px-3 py-1.5">
          <DrawerRow label="Ticket price">{formatMoney(split.ticketPrice)}</DrawerRow>
          <DrawerRow label="+ Buyer fee">{formatMoney(split.buyerFee)}</DrawerRow>
          <DrawerRow label="= Buyer paid (VietQR)" strong>
            {formatMoney(split.buyerPaid)}
          </DrawerRow>
          <div className="my-1 border-t border-dashed border-[#E5EAF0]" />
          <DrawerRow label="− Seller fee">{formatMoney(split.sellerFee)}</DrawerRow>
          <DrawerRow label="= Seller receives" strong>
            {formatMoney(split.sellerReceives)}
          </DrawerRow>
          <div className="my-1 border-t border-dashed border-[#E5EAF0]" />
          <DrawerRow label="Platform keeps">{formatMoney(split.platformKeeps)}</DrawerRow>
        </div>
      </DrawerSection>

      <DrawerSection title="Timeline">
        <ol className="space-y-1.5">
          {timeline.map((step) => (
            <li key={step.key} className="flex items-center gap-2 text-xs">
              {step.done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Done" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-label="Not yet" />
              )}
              <span className={`flex-1 ${step.done ? 'text-[#101722] font-medium' : 'text-[#667085]'}`}>{step.label}</span>
              <span className="font-mono text-[#667085]">{step.at ? formatEventDateTime(step.at) : '—'}</span>
            </li>
          ))}
        </ol>
      </DrawerSection>

      <DrawerSection title="Parties">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { role: 'Buyer', name: tx.buyerName, email: tx.buyerEmail, phone: tx.buyerPhone },
            { role: 'Seller', name: tx.sellerName, email: tx.sellerEmail, phone: tx.sellerPhone },
          ].map((p) => (
            <div key={p.role} className="rounded-lg border border-[#E5EAF0] p-2.5 text-xs min-w-0">
              <p className="text-[10px] font-mono uppercase text-[#667085]">{p.role}</p>
              <p className="font-semibold text-[#101722] truncate">{p.name || '—'}</p>
              <p className="text-[#667085] truncate">{p.email || '—'}</p>
              <p className="text-[#667085] font-mono">{p.phone || '—'}</p>
            </div>
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Payout">
        {!tx.payoutId ? (
          <p className="text-xs text-[#667085]">No payout yet.</p>
        ) : (
          <div className="rounded-lg border border-[#E5EAF0] px-3 py-1.5">
            <DrawerRow label="Payout code">
              <span className="font-mono">{tx.payoutCode || '—'}</span>
            </DrawerRow>
            <DrawerRow label="Status">
              <Pill tone={payoutTone(tx.payoutStatus)}>{labelOf(PAYOUT_STATUS_LABEL, tx.payoutStatus)}</Pill>
            </DrawerRow>
            <DrawerRow label="Amount">{formatMoney(tx.payoutAmount)}</DrawerRow>
            <DrawerRow label="Bank">{tx.recipientBankCode || '—'}</DrawerRow>
            <DrawerRow label="Account">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-mono">
                  {showAccount ? tx.recipientAccountNumber || '—' : maskAccountNumber(tx.recipientAccountNumber)}
                </span>
                {tx.recipientAccountNumber && (
                  <button
                    type="button"
                    onClick={() => setShowAccount((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F45135] hover:underline cursor-pointer"
                  >
                    {showAccount ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showAccount ? 'Hide' : 'Show'}
                  </button>
                )}
              </span>
            </DrawerRow>
            <DrawerRow label="Account name">{tx.recipientAccountName || '—'}</DrawerRow>
            <DrawerRow label="Bank reference">
              <span className="font-mono">{tx.bankReferenceCode || '—'}</span>
            </DrawerRow>
            <DrawerRow label="Processed at">{tx.payoutProcessedAt ? formatEventDateTime(tx.payoutProcessedAt) : '—'}</DrawerRow>
            <DrawerRow label="Retries">{tx.payoutRetryCount}</DrawerRow>
          </div>
        )}
        {tx.payoutErrorMessage && (
          <div role="alert" className="mt-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="break-words">{tx.payoutErrorMessage}</span>
          </div>
        )}
      </DrawerSection>

      <DrawerSection title="References">
        <div className="rounded-lg border border-[#E5EAF0] px-3 py-1.5">
          <RefRow label="Payment reference" value={tx.paymentReference} />
          <RefRow label="SePay bank transaction" value={tx.bankTransactionReference} />
          <RefRow label="Escrow ID" value={tx.escrowId} />
        </div>
      </DrawerSection>

      {tx.disputeId && (
        <DrawerSection title="Dispute">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs">
            <Pill tone="rose">{labelOf(DISPUTE_STATUS_LABEL, tx.disputeStatus)}</Pill>
            <Link to="/admin/disputes" className="inline-flex items-center gap-1 font-semibold text-[#F45135] hover:underline">
              Open Dispute Console <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </DrawerSection>
      )}
    </AdminDetailDrawer>
  );
};
