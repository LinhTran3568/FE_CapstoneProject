import React, { useState } from 'react';
import {
  Link2,
  MapPin,
  Sparkles,
  Users,
  AlertCircle,
  Ticket,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  SeatAdjacencyResult,
  SeatInfoInput,
} from '@ticketshield/types';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';

export type SeatAdjacencyBadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type SeatAdjacencyBadgeVariant = 'pill' | 'glass' | 'solid' | 'glow' | 'subtle';

export interface SeatAdjacencyBadgeProps {
  /** Input seats: can be array of strings, seat objects, DTOs, or a single string */
  seats?: Array<string | SeatInfoInput | null | undefined> | string;
  /** Pre-calculated detection result if available */
  result?: SeatAdjacencyResult;
  /** Visual size */
  size?: SeatAdjacencyBadgeSize;
  /** Visual styling variant */
  variant?: SeatAdjacencyBadgeVariant;
  /** Whether to show the subtitle details (e.g. "Cùng hàng G" or "Zone A & B") */
  showSubtext?: boolean;
  /** Whether to render leading icon */
  showIcon?: boolean;
  /** Whether to enable hover tooltip */
  showTooltip?: boolean;
  /** Optional custom CSS class */
  className?: string;
  /** Optional click handler */
  onClick?: (e: React.MouseEvent) => void;
}

export const SeatAdjacencyBadge: React.FC<SeatAdjacencyBadgeProps> = ({
  seats,
  result: propResult,
  size = 'sm',
  variant = 'glass',
  showSubtext = true,
  showIcon = true,
  showTooltip = true,
  className = '',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Compute or reuse detection result
  const analysis: SeatAdjacencyResult = React.useMemo(() => {
    if (propResult) return propResult;
    if (seats !== undefined) return detectSeatAdjacency(seats);
    return detectSeatAdjacency([]);
  }, [propResult, seats]);

  // If single seat and not explicitly requested with showSubtext, we still render cleanly
  const { status, isAdjacent, badgeText, badgeSubtext, liquidityNote, reason, parsedSeats } = analysis;

  // Icon mapping
  const renderIcon = () => {
    if (!showIcon) return null;

    const iconSizeClass = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-4.5 h-4.5',
    }[size];

    switch (status) {
      case 'ADJACENT':
        return <Sparkles className={`${iconSizeClass} text-emerald-400 shrink-0 animate-pulse`} />;
      case 'DIFFERENT_LOCATIONS':
        return <AlertCircle className={`${iconSizeClass} text-amber-400 shrink-0`} />;
      case 'GENERAL_ADMISSION':
        return <Users className={`${iconSizeClass} text-cyan-400 shrink-0`} />;
      case 'SINGLE_SEAT':
      default:
        return <Ticket className={`${iconSizeClass} text-zinc-400 shrink-0`} />;
    }
  };

  // Size styling tokens
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2',
    lg: 'text-sm px-3.5 py-2 gap-2.5',
  }[size];

  // Tone styling based on status and variant
  const getVariantStyles = () => {
    if (status === 'ADJACENT') {
      // Emerald / Green
      switch (variant) {
        case 'solid':
          return 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 border border-emerald-400/50';
        case 'glow':
          return 'bg-emerald-950/80 text-emerald-300 border border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.35)] backdrop-blur-md';
        case 'subtle':
          return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'glass':
        case 'pill':
        default:
          return 'bg-black/75 backdrop-blur-md text-emerald-300 border border-emerald-500/50 shadow-sm hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      }
    }

    if (status === 'DIFFERENT_LOCATIONS') {
      // Amber / Orange
      switch (variant) {
        case 'solid':
          return 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 border border-amber-400/50';
        case 'glow':
          return 'bg-amber-950/80 text-amber-300 border border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.35)] backdrop-blur-md';
        case 'subtle':
          return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'glass':
        case 'pill':
        default:
          return 'bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/50 shadow-sm hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]';
      }
    }

    if (status === 'GENERAL_ADMISSION') {
      // Cyan / Blue
      switch (variant) {
        case 'solid':
          return 'bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/20 border border-cyan-400/50';
        case 'glow':
          return 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.35)] backdrop-blur-md';
        case 'subtle':
          return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
        case 'glass':
        case 'pill':
        default:
          return 'bg-black/75 backdrop-blur-md text-cyan-300 border border-cyan-500/50 shadow-sm hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]';
      }
    }

    // Single seat / Unknown / Neutral
    return 'bg-black/75 backdrop-blur-md text-zinc-300 border border-white/15 shadow-sm hover:border-white/30';
  };

  return (
    <div
      className="relative inline-flex items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={onClick}
        className={`inline-flex items-center font-medium rounded-full transition-all duration-200 ${
          onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'
        } ${sizeClasses} ${getVariantStyles()} ${className}`}
      >
        {/* Pulsing Dot indicator for high liquidity adjacent seats */}
        {status === 'ADJACENT' && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </span>
        )}

        {renderIcon()}

        {/* Primary Title */}
        <span className="whitespace-nowrap font-bold text-[10.5px] sm:text-[11px] tracking-tight">{badgeText}</span>

        {/* Secondary Subtitle / Row info */}
        {showSubtext && badgeSubtext && (
          <span className="text-[10px] font-normal normal-case opacity-80 whitespace-nowrap hidden sm:inline-block border-l border-current/20 pl-1.5 ml-0.5">
            {badgeSubtext}
          </span>
        )}
      </div>

      {/* ================= INTERACTIVE SMART TOOLTIP ================= */}
      {showTooltip && isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 z-50 w-72 p-3 bg-[#0B0F17]/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in-up text-left pointer-events-none">
          {/* Top Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[#0B0F17] border-r border-b border-white/20 rotate-45" />

          <div className="space-y-2">
            {/* Header with status icon */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {isAdjacent ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-xs font-bold text-white font-display">
                {badgeText} {badgeSubtext ? `• ${badgeSubtext}` : ''}
              </span>
            </div>

            {/* Explanation & Reason */}
            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              {reason}
            </p>

            {/* Seat breakdown if available */}
            {parsedSeats.length > 1 && (
              <div className="bg-black/50 rounded-xl p-2 border border-white/5 space-y-1">
                <div className="text-[10px] uppercase font-mono font-bold text-zinc-400 tracking-wider">
                  Chi tiết vị trí ({parsedSeats.length} vé):
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsedSeats.map((seat, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-200"
                    >
                      {seat.row ? `Hàng ${seat.row} - ` : ''}
                      {seat.seatNumber !== null ? `Ghế ${seat.seatNumber}` : seat.zone || `Vé #${idx + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Liquidity / Transparency Note */}
            <div className="flex items-start gap-1.5 pt-1 text-[10px] text-zinc-400 border-t border-white/10">
              <Info className="w-3 h-3 text-[#FF5A36] shrink-0 mt-0.5" />
              <span className="leading-tight">{liquidityNote}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatAdjacencyBadge;
