import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle2, Ticket, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime } from '../../utils/formatters';

interface BundleToasterCardProps {
  listing: MarketplaceListingDto;
  bundleListings?: MarketplaceListingDto[];
  onBuy: (listing: MarketplaceListingDto) => void;
  onViewDetails?: (listing: MarketplaceListingDto) => void;
}

/**
 * Skeuomorphic 2.5D "Ticket Bundle Toaster" Component
 * Thiết kế cỗ máy Terminal cơ khí nhả vé Combo (2-3 vé) từ khe cắm vật lý có chiều sâu Isometric 3D.
 */
export const BundleToasterCard: React.FC<BundleToasterCardProps> = ({
  listing,
  bundleListings,
  onBuy,
  onViewDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Tính toán dữ liệu gói vé
  const effectiveListings = bundleListings && bundleListings.length > 0 ? bundleListings : [listing];
  const ticketCount = Math.max(
    listing.bundleTotalTickets || 0,
    effectiveListings.length,
    3 // mặc định trực quan 3 vé cho hiệu ứng Toaster
  );

  const totalBundlePrice = effectiveListings.length > 1
    ? effectiveListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
    : (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2)
      ? listing.resalePrice * listing.bundleTotalTickets
      : listing.resalePrice;

  const formattedTotalPrice = new Intl.NumberFormat('vi-VN').format(totalBundlePrice);
  const formattedDate = formatEventDateTime(listing.eventStartAt);

  // Danh sách vé con hiển thị trong khe nhả vé
  const ticketCardsData = [
    {
      id: 3,
      code: effectiveListings[2]?.maskedTicketCode || 'AT•••6580',
      seat: effectiveListings[2]?.seatZone || 'Seat C-03',
      color: 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800',
      tilt: '-rotate-[5deg]',
      hoverShift: 'group-hover:translate-x-6 group-hover:-rotate-[7deg]',
      zIndex: 'z-10',
      shadow: 'shadow-md',
      opacity: 'opacity-90',
    },
    {
      id: 2,
      code: effectiveListings[1]?.maskedTicketCode || 'AT•••6579',
      seat: effectiveListings[1]?.seatZone || 'Seat C-02',
      color: 'bg-gradient-to-br from-zinc-100 to-slate-200 text-slate-900',
      tilt: 'rotate-[0deg]',
      hoverShift: 'group-hover:translate-x-4 group-hover:rotate-[1deg]',
      zIndex: 'z-20',
      shadow: 'shadow-lg',
      opacity: 'opacity-95',
    },
    {
      id: 1,
      code: effectiveListings[0]?.maskedTicketCode || 'AT•••6578',
      seat: effectiveListings[0]?.seatZone || 'Seat C-01',
      color: 'bg-gradient-to-br from-white via-slate-50 to-orange-50/50 text-slate-900',
      tilt: 'rotate-[4deg]',
      hoverShift: 'group-hover:translate-x-2 group-hover:rotate-[6deg]',
      zIndex: 'z-30',
      shadow: 'shadow-2xl shadow-black/60',
      opacity: 'opacity-100',
    },
  ];

  return (
    <div
      className="relative w-full py-4 select-none"
      style={{ perspective: '1400px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (onViewDetails) onViewDetails(listing);
        else onBuy(listing);
      }}
    >
      {/* 2.5D Isometric Tilt Wrapper */}
      <div
        className={`group relative w-full h-[225px] sm:h-[235px] cursor-pointer transition-all duration-300 ease-out ${
          isHovered
            ? 'scale-[1.01] -translate-y-1.5'
            : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? 'rotateY(-4deg) rotateX(1deg)'
            : 'rotateY(-8deg) rotateX(2deg)',
        }}
      >
        {/* ================= 1. CHASSIS AMBIENT RIM GLOW & SHADOW ================= */}
        <div
          className="absolute -inset-1 rounded-[38px] bg-gradient-to-r from-cyan-500/20 via-orange-500/20 to-cyan-500/10 blur-xl opacity-60 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none"
          aria-hidden="true"
        />

        {/* ================= 2. MAIN CONSOLE CHASSIS (Skeuomorphic Gunmetal Body) ================= */}
        <div className="relative w-full h-full rounded-[34px] p-2.5 sm:p-3 bg-gradient-to-b from-[#2e3442] via-[#1a1e27] to-[#0e1117] border-t border-white/30 border-l border-white/15 border-b border-black/80 border-r border-black/60 shadow-[0_24px_48px_rgba(0,0,0,0.85),_inset_0_1px_2px_rgba(255,255,255,0.25)] flex items-stretch overflow-visible">

          {/* Screws / Bolts Decor on 4 Corners of the Hardware Frame */}
          <div className="absolute top-2.5 left-3 w-1.5 h-1.5 rounded-full bg-zinc-600 border border-white/20 shadow-inner" />
          <div className="absolute bottom-2.5 left-3 w-1.5 h-1.5 rounded-full bg-zinc-600 border border-white/20 shadow-inner" />
          <div className="absolute top-2.5 right-3 w-1.5 h-1.5 rounded-full bg-zinc-600 border border-white/20 shadow-inner" />
          <div className="absolute bottom-2.5 right-3 w-1.5 h-1.5 rounded-full bg-zinc-600 border border-white/20 shadow-inner" />

          {/* Top Chassis Beveled Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent pointer-events-none" />

          {/* ================= 3. FRONT BEZEL: TWO RECESSED AMOLED SCREENS ================= */}
          <div className="relative z-10 flex-1 grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 mr-[65px] sm:mr-[75px]">

            {/* --- SCREEN 1 (LEFT): EVENT METADATA TERMINAL --- */}
            <div className="relative rounded-2xl bg-[#050608] border border-white/5 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.9),_0_1px_0_rgba(255,255,255,0.05)]">
              {/* Screen Glass Scanline & Reflection */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/40 pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Badges Row */}
              <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                {/* Cyan Pulsating Tier Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-cyan-300">
                    {listing.tierName || 'GA STANDING'}
                  </span>
                </div>

                {/* Orange Glow Bundle Pill */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF5A36]/25 to-orange-500/25 border border-[#FF5A36]/60 shadow-[0_0_12px_rgba(255,90,54,0.3)]">
                  <Layers className="w-3 h-3 text-[#FF5A36]" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-[#FF8A65]">
                    BUNDLE ({ticketCount} VÉ)
                  </span>
                </div>
              </div>

              {/* Event Title & Seat Zone */}
              <div className="relative z-10 my-1 space-y-1">
                <h3 className="text-[14px] sm:text-[15px] font-black text-white tracking-tight leading-snug line-clamp-2 drop-shadow-sm group-hover:text-cyan-200 transition-colors">
                  {listing.eventName}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400/90 font-mono">
                  <Ticket className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[180px]">
                    {listing.seatZone || `Combo ${ticketCount} ghế liền kề`}
                  </span>
                </div>
              </div>

              {/* Timestamp & Venue Footer */}
              <div className="relative z-10 space-y-0.5 text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
                <div className="flex items-center gap-1 truncate">
                  <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{listing.eventVenue}</span>
                </div>
              </div>
            </div>

            {/* --- CENTRAL PHYSICAL HARDWARE DIVIDER --- */}
            <div className="w-3 sm:w-4 flex items-center justify-center relative">
              <div className="w-1.5 h-[80%] rounded-full bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-800 shadow-[0_0_2px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.4)] border border-black/40" />
            </div>

            {/* --- SCREEN 2 (RIGHT): PRICING & CTA TERMINAL --- */}
            <div className="relative rounded-2xl bg-[#050608] border border-white/5 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.9),_0_1px_0_rgba(255,255,255,0.05)]">
              {/* Glass Scanline & Reflection */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/40 pointer-events-none" />
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Top Tag: Masked bundle ID */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>AUTHENTIC</span>
                </div>
                <span className="font-mono text-[9px] text-zinc-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                  ID: {listing.listingId.slice(0, 6)}
                </span>
              </div>

              {/* Centered Price Block */}
              <div className="relative z-10 text-center my-auto py-1">
                <div className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                  TRỌN GÓI ({ticketCount} VÉ)
                </div>
                <div className="text-[20px] sm:text-[22px] font-black text-white tracking-tight leading-tight">
                  <span className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                    {formattedTotalPrice}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-300 ml-1">VND</span>
                </div>
                <div className="text-[9px] font-mono text-emerald-400/80 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Giá niêm yết chuẩn BTC</span>
                </div>
              </div>

              {/* Vibrant Pill CTA Button */}
              <div className="relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewDetails) onViewDetails(listing);
                    else onBuy(listing);
                  }}
                  className="w-full py-2 px-3 rounded-full bg-gradient-to-r from-[#FF5A36] via-[#FF6E40] to-orange-500 hover:from-orange-500 hover:to-[#FF5A36] text-white font-extrabold text-[11px] sm:text-xs tracking-wider shadow-[0_4px_16px_rgba(255,90,54,0.4)] flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  <span>XEM & MUA GÓI</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= 4. MECHANICAL SLOT & TICKET EJECTION MECHANISM ================= */}
          {/* Vị trí mạn phải: Cấu trúc Sandwich 3 lớp */}
          <div className="absolute right-0 top-0 bottom-0 w-[80px] sm:w-[95px] overflow-visible pointer-events-none">

            {/* LAYER 1: Background Slot Cavity (Rãnh khoang cơ khí sâu hút z-0) */}
            <div className="absolute top-4 bottom-4 left-2 w-8 rounded-r-xl bg-[#030406] border-l-2 border-black shadow-[inset_4px_0_12px_rgba(0,0,0,0.98),_inset_0_2px_4px_rgba(0,0,0,0.8)] z-0" />

            {/* Rãnh kim loại bên trong khe nhả vé */}
            <div className="absolute top-5 bottom-5 left-3 w-1 bg-black/80 rounded-full z-0" />

            {/* LAYER 2: Ticket Bundle Stack (Xấp 3 vé xếp lớp z-10 thò ra ngoài) */}
            <div className="absolute top-4 bottom-4 left-2.5 right-[-15px] sm:right-[-25px] flex items-center justify-start overflow-visible z-10">
              {ticketCardsData.map((t, idx) => (
                <div
                  key={t.id}
                  className={`absolute left-0 w-[68px] sm:w-[82px] h-[135px] sm:h-[150px] rounded-xl p-2 flex flex-col justify-between border border-black/15 transition-all duration-300 ease-out ${t.color} ${t.tilt} ${t.hoverShift} ${t.zIndex} ${t.shadow} ${t.opacity}`}
                  style={{
                    transformOrigin: 'left center',
                    left: `${idx * 4}px`,
                  }}
                >
                  {/* Notch cắn góc của cuống vé */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-b-full bg-[#151921] border-b border-black/20" />
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-t-full bg-[#151921] border-t border-black/20" />

                  {/* Header vé */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase text-orange-600">
                      TICKET {t.id}
                    </span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  </div>

                  {/* Vị trí ghế & Barcode */}
                  <div className="my-auto text-center space-y-1">
                    <div className="font-mono text-[9px] font-bold tracking-tight text-slate-800">
                      {t.seat}
                    </div>
                    {/* Giả lập Barcode mini */}
                    <div className="flex items-center justify-center gap-0.5 h-4 opacity-70">
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-[2px] h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-[3px] h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-[2px] h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                    </div>
                  </div>

                  {/* Footer mã vé */}
                  <div className="font-mono text-[7px] text-center font-bold text-slate-600 truncate border-t border-slate-300/60 pt-0.5">
                    {t.code}
                  </div>
                </div>
              ))}
            </div>

            {/* LAYER 3: Front Retaining Lip / Bezel Flap (Gờ vành kim loại mặt trước kẹp gốc vé z-20) */}
            <div className="absolute top-2.5 bottom-2.5 left-0 w-3 sm:w-3.5 rounded-r-2xl bg-gradient-to-r from-[#2a2f3d] via-[#1f2430] to-[#12151c] border-r border-t border-b border-white/20 shadow-[2px_0_6px_rgba(0,0,0,0.7),_inset_1px_1px_1px_rgba(255,255,255,0.3)] z-20">
              {/* Highlight khe máy kim loại */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0.5 w-0.5 h-16 bg-cyan-400/40 rounded-full blur-[0.5px]" />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
