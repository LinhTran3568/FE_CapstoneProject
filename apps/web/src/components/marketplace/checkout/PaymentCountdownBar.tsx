import React from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface PaymentCountdownBarProps {
  formattedTime: string;
  progressPercentage: number;
  isUrgent: boolean;
  isExpired: boolean;
  statusColor: 'emerald' | 'amber' | 'red';
  className?: string;
}

export const PaymentCountdownBar: React.FC<PaymentCountdownBarProps> = ({
  formattedTime,
  progressPercentage,
  isUrgent,
  isExpired,
  statusColor,
  className = '',
}) => {
  const getProgressColor = () => {
    switch (statusColor) {
      case 'red':
        return 'bg-gradient-to-r from-red-600 to-rose-500';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-amber-400';
      case 'emerald':
      default:
        return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    }
  };

  const getBadgeStyle = () => {
    switch (statusColor) {
      case 'red':
        return 'bg-red-500/15 border-red-500/40 text-red-400';
      case 'amber':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
      case 'emerald':
      default:
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    }
  };

  return (
    <div
      className={`px-3.5 py-2 rounded-xl bg-[#0E1422] border border-[#232F45] relative overflow-hidden flex flex-col justify-center gap-1.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Time Remaining
          </span>
          {isUrgent && !isExpired && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              Expiring Soon
            </span>
          )}
        </div>

        {/* Tabular Numerals Countdown Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold tracking-wider tabular-nums transition-colors duration-200 ${getBadgeStyle()}`}
        >
          {isExpired ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>00:00 (EXPIRED)</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="tabular-nums">{formattedTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Real-time Progress Bar */}
      <div className="w-full h-1 bg-[#172033] rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
          style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
        />
      </div>
    </div>
  );
};
