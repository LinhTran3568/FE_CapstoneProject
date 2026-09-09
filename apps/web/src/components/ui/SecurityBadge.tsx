import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SecurityBadge: React.FC<{ text?: string }> = ({ text = 'Bảo vệ bởi TicketShield AI' }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
      <span>{text}</span>
    </div>
  );
};
