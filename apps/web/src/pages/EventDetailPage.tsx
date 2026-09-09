import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEventDetail } from '../hooks/useEvents';
import { formatVND, formatVietnameseDate } from '../utils/formatters';
import { SecurityBadge } from '../components/ui/SecurityBadge';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Button } from '../components/ui/Button';
import { Calendar, MapPin, ShieldCheck, Ticket as TicketIcon, Flame, Store } from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useEventDetail(eventId || 'evt-01');
  const [selectedTicketType, setSelectedTicketType] = useState<string>('tt-vip-01');
  const navigate = useNavigate();

  if (isLoading || !event) {
    return <div className="p-12 text-center text-slate-400">Đang tải thông tin sự kiện...</div>;
  }

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="relative h-80 rounded-3xl overflow-hidden bg-navy-950 border border-navy-750">
        <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <SecurityBadge text="AI Anti-Bot Active Queue Protection" />
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">{event.title}</h1>
            <p className="text-xs md:text-sm text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> {formatVietnameseDate(event.startDate)}
              <span className="mx-2">•</span>
              <MapPin className="w-4 h-4 text-slate-400" /> {event.venue.name}, {event.venue.city}
            </p>
          </div>
          <Link to={`/marketplace?eventId=${event.id}`}>
            <Button variant="outline" className="flex items-center gap-2 text-xs">
              <Store className="w-4 h-4" /> Xem Vé Sang Nhượng Verified
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Detail Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-navy-750 pb-3">Giới thiệu sự kiện</h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-navy-750 pb-3">Đơn vị tổ chức & Quy trình xác thực</h3>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Ban tổ chức chính thức</span>
                <span className="font-bold text-white">{event.organizerName}</span>
              </div>
              <VerifiedBadge text="Tích hợp API BTC Hợp Lệ" />
            </div>
          </div>
        </div>

        {/* Ticket Selector & Primary Purchase Flow */}
        <div className="space-y-6">
          <div className="bg-navy-850 p-6 rounded-2xl border border-cyan-500/30 shadow-glow-cyan space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Chọn Hạng Vé Niêm Yết</h3>
              <Flame className="w-5 h-5 text-red-500 fill-red-500" />
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setSelectedTicketType('tt-vip-01')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedTicketType === 'tt-vip-01'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-navy-750 bg-navy-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">Hạng Vé SVIP - Khu A1</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{formatVND(2800000)}</span>
                </div>
                <span className="text-[11px] text-slate-400 block">Vé đứng sát sân khấu • Còn lại 14 vé</span>
              </div>

              <div
                onClick={() => setSelectedTicketType('tt-gold-02')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedTicketType === 'tt-gold-02'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white'
                    : 'border-navy-750 bg-navy-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">Hạng Vé Vàng - Khu B</span>
                  <span className="text-cyan-400 font-extrabold text-sm">{formatVND(1800000)}</span>
                </div>
                <span className="text-[11px] text-slate-400 block">Vé ngồi tầng 1 • Còn lại 32 vé</span>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-750 space-y-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Số lượng vé:</span>
                <span className="font-bold text-cyan-400">1 Vé</span>
              </div>

              <Button
                onClick={() => navigate(`/checkout/lst-301`)}
                size="lg"
                className="w-full text-sm font-bold shadow-glow-cyan"
              >
                Tiến Hành Đặt Vé (Qua Kiểm Tra AI)
              </Button>

              <p className="text-[11px] text-slate-400 text-center leading-tight">
                Giao dịch được bảo vệ bằng hệ thống phát hiện Bot tự động TicketShield AI Engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
