import React, { useState } from 'react';
import { Calendar, MapPin, Ticket, ChevronLeft, ChevronRight, ArrowRight, XCircle } from 'lucide-react';
import { CardStack } from '../ui/card-stack';
import { formatEventDateTime } from '../../utils/formatters';

export interface Step3Ticket {
  code: string;
  originalPrice: number;
  priceCeiling?: number;
  seatZone?: string;
  tierName?: string;
  eventStartAt?: string;
  eventName?: string;
  eventVenue?: string;
}

export interface Step3ConfirmDetailsProps {
  tickets: Step3Ticket[];
  markupPercent?: number;
  onContinue: () => void;
  onCancel?: () => void;
  isCancelling?: boolean;
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

const getZoneStyle = (tierName: string) => {
  const lower = (tierName || '').toLowerCase();
  if (lower.includes('svip')) {
    return {
      badge: 'bg-black/75 border border-amber-400/50 text-white backdrop-blur-md shadow-sm',
      dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    };
  }
  if (lower.includes('vip b') || lower.includes('vip-b')) {
    return {
      badge: 'bg-black/75 border border-orange-400/50 text-white backdrop-blur-md shadow-sm',
      dot: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
    };
  }
  if (lower.includes('fanzone') || lower.includes('fan zone')) {
    return {
      badge: 'bg-black/75 border border-rose-400/50 text-white backdrop-blur-md shadow-sm',
      dot: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
    };
  }
  if (lower.includes('ga') || lower.includes('standard')) {
    return {
      badge: 'bg-black/75 border border-sky-400/50 text-white backdrop-blur-md shadow-sm',
      dot: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
    };
  }
  return {
    badge: 'bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-sm',
    dot: 'bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]',
  };
};

interface TicketCardItemProps {
  ticket: Step3Ticket;
  eventName: string;
  eventVenue: string;
  eventStartAt?: string;
  organizerName?: string;
}

const TicketCardItem: React.FC<TicketCardItemProps> = ({
  ticket,
  eventName,
  eventVenue,
  eventStartAt,
  organizerName = 'VieON Entertainment',
}) => {
  const resolvedEventName = ticket.eventName || eventName;
  const resolvedVenue = ticket.eventVenue || eventVenue;
  const resolvedTier = ticket.tierName || 'GA STANDING';
  const zoneStyle = getZoneStyle(resolvedTier);
  const backdropUrl = getEventBackdrop(resolvedEventName);
  const formattedDate = ticket.eventStartAt
    ? formatEventDateTime(ticket.eventStartAt)
    : eventStartAt
      ? formatEventDateTime(eventStartAt)
      : '05 Nov 2026, 02:11';

  return (
    <div className="group relative isolate w-full select-none transition-transform duration-200 ease-out hover:-translate-y-1">
      {/* ================= MASKED TICKET CONTAINER (Cutout Notches via CSS Mask) ================= */}
      <div
        className="relative w-full min-h-[200px] grid grid-cols-[65%_35%] items-stretch rounded-2xl border border-white/10 group-hover:border-[#FF5A36] shadow-[0_8px_24px_rgba(0,0,0,0.7)] group-hover:shadow-[0_12px_36px_rgba(255,90,54,0.2)] transition-[border-color,box-shadow] duration-200 ease-out overflow-hidden"
        style={{
          WebkitMaskImage:
            'radial-gradient(circle 14px at 65% 0px, transparent 13.5px, black 14px), radial-gradient(circle 14px at 65% 100%, transparent 13.5px, black 14px)',
          WebkitMaskComposite: 'destination-in',
          maskImage:
            'radial-gradient(circle 14px at 65% 0px, transparent 13.5px, black 14px), radial-gradient(circle 14px at 65% 100%, transparent 13.5px, black 14px)',
          maskComposite: 'intersect',
        }}
      >
        {/* ================= LEFT SECTION: MAIN BODY (65% width) ================= */}
        <div className="relative w-full h-full rounded-l-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 bg-[#0a0c10]">
          {/* Live Concert Backdrop */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src={backdropUrl}
              alt={resolvedEventName}
              className="w-full h-full object-cover object-center contrast-125 saturate-110 transition-transform duration-300 ease-out group-hover:scale-105 opacity-70"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/landing/concert.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#0a0c10]/85 to-[#0b0d13]/95" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />
          </div>

          {/* Top: Tier Badge con nhộng có dot neon */}
          <div className="relative z-10 flex items-center justify-between">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md shrink-0 ${zoneStyle.badge}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${zoneStyle.dot}`} />
              <span className="text-xs font-bold tracking-wider uppercase text-white truncate max-w-[150px]">
                {resolvedTier}
              </span>
            </div>
          </div>

          {/* Middle & Bottom Info */}
          <div className="relative z-10 space-y-2 mt-4">
            {/* Tên sự kiện */}
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug drop-shadow-sm text-white group-hover:text-[#FF5A36] transition-colors duration-200 line-clamp-2">
              {resolvedEventName}
            </h3>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-zinc-300 pt-0.5">
              {/* Vị trí ghế */}
              {ticket.seatZone && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-200">{ticket.seatZone}</span>
                </div>
              )}

              {/* Ngày & Giờ */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-medium text-zinc-300">{formattedDate}</span>
              </div>

              {/* Địa điểm */}
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-medium text-zinc-300 truncate max-w-[180px]">{resolvedVenue}</span>
              </div>

              {/* Nền tảng phát hành */}
              <div className="flex items-center gap-1.5 shrink-0 text-zinc-400">
                <span>BTC:</span>
                <span className="font-medium text-white">{organizerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SECTION: TICKET STUB (35% width) ================= */}
        <div className="relative w-full h-full bg-[#e2e8f0] rounded-r-2xl overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 paper-texture shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

          {/* Stub Top: Mã vé pill */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="px-2 py-0.5 rounded bg-slate-300/80 border border-slate-400/50">
              <span className="font-mono text-xs font-bold tracking-wider text-slate-800">
                {ticket.code}
              </span>
            </div>

            {/* Barcode Graphic */}
            <div className="flex items-center gap-[2px] h-4.5 opacity-80" title="Barcode vé">
              <span className="w-[2.5px] h-full bg-slate-900" />
              <span className="w-[1px] h-full bg-slate-900" />
              <span className="w-[3px] h-full bg-slate-900" />
              <span className="w-[1px] h-full bg-slate-900" />
              <span className="w-[2px] h-full bg-slate-900" />
              <span className="w-[3.5px] h-full bg-slate-900" />
              <span className="w-[1.5px] h-full bg-slate-900" />
              <span className="w-[1px] h-full bg-slate-900" />
              <span className="w-[2.5px] h-full bg-slate-900" />
            </div>
          </div>

          {/* Stub Middle: Pricing Block (Chỉ hiển thị giá gốc vé, không trần giá) */}
          <div className="my-auto py-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
              PRICE
            </span>
            <div className="flex items-baseline">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-none">
                {ticket.originalPrice.toLocaleString('vi-VN')}
              </span>
              <span className="ml-1 text-xs font-bold text-slate-700">VND</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1.5">
              Organizer Verified Price
            </div>
          </div>

          {/* Stub Bottom: Để trống sạch sẽ không nút thừa */}
          <div className="h-2" />
        </div>
      </div>

      {/* ================= PERFORATION NOTCH STROKES & TEAR LINE (Placed outside mask for seamless contour) ================= */}
      {/* Top Notch Contour Border (bo theo vết cắt bán nguyệt mép trên) */}
      <div className="absolute left-[65%] top-0 -translate-x-1/2 w-7 h-3.5 z-20 pointer-events-none">
        <svg viewBox="0 0 28 14" className="w-full h-full block overflow-visible">
          <path
            d="M 0,0.5 A 14,14 0 0,0 28,0.5"
            fill="none"
            className="stroke-white/10 group-hover:stroke-[#FF5A36] transition-colors duration-200 ease-out"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Vertical Perforated Tear Line */}
      <div className="absolute left-[65%] -ml-[1px] top-[14px] bottom-[14px] -translate-x-1/2 w-[2px] z-20 pointer-events-none flex flex-col items-center justify-center">
        <svg className="h-full w-[2px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 2 202">
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="202"
            className="stroke-[#FF5A36]/45 group-hover:stroke-[#FF5A36] group-hover:drop-shadow-[0_0_6px_rgba(255,90,54,0.75)] transition-all duration-200 ease-out"
            strokeWidth="2"
            strokeDasharray="9 5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom Notch Contour Border (bo theo vết cắt bán nguyệt mép dưới) */}
      <div className="absolute left-[65%] bottom-0 -translate-x-1/2 w-7 h-3.5 z-20 pointer-events-none">
        <svg viewBox="0 0 28 14" className="w-full h-full block overflow-visible">
          <path
            d="M 0,13.5 A 14,14 0 0,1 28,13.5"
            fill="none"
            className="stroke-white/10 group-hover:stroke-[#FF5A36] transition-colors duration-200 ease-out"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};

export const Step3ConfirmDetails: React.FC<Step3ConfirmDetailsProps> = ({
  tickets,
  onContinue,
  onCancel,
  isCancelling = false,
  eventName = 'Official Concert Event',
  eventVenue = 'Sân vận động Quốc gia Mỹ Đình',
  eventStartAt,
  organizerName = 'VieON Entertainment',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isCombo = tickets.length > 1;
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tickets.length - 1, 0));

  return (
    <div key={3} className="animate-fade-in-up max-w-2xl mx-auto space-y-4 pt-1 text-center">
      {/* Tiêu đề ngắn gọn */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
          Thông tin vé
        </h2>
      </div>

      {/* Hiển thị dạng STACK khi có nhiều vé (giống Step 2 OTP) */}
      {isCombo ? (
        <div className="space-y-4 pt-1">
          {/* CardStack theo phong cách so le */}
          <CardStack
            items={tickets.map((t) => ({ id: t.code, ...t }))}
            activeIndex={safeIndex}
            onActiveIndexChange={setActiveIndex}
            layoutMode="staggered"
            offset={42}
            containerHeight={`${(tickets.length - 1) * 42 + 215}px`}
            renderCard={(ticket, isTop, index) => {
              if (isTop) {
                return (
                  <TicketCardItem
                    ticket={ticket}
                    eventName={eventName}
                    eventVenue={eventVenue}
                    eventStartAt={eventStartAt}
                    organizerName={organizerName}
                  />
                );
              }

              // Thẻ phía sau: header tinh gọn để click trồi lên
              return (
                <div
                  onClick={() => setActiveIndex(index)}
                  className="h-11 px-4 rounded-xl bg-[#0A0D12] border border-white/15 hover:border-[#FF5A36]/60 flex items-center justify-between text-xs cursor-pointer shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400">Vé {index + 1}:</span>
                    <span className="font-mono font-bold text-white group-hover:text-[#FF5A36] transition-colors">
                      {ticket.code}
                    </span>
                  </div>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {ticket.originalPrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              );
            }}
          />

          {/* Cụm Paging trực quan chuẩn xác giống hệt bên OTP */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {/* Mũi tên lùi vé trước */}
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeIndex === 0}
              aria-label="Vé trước"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/15 bg-[#0A0D14] hover:bg-white/[0.08] hover:border-white/25 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Cụm Paging: Vé X/Y + Dots rõ ràng, to và dễ nhìn */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#0A0D14] border border-white/15 text-sm font-semibold text-white/90 shadow-sm">
              <span className="tracking-wide">
                Vé {safeIndex + 1}/{tickets.length}
              </span>
              <div className="flex items-center gap-2 pl-1">
                {tickets.map((t, idx) => {
                  const isActive = idx === safeIndex;

                  return (
                    <button
                      key={t.code}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'w-6 h-2 rounded-full bg-[#FF5A36] shadow-sm shadow-[#FF5A36]/40'
                          : 'w-2 h-2 rounded-full bg-white/30 hover:bg-white/50'
                      }`}
                      title={`Vé ${idx + 1}: ${t.code}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Mũi tên tiến vé kế tiếp */}
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.min(tickets.length - 1, prev + 1))}
              disabled={safeIndex === tickets.length - 1}
              aria-label="Vé kế tiếp"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/15 bg-[#0A0D14] hover:bg-white/[0.08] hover:border-white/25 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Vé đơn: 1 chiếc TicketCard chuẩn mực */
        <div className="pt-1">
          {tickets[0] && (
            <TicketCardItem
              ticket={tickets[0]}
              eventName={eventName}
              eventVenue={eventVenue}
              eventStartAt={eventStartAt}
              organizerName={organizerName}
            />
          )}
        </div>
      )}

      {/* Nút to dưới cùng duy nhất để chuyển tiếp */}
      <div className="pt-3 space-y-3">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-14 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Tiếp tục thiết lập giá bán</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Nút hủy phiên mở khóa vé ở Bước 3 */}
        {onCancel && (
          <div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="text-xs sm:text-sm font-medium text-white/50 hover:text-rose-400 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-30 py-1.5 px-3 rounded-lg hover:bg-rose-500/10 hover:border hover:border-rose-500/20"
            >
              <XCircle className="w-4 h-4" />
              <span>{isCancelling ? 'Đang hủy...' : 'Không bán nữa'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
