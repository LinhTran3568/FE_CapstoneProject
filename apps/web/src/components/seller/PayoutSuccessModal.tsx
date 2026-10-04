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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payout-success-title"
    >
      <div className="relative w-full max-w-lg bg-[#0A0D14] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/20 text-[#F5F5F5] overflow-hidden transform animate-pop-in">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#FF5A36]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Visual */}
        <div className="text-center space-y-3 pb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>

          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5">
              NAPAS 247 • GIẢI NGÂN THÀNH CÔNG
            </div>
            <h2 id="payout-success-title" className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              Tiền Đã Về Tài Khoản!
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Hệ thống TicketShield AI vừa giải ngân tự động tiền bán vé vào tài khoản ngân hàng của bạn.
            </p>
          </div>
        </div>

        {/* Amount Box */}
        <div className="my-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
            Số tiền thực nhận (Net Payout)
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold font-display text-emerald-300 tracking-tight">
            +{formatVND(amount)}
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80 block">
            Đã trừ phí bảo hộ sàn 3% (Đã miễn phí chuyển khoản)
          </span>
        </div>

        {/* Bank & Transaction Details */}
        <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-mono">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              Ngân hàng nhận:
            </span>
            <span className="font-bold text-white">{payoutData.bankCode || 'MB'}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
              Số tài khoản:
            </span>
            <span className="font-bold text-emerald-300 tracking-wider">
              {payoutData.accountNumber || '—'}
            </span>
          </div>

          {payoutData.accountName && (
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Chủ tài khoản:
              </span>
              <span className="font-bold text-white uppercase">{payoutData.accountName}</span>
            </div>
          )}

          {payoutData.bankReference && (
            <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
              <span>Mã tham chiếu ngân hàng:</span>
              <span className="text-[11px] text-zinc-300 font-bold">{payoutData.bankReference}</span>
            </div>
          )}

          {payoutData.escrowId && (
            <div className="flex items-center justify-between text-zinc-400">
              <span>Mã Escrow:</span>
              <span className="text-[11px] text-zinc-400">#{payoutData.escrowId.slice(0, 8).toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold font-display text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
          >
            Xác Nhận & Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
