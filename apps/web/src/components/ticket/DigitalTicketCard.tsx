import React from 'react';
import { Ticket } from '@ticketshield/types';
import { Card } from '../ui/Card';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { formatVND, formatVietnameseDate } from '../../utils/formatters';
import { QrCode, ShieldCheck, MapPin, Ticket as TicketIcon } from 'lucide-react';

export const DigitalTicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  return (
    <Card className="bg-gradient-to-br from-navy-800 via-navy-850 to-navy-900 border border-cyan-500/30 overflow-hidden relative shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-navy-750">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <VerifiedBadge text="Vé Đã Xác Thực TicketShield" size="sm" />
            <span className="text-xs text-slate-400 font-mono">ID: {ticket.ticketCode}</span>
          </div>
          <h3 className="text-lg font-bold text-white">{ticket.eventTitle}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Khu vực chỗ ngồi</span>
          <span className="text-base font-extrabold text-cyan-400">{ticket.seatZone} • {ticket.seatNumber || 'Vé đứng'}</span>
        </div>
      </div>

      <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Thời gian diễn ra</span>
          <span className="font-semibold text-slate-200">{formatVietnameseDate(ticket.eventDate)}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Địa điểm</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {ticket.venueName}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Giá vé gốc</span>
          <span className="font-semibold text-slate-200">{formatVND(ticket.originalPrice)}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-dashed border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-navy-950 p-3 rounded-lg border border-navy-800">
          <div className="w-16 h-16 bg-white p-1 rounded flex items-center justify-center">
            <QrCode className="w-14 h-14 text-black" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Mã QR Check-in Động</span>
            <span className="text-xs font-mono text-emerald-400 font-bold block">ACTIVE • Hash Verified</span>
            <span className="text-[10px] text-slate-400 font-mono">{ticket.qrCodeHash.slice(0, 18)}...</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-right">
          <span>Sở hữu bởi: <strong className="text-white">{ticket.ownerName}</strong></span>
          <span className="block text-[10px] text-cyan-400 mt-1">Hệ thống TicketShield AI chuyển nhượng hợp lệ</span>
        </div>
      </div>
    </Card>
  );
};
