import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  score: number; // 0 to 1
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  if (score < 0.3) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
        <ShieldCheck className="w-3.5 h-3.5" /> LOW RISK ({(score * 100).toFixed(0)}%)
      </span>
    );
  }
  if (score < 0.7) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
        <AlertTriangle className="w-3.5 h-3.5" /> MEDIUM RISK ({(score * 100).toFixed(0)}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
      <ShieldAlert className="w-3.5 h-3.5" /> HIGH RISK ({(score * 100).toFixed(0)}%)
    </span>
  );
};
