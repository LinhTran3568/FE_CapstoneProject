import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, RotateCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PaymentStatusViewProps {
  status: 'SUCCESS' | 'EXPIRED' | 'ERROR';
  ticketTitle?: string;
  orderNumber?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export const PaymentStatusView: React.FC<PaymentStatusViewProps> = ({
  status,
  ticketTitle,
  orderNumber,
  errorMessage,
  onRetry,
  onClose,
}) => {
  if (status === 'SUCCESS') {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-[#ff5722]/20 border-2 border-[#ff5722] flex items-center justify-center shadow-lg shadow-[#ff5722]/30">
            <CheckCircle2 className="w-10 h-10 text-[#ff5722]" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#121824] border border-[#ff5722]/40">
            <ShieldCheck className="w-4 h-4 text-[#ff5722]" />
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#ff5722]/15 border border-[#ff5722]/30 text-[#ff5722] text-xs font-bold uppercase tracking-wider mb-2">
          Payment Verified & Escrow Released
        </span>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Payment Successful!
        </h3>

        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          Your escrow transaction has been verified successfully. Your new digital ticket with secure QR code has been issued directly to your wallet.
        </p>

        {(ticketTitle || orderNumber) && (
          <div className="w-full max-w-md p-4 rounded-xl bg-[#1A2335] border border-[#28354D] text-left mb-6 space-y-2">
            {ticketTitle && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Event Ticket:</span>
                <span className="font-semibold text-white">{ticketTitle}</span>
              </div>
            )}
            {orderNumber && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Order / Transaction Code:</span>
                <span className="font-mono font-bold text-[#ff5722]">{orderNumber}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs pt-2 border-t border-[#28354D]">
              <span className="text-zinc-400">Ticket Status:</span>
              <span className="text-[#ff5722] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff5722] animate-pulse" />
                Active & Ready to Use
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <Link
            to="/my-tickets"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition-all duration-200 active:scale-[0.98]"
          >
            <span>View My Tickets</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-transparent hover:bg-white/10 border border-[#28354D] text-zinc-300 font-semibold text-sm transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/20">
          <Clock className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          Transaction Expired
        </span>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
          Escrow Hold Period (10 Minutes) Has Ended
        </h3>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          The hold duration for this escrow transaction has expired to ensure fair access for other buyers. Please initiate a new order if the ticket is still available.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition-all active:scale-[0.98]"
            >
              <RotateCw className="w-4 h-4" />
              <span>Hold Ticket & Pay Again</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 border border-[#28354D] text-zinc-300 font-semibold text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ERROR
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center mb-4 text-red-400 shadow-lg shadow-red-500/20">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
        Transaction Error
      </span>

      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
        Unable to Complete Transaction
      </h3>

      <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
        {errorMessage || 'An error occurred while connecting to the Escrow payment gateway. Please try again.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition-all active:scale-[0.98]"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/10 border border-[#28354D] text-zinc-300 font-semibold text-sm transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
