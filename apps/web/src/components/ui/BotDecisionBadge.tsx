import React from 'react';
import { BotDecision } from '@ticketshield/types';
import { CheckCircle2, AlertOctagon, XCircle } from 'lucide-react';

export const BotDecisionBadge: React.FC<{ decision: BotDecision }> = ({ decision }) => {
  if (decision === 'ALLOWED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ALLOWED
      </span>
    );
  }
  if (decision === 'THROTTLED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
        <AlertOctagon className="w-4 h-4 text-amber-400" /> THROTTLED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
      <XCircle className="w-4 h-4 text-red-400" /> BLOCKED
    </span>
  );
};
