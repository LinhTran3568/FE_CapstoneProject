import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const VerifiedBadge: React.FC<{ text?: string; size?: 'sm' | 'md' }> = ({
  text = 'Verified by TicketShield',
  size = 'md',
}) => {
  const isSm = size === 'sm';
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-semibold ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
      }`}
    >
      <CheckCircle2 className={`${isSm ? 'w-3 h-3' : 'w-4 h-4'} text-emerald-400`} />
      <span>{text}</span>
    </div>
  );
};
