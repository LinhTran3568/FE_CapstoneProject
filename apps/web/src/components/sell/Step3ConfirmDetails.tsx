import React from 'react';
import { Calendar, MapPin, CheckCircle2, Ticket, Layers, Building2, ArrowRight } from 'lucide-react';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';
import { formatEventDateTime } from '../../utils/formatters';

export interface Step3Ticket {
  /** Mã vé gốc đã được BTC xác thực và khóa. */
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

/** Tự động chọn ảnh nền sân khấu ca nhạc dựa trên tên sự kiện */
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

/** Dynamic Zone styling with vibrant neon accents */
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
    badge: 'bg-black/75 border border-[#FF5A36]/40 text-white backdrop-blur-md shadow-sm',
    dot: 'bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]',
  };
};

export const Step3ConfirmDetails: React.FC<Step3ConfirmDetailsProps> = ({
  tickets,
  markupPercent,
  onContinue,
  eventName = 'Official Concert Event',
  eventVenue = 'Sân vận động Quốc gia Mỹ Đình',
  eventStartAt,
  organizerName = 'Ban tổ chức',
}) => {
  const isCombo = tickets.length > 1;
  const totalFaceValue = tickets.reduce((sum, t) => sum + t.originalPrice, 0);
  const totalCeiling = tickets.reduce((sum, t) => sum + t.priceCeiling, 0);
  const formattedDate = eventStartAt ? formatEventDateTime(eventStartAt) : '20:00 · Thông báo bởi BTC';

  return (
    <div key={3} className="animate-fade-in-up max-w-3xl mx-auto space-y-6 pt-2">
      {/* Step Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          </span>
          <span>Xác thực thành công · Đã khóa vé an toàn</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
          {isCombo ? `Đã xác thực ${tickets.length} vé trong gói` : 'Vé chính chủ đã được xác thực'}
        </h2>
        <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-md mx-auto">
          {isCombo
            ? `Tất cả ${tickets.length} vé đã qua kiểm duyệt bảo mật OTP với Ban tổ chức và sẵn sàng để định giá đăng bán.`
            : 'Vé đã được Ban tổ chức kiểm tra hợp lệ, bảo vệ an toàn và sẵn sàng để định giá niêm yết.'}
        </p>
      </div>

      {/* Danh sách thẻ vé dạng Ticket Pass chân thực */}
      <div className="space-y-6">
        {tickets.map((ticket, index) => {
          const resolvedEventName = ticket.eventName || eventName;
          const resolvedVenue = ticket.eventVenue || eventVenue;
          const resolvedTier = ticket.tierName || (isCombo ? `Hạng vé #${index + 1}` : 'VIP ACCESS');
          const zoneStyle = getZoneStyle(resolvedTier);
          const backdropUrl = getEventBackdrop(resolvedEventName);

          return (
            <div
              key={ticket.code}
              className="group relative isolate w-full min-h-[220px] flex flex-col sm:flex-row items-stretch rounded-3xl bg-[#0a0c10] border border-white/10 hover:border-[#FF5A36] shadow-[0_16px_48px_rgba(0,0,0,0.8)] hover:shadow-[0_20px_50px_rgba(255,90,54,0.15)] transition-all duration-300 overflow-hidden"
            >
              {/* ================= LEFT SECTION: MAIN BODY (65% width) ================= */}
              <div className="relative w-full sm:w-[65%] min-h-[200px] flex flex-col justify-between p-5 sm:p-6 bg-[#0a0c10] overflow-hidden">
                {/* Live Concert Backdrop with Gradient Overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                  <img
                    src={backdropUrl}
                    alt={resolvedEventName}
                    className="w-full h-full object-cover object-center contrast-125 saturate-110 transition-transform duration-500 ease-out group-hover:scale-105 opacity-60"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/landing/concert.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#0a0c10]/85 to-[#0b0d13]/95" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/50" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
                </div>

                {/* Left Top: Badges */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Tier badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border backdrop-blur-md shrink-0 ${zoneStyle.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${zoneStyle.dot}`} />
                      <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white truncate max-w-[130px]">
                        {resolvedTier}
                      </span>
                    </div>

                    {/* Combo index badge */}
                    {isCombo && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5A36]/20 border border-[#FF5A36]/60 text-[#FF8A65] text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase backdrop-blur-md">
                        <Layers className="w-3 h-3 text-[#FF5A36]" />
                        <span>Vé #{index + 1} / {tickets.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Verified check badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VERIFIED · KHÓA AN TOÀN</span>
                  </div>
                </div>

                {/* Left Middle: Event Title & Seat Adjacency */}
                <div className="relative z-10 my-3 space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight group-hover:text-[#FF7252] transition-colors duration-200 line-clamp-2">
                    {resolvedEventName}
                  </h3>

                  {/* Seat Zone Badge */}
                  {ticket.seatZone && (
                    <div className="flex items-center gap-2 pt-0.5">
                      {(() => {
                        const adj = detectSeatAdjacency(ticket.seatZone);
                        return (
                          <SeatAdjacencyBadge
                            result={adj}
                            variant="glass"
                            size="sm"
                            showSubtext={true}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Left Bottom: Event Meta Info */}
                <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-300 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                    <span className="font-medium text-white">{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium text-zinc-200 truncate max-w-[200px]">{resolvedVenue}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-medium text-zinc-300">{organizerName}</span>
                  </div>
                </div>
              </div>

              {/* ================= PERFORATION JUNCTION, NOTCHES & VERTICAL TEAR LINE ================= */}
              {/* Top Notch Cutout (Desktop) */}
              <div className="hidden sm:block absolute left-[65%] -top-[1px] -translate-x-1/2 w-7 h-[15px] z-30 pointer-events-none">
                <svg viewBox="0 0 28 15" className="w-full h-full block overflow-visible" fill="none">
                  <path d="M 0,-1 L 28,-1 L 28,0 A 14,14 0 0,1 0,0 Z" fill="#07090E" />
                  <path
                    d="M 0,0.5 A 14,14 0 0,0 28,0.5"
                    fill="none"
                    className="stroke-white/15 group-hover:stroke-[#FF5A36] transition-colors duration-200"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Vertical Perforated Tear Line (Desktop) */}
              <div className="hidden sm:flex absolute left-[65%] -ml-[1px] top-[14px] bottom-[14px] -translate-x-1/2 w-[2px] z-20 pointer-events-none flex-col items-center justify-center">
                <svg className="h-full w-[2px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 2 202">
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="202"
                    className="stroke-[#FF5A36]/60 group-hover:stroke-[#FF5A36] group-hover:drop-shadow-[0_0_6px_rgba(255,90,54,0.75)] transition-all duration-200"
                    strokeWidth="2"
                    strokeDasharray="8 5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Bottom Notch Cutout (Desktop) */}
              <div className="hidden sm:block absolute left-[65%] -bottom-[1px] -translate-x-1/2 w-7 h-[15px] z-30 pointer-events-none">
                <svg viewBox="0 0 28 15" className="w-full h-full block overflow-visible" fill="none">
                  <path d="M 0,14.5 A 14,14 0 0,1 28,14.5 L 28,15.5 L 0,15.5 Z" fill="#07090E" />
                  <path
                    d="M 0,14.5 A 14,14 0 0,1 28,14.5"
                    fill="none"
                    className="stroke-white/15 group-hover:stroke-[#FF5A36] transition-colors duration-200"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Horizontal Seam Divider on Mobile */}
              <div className="sm:hidden w-full border-t-2 border-dashed border-[#27272A] relative" />

              {/* ================= RIGHT SECTION: TICKET STUB (35% width) ================= */}
              <div className="relative w-full sm:w-[35%] bg-[#e2e8f0] rounded-b-3xl sm:rounded-b-none sm:rounded-r-3xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 paper-texture shadow-inner">
                {/* Subtle paper fold shadow on the left */}
                <div className="hidden sm:block absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />

                {/* Stub Top: Ticket Code pill & Barcode */}
                <div className="flex items-center justify-between gap-2">
                  <div className="px-2 py-0.5 rounded bg-slate-300/80 border border-slate-400/50">
                    <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                      {ticket.code}
                    </span>
                  </div>

                  {/* Realistic Barcode Graphic */}
                  <div className="flex items-center gap-[2px] h-4.5 opacity-85 shrink-0" title="Barcode vé gốc">
                    <span className="w-[2.5px] h-full bg-slate-900" />
                    <span className="w-[1px] h-full bg-slate-900" />
                    <span className="w-[3px] h-full bg-slate-900" />
                    <span className="w-[1px] h-full bg-slate-900" />
                    <span className="w-[2px] h-full bg-slate-900" />
                    <span className="w-[3.5px] h-full bg-slate-900" />
                    <span className="w-[1px] h-full bg-slate-900" />
                    <span className="w-[2px] h-full bg-slate-900" />
                    <span className="w-[1px] h-full bg-slate-900" />
                    <span className="w-[2.5px] h-full bg-slate-900" />
                  </div>
                </div>

                {/* Stub Middle: Pricing Block */}
                <div className="my-auto py-2 space-y-2">
                  {/* Giá gốc ban tổ chức */}
                  <div>
                    <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase block">
                      GIÁ GỐC BAN TỔ CHỨC
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {ticket.originalPrice.toLocaleString('vi-VN')} VND
                    </span>
                  </div>

                  {/* Giá trần tối đa */}
                  <div className="pt-1.5 border-t border-slate-300">
                    <span className="text-[9px] font-bold tracking-wider text-[#FF5A36] uppercase block">
                      GIÁ TRẦN NIÊM YẾT TỐI ĐA
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black font-display text-slate-900 leading-none">
                        {ticket.priceCeiling.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs font-bold text-slate-700">VND</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono block mt-0.5">
                      {markupPercent > 0 ? `Tối đa +${markupPercent}% theo chính sách` : 'Chuẩn giá niêm yết'}
                    </span>
                  </div>
                </div>

                {/* Stub Bottom: Authenticity stamp */}
                <div className="pt-2 border-t border-slate-300/80 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                  <span className="font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    ✓ Vé gốc hợp lệ
                  </span>
                  <span className="text-slate-500 uppercase tracking-widest text-[9px]">OFFICIAL PASS</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box nếu là gói combo nhiều vé */}
      {isCombo && (
        <div className="grid grid-cols-2 divide-x divide-white/10 bg-[#0A0D12]/90 border border-white/10 rounded-3xl overflow-hidden shadow-xl p-5">
          <div className="space-y-1 pr-4">
            <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
              TỔNG GIÁ GỐC ({tickets.length} VÉ)
            </span>
            <p className="text-lg sm:text-xl font-bold font-mono text-white">
              {totalFaceValue.toLocaleString('vi-VN')} VND
            </p>
          </div>
          <div className="space-y-1 pl-4">
            <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-wider block">
              TỔNG TRẦN GIÁ GÓI TỐI ĐA
            </span>
            <p className="text-lg sm:text-xl font-black font-display text-[#FF5A36]">
              {totalCeiling.toLocaleString('vi-VN')} VND
            </p>
          </div>
        </div>
      )}

      {/* Nút Tiếp tục chuyển sang Bước 4 (Đặt giá) */}
      <button
        type="button"
        onClick={onContinue}
        className="w-full h-14 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-2xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Tiếp tục thiết lập giá bán</span>
        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};
