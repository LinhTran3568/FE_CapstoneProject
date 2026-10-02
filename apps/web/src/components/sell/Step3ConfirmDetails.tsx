import React from 'react';

export interface Step3ConfirmDetailsProps {
  ticketCode: string;
  faceValue: number;
  priceCeiling: number;
  markupPercent: number;
  onContinue: () => void;
}

export const Step3ConfirmDetails: React.FC<Step3ConfirmDetailsProps> = ({
  ticketCode,
  faceValue,
  priceCeiling,
  markupPercent,
  onContinue,
}) => {
  return (
    <div key={3} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 pt-2">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold font-display text-white">
          Ticket Verified &amp; Safely Locked
        </h2>
        <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
          Your ticket has been verified as authentic and is ready for pricing.
        </p>
      </div>

      {/* Ticket Card Preview */}
      <div className="group relative bg-[#0A0D12]/90 backdrop-blur-md border border-white/[0.08] hover:border-white/[0.16] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
        {/* Holographic Shimmer Light Sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-ticket-shimmer" />
        </div>

        {/* Concert image banner */}
        <div className="relative h-44 overflow-hidden">
          <img
            src="/images/landing/featured-1.jpg"
            alt="Concert Ticket"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/50 to-transparent" />
        </div>

        {/* Ticket body */}
        <div className="p-6 space-y-5">
          {/* Header row: label + verified status */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                OFFICIAL DIGITAL TICKET PASS
              </span>
              <h3 className="text-2xl font-extrabold font-display text-white group-hover:text-[#FF7252] transition-colors duration-300 leading-tight">
                Anh Trai Say Hi Concert 2026
              </h3>
            </div>

            {/* Verified status with pulsing radar ping effect */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A36] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-[#FF5A36] whitespace-nowrap">
                VERIFIED · LOCKED
              </span>
            </div>
          </div>

          {/* Info row: ticket code + location */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.07] bg-[#05070A] border border-white/[0.07] group-hover:border-white/[0.15] rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="p-3.5 space-y-1 hover:bg-white/[0.02] transition-colors duration-200">
              <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                ORIGINAL TICKET CODE
              </span>
              <p className="font-bold text-white font-mono text-sm tracking-wide group-hover:text-[#FF5A36] transition-colors duration-200">
                {ticketCode}
              </p>
            </div>
            <div className="p-3.5 pl-4 space-y-1 hover:bg-white/[0.02] transition-colors duration-200">
              <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                VENUE
              </span>
              <p className="font-bold text-white text-sm">Van Hanh Mall Stadium, TP.HCM</p>
            </div>
          </div>

          {/* Price cap row */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.07] bg-[#05070A] border border-white/[0.07] group-hover:border-white/[0.15] rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="p-4 space-y-1.5 hover:bg-white/[0.02] transition-colors duration-200">
              <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                FACE VALUE
              </span>
              <p className="text-lg font-bold font-display text-white">
                {faceValue.toLocaleString('vi-VN')} VND
              </p>
            </div>
            <div className="p-4 pl-5 space-y-1.5 hover:bg-white/[0.02] transition-colors duration-200">
              <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                MAX RESALE PRICE
              </span>
              <p className="text-lg font-bold font-display text-white">
                {priceCeiling.toLocaleString('vi-VN')} VND
              </p>
              <span className="text-[10px] text-[#8F96A3] font-mono block leading-tight">
                {markupPercent > 0
                  ? `Face value + ${markupPercent}% event markup`
                  : 'Per TicketShield policy'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Glowing CTA Button with Shimmer Sheen */}
      <button
        onClick={onContinue}
        className="group relative w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-2xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 cursor-pointer"
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
        <span>Continue</span>
      </button>
    </div>
  );
};
