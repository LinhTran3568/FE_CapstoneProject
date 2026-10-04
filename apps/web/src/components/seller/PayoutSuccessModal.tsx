import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Building2, CreditCard, User, ExternalLink, X } from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import type { SignalRPayoutPayload } from '../../hooks/usePaymentSignalR';

interface PayoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  payoutData: SignalRPayoutPayload | null;
}

export const PayoutSuccessModal: React.FC<PayoutSuccessModalProps> = ({
  isOpen,
  onClose,
  payoutData,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !payoutData) return null;

  const amount = payoutData.amount || payoutData.netSellerPayout || 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payout-success-title"
    >
      <div className="relative w-full max-w-[380px] bg-[#0C1017] border border-emerald-500/40 rounded-2xl p-5 shadow-2xl shadow-emerald-500/15 text-[#F5F5F5] overflow-hidden transform animate-pop-in">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#FF5A36]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Visual */}
        <div className="text-center space-y-2 pb-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold uppercase tracking-wider mb-1">
              NAPAS 247 • GIẢI NGÂN THÀNH CÔNG
            </div>
            <h2 id="payout-success-title" className="text-lg font-bold font-display text-white tracking-tight">
              Tiền Đã Về Tài Khoản!
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Hệ thống đã chuyển tiền bán vé vào tài khoản của bạn.
            </p>
          </div>
        </div>

        {/* Amount Box */}
        <div className="my-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-0.5">
          <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block">
            Số tiền thực nhận (Đã trừ 3% phí sàn)
          </span>
          <div className="text-2xl font-extrabold font-display text-emerald-300 tracking-tight">
            +{formatVND(amount)}
          </div>
        </div>

        {/* Bank & Transaction Details */}
        <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] font-mono">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Building2 className="w-3 h-3 text-zinc-400" />
              Ngân hàng:
            </span>
            <span className="font-bold text-white">{payoutData.bankCode || 'MB'}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <CreditCard className="w-3 h-3 text-zinc-400" />
              Số tài khoản:
            </span>
            <span className="font-bold text-emerald-300 tracking-wider">
              {payoutData.accountNumber || '—'}
            </span>
          </div>

          {payoutData.accountName && (
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <User className="w-3 h-3 text-zinc-400" />
                Chủ tài khoản:
              </span>
              <span className="font-bold text-white uppercase">{payoutData.accountName}</span>
            </div>
          )}

          {payoutData.bankReference && (
            <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
              <span>Mã giao dịch:</span>
              <span className="text-[10px] text-zinc-300 font-bold">{payoutData.bankReference}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold font-display text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
