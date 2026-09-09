import React from 'react';
import { Escrow } from '@ticketshield/types';
import { Card } from '../ui/Card';
import { EscrowBadge } from '../ui/EscrowBadge';
import { formatVND, formatVietnameseDate } from '../../utils/formatters';
import { Lock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const EscrowTracker: React.FC<{ escrow: Escrow; onConfirmEntry?: () => void }> = ({
  escrow,
  onConfirmEntry,
}) => {
  return (
    <Card className="border border-cyan-500/30 bg-navy-850 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Bảo Vệ Thanh Toán Escrow Smart Contract</h4>
            <p className="text-xs text-slate-400">Mã hợp đồng khóa tiền: {escrow.id}</p>
          </div>
        </div>
        <EscrowBadge status={escrow.status} />
      </div>

      <div className="bg-navy-900 border border-navy-750 p-4 rounded-xl space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Số tiền bảo vệ trong Escrow:</span>
          <span className="font-bold text-cyan-400 text-sm">{formatVND(escrow.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Tự động giải ngân sau sự kiện:</span>
          <span className="text-slate-200">{formatVietnameseDate(escrow.autoReleaseAt)}</span>
        </div>
      </div>

      {escrow.status === 'FUNDED' && onConfirmEntry && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl">
          <div>
            <span className="text-xs font-bold text-cyan-400 block">Đã vào cổng sự kiện thành công?</span>
            <span className="text-[11px] text-slate-300">Xác nhận để giải ngân tiền cho người bán.</span>
          </div>
          <button
            onClick={onConfirmEntry}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-glow-emerald transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Xác nhận check-in thành công
          </button>
        </div>
      )}
    </Card>
  );
};
