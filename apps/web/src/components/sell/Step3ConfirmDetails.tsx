import React, { useState } from 'react';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardStack } from '../ui/card-stack';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';
import { formatEventDateTime } from '../../utils/formatters';

export interface Step3Ticket {
  code: string;
  originalPrice: number;
  priceCeiling: number;
  seatZone?: string;
  tierName?: string;
  eventStartAt?: string;
  eventName?: string;
  eventVenue?: string;
}

export interface Step3ConfirmDetailsProps {
  tickets: Step3Ticket[];
  markupPercent: number;
  onContinue: () => void;
  eventName?: string;
  eventVenue?: string;
  eventStartAt?: string;
  organizerName?: string;
}

const getEventBackdrop = (name: string): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('say hi') || lower.includes('anh trai')) {
    return '/images/landing/hero-concert.jpg';
  }
  if (lower.includes('mỹ tâm') || lower.includes('tri âm')) {
    return '/images/landing/featured-1.jpg';
  }
  if (lower.includes('rave') || lower.includes('festival') || lower.includes('edm')) {
    return '/images/landing/festival.jpg';
  }
  if (lower.includes('derby') || lower.includes('league') || lower.includes('viettel') || lower.includes('sports')) {
    return '/images/landing/sports.jpg';
  }
  if (lower.includes('kịch') || lower.includes('ngày xửa') || lower.includes('theater')) {
    return '/images/landing/theater.jpg';
  }
  return '/images/landing/concert.jpg';
};

/** Render một chiếc vé Ticket Pass sạch bóng, không badge rác */
interface TicketPassViewProps {
  ticket: Step3Ticket;
  eventName: string;
  eventVenue: string;
  eventStartAt?: string;
}

