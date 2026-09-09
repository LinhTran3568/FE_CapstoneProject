import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { EscrowTracker } from '../components/escrow/EscrowTracker';
import { DigitalTicketCard } from '../components/ticket/DigitalTicketCard';
import { MOCK_TICKETS } from '@ticketshield/api-client';
import { MOCK_ESCROWS } from '@ticketshield/api-client';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../stores/uiStore';
import { CheckCircle2, Ticket, AlertTriangle, ArrowRight } from 'lucide-react';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ord-8801';
  const { showToast } = useUIStore();

  const [escrowState, setEscrowState] = useState(MOCK_ESCROWS[0]);

  const handleConfirmEntry = () => {
    setEscrowState({
      ...escrowState,
      status: 'RELEASED',
      releasedAt: new Date().toISOString(),
    });
    showToast('Đã xác nhận vào cổng thành công! Tiền Escrow đã giải ngân cho người bán.', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="bg-navy-850 p-8 rounded-3xl border border-emerald-500/40 shadow-glow-emerald text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Thanh Toán & Nạp Escrow Thành Công!</h1>
        <p className="text-sm text-slate-300">Mã đơn hàng: <strong className="font-mono text-cyan-400">{orderId}</strong></p>
      </div>

      {/* Escrow State Tracker Component */}
      <EscrowTracker escrow={escrowState} onConfirmEntry={handleConfirmEntry} />

      {/* Digital Ticket */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-cyan-400" /> Vé Điện Tử Động Của Bạn
        </h3>
        <DigitalTicketCard ticket={MOCK_TICKETS[0]} />
      </div>

      {/* Entry Failed / File Dispute Action */}
      <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Gặp sự cố không quét được vé tại cổng?
          </h4>
          <p className="text-xs text-slate-400 mt-1">Mở khiếu nại ngay để yêu cầu Ban quản trị giữ tiền Escrow và hoàn trả.</p>
        </div>
        <Link to="/disputes">
          <Button variant="outline" size="sm" className="text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
            Tạo Khiếu Nại Escrow
          </Button>
        </Link>
      </div>
    </div>
  );
};
