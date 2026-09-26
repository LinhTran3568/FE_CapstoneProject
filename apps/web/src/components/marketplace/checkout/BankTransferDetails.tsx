import React from 'react';
import { Building2, User, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { CopyButton } from '../../ui/CopyButton';

export interface BankTransferDetailsProps {
  bankBin?: string;
  bankName?: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  paymentReference: string;
  currency?: string;
  className?: string;
}

export const BankTransferDetails: React.FC<BankTransferDetailsProps> = ({
  bankBin = '970422',
  bankName = 'MB Bank (Ngân hàng Quân Đội)',
  accountNumber,
  accountName,
  amount,
  paymentReference,
  currency = 'VND',
  className = '',
}) => {
  const formattedAmount = amount ? amount.toLocaleString('vi-VN') : '0';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* 1. EXACT TRANSFER REFERENCE CARD */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/[0.05] p-3 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-bold tracking-wider uppercase text-amber-300">
              Transfer Description
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
            Required
          </span>
        </div>

        <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[#0B0F19] border border-amber-500/30 shadow-inner">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-base font-extrabold tracking-widest text-amber-300 select-all truncate">
              {paymentReference || '—'}
            </div>
          </div>
          <CopyButton
            value={paymentReference}
            label="Copy"
            variant="default"
            size="sm"
            className="shrink-0 font-semibold"
          />
        </div>
      </div>

      {/* 2. BANK ACCOUNT & BENEFICIARY CARD */}
      <div className="rounded-xl border border-[#293548] bg-[#111827] p-3 space-y-2.5">
        {/* Row 1: Bank & Beneficiary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2.5 border-b border-[#293548]/70">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
              <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Bank</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-zinc-100 break-words leading-snug">
              {bankName}
            </div>
            {bankBin && (
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">BIN: {bankBin}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
              <User className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Account Holder</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-zinc-100 tracking-wide uppercase break-words leading-snug">
              {accountName || 'TICKETSHIELD ESCROW'}
            </div>
          </div>
        </div>

        {/* Row 2: Account Number */}
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-[#151C2B] border border-[#293548]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
              <CreditCard className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Account Number</span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-white tracking-wider tabular-nums select-all truncate">
              {accountNumber || '—'}
            </div>
          </div>
          <CopyButton
            value={accountNumber}
            label="Copy"
            variant="default"
            size="sm"
            className="shrink-0"
          />
        </div>

        {/* Row 3: Transfer Amount */}
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-[#151C2B] border border-[#293548]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
              <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Amount</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-base sm:text-lg font-extrabold text-emerald-400 tabular-nums">
                {formattedAmount}
              </span>
              <span className="text-[11px] font-bold text-emerald-500/80">{currency}</span>
            </div>
          </div>
          <CopyButton
            value={amount ? amount.toString() : '0'}
            label="Copy"
            variant="default"
            size="sm"
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
};
