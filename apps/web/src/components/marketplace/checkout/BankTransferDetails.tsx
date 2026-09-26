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
      {/* 1. EXACT TRANSFER REFERENCE CARD (CRITICAL FINTECH HIGHLIGHT) */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/[0.05] p-3.5 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold tracking-wider uppercase text-amber-300">
              Nội dung chuyển khoản chính xác
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
            Bắt buộc chính xác
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0B0F19] border border-amber-500/30 shadow-inner">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-base sm:text-lg font-extrabold tracking-widest text-amber-300 select-all break-all">
              {paymentReference || '—'}
            </div>
          </div>
          <CopyButton
            value={paymentReference}
            label="Sao chép"
            variant="default"
            size="md"
            className="shrink-0 font-semibold"
          />
        </div>
      </div>

      {/* 2. BANK ACCOUNT & BENEFICIARY CARD */}
      <div className="rounded-xl border border-[#293548] bg-[#111827] p-3.5 space-y-3">
        {/* Row 1: Bank & Beneficiary (No clipping on small screens) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[#293548]/70">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ngân hàng</span>
            </div>
            <div className="text-sm sm:text-base font-semibold text-zinc-100 break-words">
              {bankName}
            </div>
            {bankBin && (
              <span className="text-xs font-mono text-zinc-400 block mt-0.5">BIN: {bankBin}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Chủ tài khoản</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-zinc-100 tracking-wide uppercase break-words">
              {accountName || 'TICKETSHIELD ESCROW'}
            </div>
          </div>
        </div>

        {/* Row 2: Account Number (High prominence) */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#151C2B] border border-[#293548]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Số tài khoản (STK)</span>
            </div>
            <div className="font-mono text-base sm:text-lg font-bold text-white tracking-wider tabular-nums select-all truncate">
              {accountNumber || '—'}
            </div>
          </div>
          <CopyButton
            value={accountNumber}
            label="Sao chép"
            variant="default"
            size="md"
            className="shrink-0"
          />
        </div>

        {/* Row 3: Transfer Amount (High prominence) */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#151C2B] border border-[#293548]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider mb-0.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Số tiền cần chuyển</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-lg sm:text-xl font-extrabold text-emerald-400 tabular-nums">
                {formattedAmount}
              </span>
              <span className="text-xs font-bold text-emerald-500/80">{currency}</span>
            </div>
          </div>
          <CopyButton
            value={amount ? amount.toString() : '0'}
            label="Sao chép"
            variant="default"
            size="md"
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
};
