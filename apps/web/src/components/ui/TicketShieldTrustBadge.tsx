import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, RefreshCw, Info, ChevronRight, CheckCircle2, Zap } from 'lucide-react';

export interface TicketShieldTrustBadgeProps {
  variant?: 'compact' | 'full' | 'banner';
  isPrivate?: boolean;
  showTooltipOnHover?: boolean;
  className?: string;
  onExplainClick?: () => void;
}

export const TicketShieldTrustBadge: React.FC<TicketShieldTrustBadgeProps> = ({
  variant = 'full',
  isPrivate = false,
  showTooltipOnHover = true,
  className = '',
  onExplainClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (onExplainClick) {
      onExplainClick();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`relative inline-block ${className}`} ref={popoverRef}>
        <button
          type="button"
          onClick={togglePopover}
          onMouseEnter={() => showTooltipOnHover && setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/80 hover:border-emerald-400 transition-all duration-200 shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-pointer group"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
          <span>TicketShield Verified</span>
          {isPrivate && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-purple-950/80 text-purple-300 border border-purple-500/30 rounded text-[10px] uppercase font-mono">
              Private Sale
            </span>
          )}
          <Info className="w-3 h-3 text-emerald-500/70 group-hover:text-emerald-300 ml-0.5" />
        </button>

        {/* Popover */}
        {isOpen && (
          <div className="absolute left-0 bottom-full mb-2 w-72 p-3.5 bg-[#0B0F17]/95 border border-emerald-500/40 rounded-xl shadow-2xl backdrop-blur-xl z-50 text-left text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>TicketShield Dual Guarantee</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">100% Safe</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-emerald-500/10 rounded border border-emerald-500/30 text-emerald-400 mt-0.5">
                  <Lock className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-semibold text-white">24-Hour Funds Protection</div>
                  <div className="text-gray-300 text-[11px] leading-tight mt-0.5">
                    Your payment is safely held. The seller only receives payout after your new official ticket is confirmed.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1 bg-cyan-500/10 rounded border border-cyan-500/30 text-cyan-400 mt-0.5">
                  <RefreshCw className="w-3 h-3" />
                </div>
                <div>
                  <div className="font-semibold text-white">Official Organizer Re-issuance</div>
                  <div className="text-gray-300 text-[11px] leading-tight mt-0.5">
                    The seller's old ticket is invalidated, and the organizer issues a brand new official ticket in your name.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`relative p-4 bg-gradient-to-r from-emerald-950/80 via-[#0B0F17] to-cyan-950/80 border border-emerald-500/30 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden ${className}`}>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-sm sm:text-base">TicketShield Verified Transaction</span>
                {isPrivate && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-xs font-mono font-semibold">
                    Private Resale
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                100% 24-hour buyer protection &amp; direct organizer re-issuance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePopover}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all duration-200"
          >
            <span>Guarantee Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Default 'full' variant
  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <div
        onClick={togglePopover}
        className="p-3.5 bg-[#0B0F17]/90 border border-emerald-500/30 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-400/60 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
              TicketShield Verified Ticket
            </span>
          </div>
          {isPrivate ? (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md text-[11px] font-mono">
              Private Resale
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-[11px] font-mono">
              Public Marketplace
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mt-2 pt-2 border-t border-gray-800">
          <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>24-Hour Protection</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
            <Zap className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Direct Re-issuance 100%</span>
          </div>
        </div>
      </div>

      {/* Detail Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 p-4 bg-[#0B0F17]/95 border border-emerald-500/40 rounded-xl shadow-2xl backdrop-blur-xl z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Exclusive Fan Guarantee</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white font-mono text-xs px-1.5 py-0.5 rounded bg-gray-800"
            >
              ESC
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. 24-Hour Buyer Funds Protection</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-[11px]">
                Your payment is held safely for 24 hours. The seller only receives payout after event organizers confirm your new ticket.
              </p>
            </div>

            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300 mb-1">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Official Organizer Direct Re-issuance</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-[11px]">
                TicketShield connects directly with event organizers. The seller's previous barcode is canceled, and you receive a fresh official ticket under your name.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
