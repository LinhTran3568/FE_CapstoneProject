import React from 'react';
import { Lock } from 'lucide-react';
import { EscrowStatus } from '@ticketshield/types';

export const EscrowBadge: React.FC<{ status: EscrowStatus }> = ({ status }) => {
  const styles: Record<EscrowStatus, string> = {
    PENDING: 'bg-slate-700/50 text-slate-300 border-slate-600',
    FUNDED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    RELEASED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    REFUNDED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    DISPUTED: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const labels: Record<EscrowStatus, string> = {
    PENDING: 'Chờ nạp Escrow',
    FUNDED: 'Escrow đã khóa tiền',
    RELEASED: 'Đã giải ngân cho người bán',
    REFUNDED: 'Đã hoàn tiền cho người mua',
    DISPUTED: 'Đang khiếu nại',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${styles[status]}`}
    >
      <Lock className="w-3 h-3" /> {labels[status]}
    </span>
  );
};