const TicketPassView: React.FC<TicketPassViewProps> = ({
  ticket,
  eventName,
  eventVenue,
  eventStartAt,
}) => {
  const resolvedEventName = ticket.eventName || eventName;
  const resolvedVenue = ticket.eventVenue || eventVenue;
  const backdropUrl = getEventBackdrop(resolvedEventName);
  const formattedDate = ticket.eventStartAt
    ? formatEventDateTime(ticket.eventStartAt)
    : eventStartAt
      ? formatEventDateTime(eventStartAt)
      : 'Thông báo bởi BTC';

  return (
    <div className="relative isolate w-full flex flex-col sm:flex-row items-stretch rounded-2xl bg-[#0a0c10] border border-white/15 overflow-hidden shadow-2xl">
      {/* ================= THÂN VÉ (TRÁI - 65%) ================= */}
      <div className="relative w-full sm:w-[65%] min-h-[190px] flex flex-col justify-between p-4 sm:p-5 bg-[#0a0c10] overflow-hidden">
        {/* Live Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={backdropUrl}
            alt={resolvedEventName}
            className="w-full h-full object-cover object-center opacity-50"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/landing/concert.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#0a0c10]/85 to-[#0b0d13]/95" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/40" />
        </div>

        {/* Tên sự kiện & Hạng vé */}
        <div className="relative z-10 space-y-1.5">
          <span className="text-xs font-mono font-medium text-zinc-400">
            {ticket.tierName || 'Vé chính thức'}
          </span>
          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight line-clamp-2">
            {resolvedEventName}
          </h3>

          {/* Vị trí ghế (nếu có) */}
          {ticket.seatZone && (
            <div className="pt-0.5">
              {(() => {
                const adj = detectSeatAdjacency(ticket.seatZone);
                return (
                  <SeatAdjacencyBadge
                    result={adj}
                    variant="glass"
                    size="xs"
                    showSubtext={true}
                  />
                );
              })()}
            </div>
          )}
        </div>

        {/* Thời gian & Địa điểm */}
        <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate max-w-[200px]">{resolvedVenue}</span>
          </div>
        </div>
      </div>

      {/* ================= ĐƯỜNG XÉ CUỐNG VÉ ================= */}
      {/* Top Notch Cutout */}
      <div className="hidden sm:block absolute left-[65%] -top-[1px] -translate-x-1/2 w-6 h-3 z-30 pointer-events-none">
        <svg viewBox="0 0 24 12" className="w-full h-full block overflow-visible" fill="none">
          <path d="M 0,-1 L 24,-1 L 24,0 A 12,12 0 0,1 0,0 Z" fill="#05070A" />
          <path d="M 0,0.5 A 12,12 0 0,0 24,0.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>
      </div>

      {/* Vertical Perforated Tear Line */}
      <div className="hidden sm:flex absolute left-[65%] top-3 bottom-3 -translate-x-1/2 w-[1px] z-20 pointer-events-none border-r border-dashed border-white/20" />

      {/* Bottom Notch Cutout */}
      <div className="hidden sm:block absolute left-[65%] -bottom-[1px] -translate-x-1/2 w-6 h-3 z-30 pointer-events-none">
        <svg viewBox="0 0 24 12" className="w-full h-full block overflow-visible" fill="none">
          <path d="M 0,11.5 A 12,12 0 0,1 24,11.5 L 24,12.5 L 0,12.5 Z" fill="#05070A" />
          <path d="M 0,11.5 A 12,12 0 0,1 24,11.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>
      </div>

      {/* Horizontal divider on mobile */}
      <div className="sm:hidden w-full border-t border-dashed border-white/20" />

      {/* ================= CUỐNG VÉ (PHẢI - 35%) ================= */}
      <div className="relative w-full sm:w-[35%] bg-[#e2e8f0] rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl overflow-hidden flex flex-col justify-between p-4 paper-texture shadow-inner">
        {/* Subtle shadow on tear line */}
        <div className="hidden sm:block absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

        {/* Mã vé & Barcode */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
            {ticket.code}
          </span>
          <div className="flex items-center gap-[2px] h-4 opacity-80 shrink-0">
            <span className="w-[2px] h-full bg-slate-900" />
            <span className="w-[1px] h-full bg-slate-900" />
            <span className="w-[3px] h-full bg-slate-900" />
            <span className="w-[1px] h-full bg-slate-900" />
            <span className="w-[2px] h-full bg-slate-900" />
            <span className="w-[3px] h-full bg-slate-900" />
            <span className="w-[1px] h-full bg-slate-900" />
            <span className="w-[2px] h-full bg-slate-900" />
          </div>
        </div>

        {/* Giá gốc & Trần giá */}
        <div className="my-2 space-y-2">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Giá gốc
            </span>
            <span className="font-mono font-bold text-slate-700 text-xs sm:text-sm">
              {ticket.originalPrice.toLocaleString('vi-VN')} VND
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-300">
            <span className="text-[10px] font-bold text-[#FF5A36] uppercase tracking-wider block">
              Trần giá tối đa
            </span>
            <span className="text-base sm:text-lg font-bold font-display text-slate-900">
              {ticket.priceCeiling.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        {/* Chú thích tối giản */}
        <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-300/80">
          Vé hợp lệ
        </div>
      </div>
    </div>
  );
};

export const Step3ConfirmDetails: React.FC<Step3ConfirmDetailsProps> = ({
  tickets,
  onContinue,
  eventName = 'Official Concert Event',
  eventVenue = 'Sân vận động Quốc gia Mỹ Đình',
  eventStartAt,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isCombo = tickets.length > 1;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tickets.length - 1, 0));

  return (
    <div key={3} className="animate-fade-in-up max-w-2xl mx-auto space-y-4 pt-1 text-center">
      {/* Tiêu đề ngắn gọn, không subtext rườm rà, không trust badge */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
          Thông tin vé
        </h2>
      </div>

      {/* Hiển thị dạng STACK khi có nhiều vé */}
      {isCombo ? (
        <div className="space-y-3 pt-1">
          {/* Thanh điều hướng vé */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-zinc-400 font-medium">
              Vé {safeIndex + 1} / {tickets.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={safeIndex === 0}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Vé trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))}
                disabled={safeIndex === tickets.length - 1}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Vé tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CardStack theo phong cách so le giống Step 2 */}
          <CardStack
            items={tickets.map((t) => ({ id: t.code, ...t }))}
            activeIndex={safeIndex}
            onActiveIndexChange={setActiveIndex}
            layoutMode="staggered"
            offset={40}
            containerHeight={`${(tickets.length - 1) * 40 + 260}px`}
            renderCard={(ticket, isTop, index) => {
              if (isTop) {
                return (
                  <TicketPassView
                    ticket={ticket}
                    eventName={eventName}
                    eventVenue={eventVenue}
                    eventStartAt={eventStartAt}
                  />
                );
              }

              // Thẻ phía sau: header tinh gọn để click đổi vé
              return (
                <div
                  onClick={() => setActiveIndex(index)}
                  className="h-10 px-4 rounded-xl bg-[#0A0D12] border border-white/10 hover:border-white/25 flex items-center justify-between text-xs cursor-pointer shadow-md transition-all"
                >
                  <span className="font-mono text-zinc-400">
                    Vé {index + 1}: <strong className="text-white">{ticket.code}</strong>
                  </span>
                  <span className="text-zinc-500 font-mono">
                    Trần giá: {ticket.priceCeiling.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              );
            }}
          />
        </div>
      ) : (
        /* Vé đơn: hiển thị duy nhất 1 chiếc Ticket Pass thanh thoát */
        <div className="pt-1">
          {tickets[0] && (
            <TicketPassView
              ticket={tickets[0]}
              eventName={eventName}
              eventVenue={eventVenue}
              eventStartAt={eventStartAt}
            />
          )}
        </div>
      )}

      {/* Nút Tiếp tục đặt giá */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-13 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          Tiếp tục thiết lập giá bán
        </button>
      </div>
    </div>
  );
};
