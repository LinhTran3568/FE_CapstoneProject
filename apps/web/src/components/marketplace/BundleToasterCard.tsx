import React, { useState } from 'react';
import { Calendar, MapPin, CheckCircle2, Ticket } from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime } from '../../utils/formatters';

interface BundleToasterCardProps {
  listing: MarketplaceListingDto;
  bundleListings?: MarketplaceListingDto[];
  onBuy: (listing: MarketplaceListingDto) => void;
  onViewDetails?: (listing: MarketplaceListingDto) => void;
}

/**
 * Skeuomorphic 2.5D "Ticket Bundle Toaster" UI Component
 * Tái hiện chính xác 100% cỗ máy phần cứng Unibody 3D theo thiết kế nguyên bản:
 * - Khối máy nguyên khối với góc nhìn 3/4 Isometric Perspective.
 * - Viền đèn LED Neon Tube màu kem ấm (Warm Ivory) bo quanh toàn bộ mặt trước.
 * - Mặt trước thụt sâu chứa 2 màn hình AMOLED tách biệt.
 * - Mặt hông phải có hốc khe cơ khí (Mechanical Slot) kẹp chặt xấp vé.
 * - Xấp 3 vé (1 vé đen + 2 vé trắng có barcode) cắm sâu và nhô dài ra ngoài khe cắm.
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
    3
  );

  const totalBundlePrice = effectiveListings.length > 1
    ? effectiveListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
    : (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2)
      ? listing.resalePrice * listing.bundleTotalTickets
      : listing.resalePrice;

  const formattedTotalPrice = new Intl.NumberFormat('vi-VN').format(totalBundlePrice);
  const formattedDate = formatEventDateTime(listing.eventStartAt);

  const maskedCode = listing.maskedTicketCode || 'AT*******99';

  return (
    <div
      className="relative w-full py-4 px-1 select-none flex items-center justify-center"
      style={{ perspective: '1600px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (onViewDetails) onViewDetails(listing);
        else onBuy(listing);
      }}
    >
      {/* 2.5D Isometric Tilt Wrapper */}
      <div
        className={`group relative w-full max-w-[620px] h-[225px] sm:h-[235px] cursor-pointer transition-all duration-300 ease-out ${
          isHovered ? '-translate-y-1.5' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? 'rotateY(-10deg) rotateX(1deg)'
            : 'rotateY(-14deg) rotateX(2deg)',
        }}
      >
        {/* ================= 1. AMBIENT FLOOR CONTACT SHADOW ================= */}
        <div
          className="absolute -bottom-5 left-6 right-10 h-10 bg-black/80 blur-xl rounded-full transform -skew-x-12 pointer-events-none transition-all duration-300"
          style={{ opacity: isHovered ? 0.95 : 0.75 }}
          aria-hidden="true"
        />

        {/* ================= 2. THE 3D UNIBODY MACHINE CHASSIS ================= */}
        <div className="relative w-full h-full flex items-stretch">

          {/* --- MAIN MACHINE HOUSING (FRONT BEZEL WITH WARM IVORY LED GLOW) --- */}
          <div className="relative flex-1 h-full rounded-[30px] p-[5px] bg-gradient-to-br from-[#404756] via-[#2f3542] to-[#1e222b] shadow-[0_25px_50px_rgba(0,0,0,0.85),_inset_0_1px_2px_rgba(255,255,255,0.35)] flex items-stretch">

            {/* Warm Ivory LED Tube Border (Viền đèn neon sáng màu kem ấm bo quanh mặt trước) */}
            <div className="relative w-full h-full rounded-[26px] p-[4px] bg-[#f2eee3] shadow-[0_0_14px_rgba(255,248,225,0.45),_inset_0_0_8px_rgba(255,248,225,0.3)] flex items-stretch">

              {/* Recessed Dark Metal Bezel Frame */}
              <div className="relative w-full h-full rounded-[22px] p-2 sm:p-2.5 bg-gradient-to-b from-[#2b303c] via-[#1f232c] to-[#15181f] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] flex items-stretch gap-2.5">

                {/* ---------------- SCREEN 1: LEFT EVENT AMOLED DISPLAY ---------------- */}
                <div className="relative flex-[1.25] h-full rounded-2xl bg-[#060709] border border-white/5 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.95)]">
                  {/* Subtle Screen Glare */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/50 pointer-events-none" />

                  {/* Badges Row */}
                  <div className="relative z-10 flex items-center gap-1.5 flex-wrap">
                    {/* Cyan Indicator Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-200">
                        {listing.tierName || 'GA STANDING'}
                      </span>
                    </div>

                    {/* Orange Glow Pill Badge */}
                    <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#f95721] text-white text-[10px] font-black tracking-wider uppercase shadow-[0_2px_8px_rgba(249,87,33,0.4)]">
                      BUNDLE ({ticketCount} TICKETS)
                    </div>
                  </div>

                  {/* Event Title */}
                  <div className="relative z-10 my-0.5 space-y-1">
                    <h3 className="text-[15px] sm:text-[16px] font-black text-white tracking-tight leading-snug line-clamp-2">
                      {listing.eventName}
                    </h3>

                    {/* Seat Zone & Date Meta */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-[#f98838]">
                      <div className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-[#f98838] shrink-0" />
                        <span>{listing.seatZone || 'GA Standing Zone 2'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-400 font-normal">
                        <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Venue Location */}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{listing.eventVenue}</span>
                    </div>
                  </div>

                  {/* Verification Footer */}
                  <div className="relative z-10 flex items-center gap-3 text-[10px] text-zinc-400 border-t border-white/5 pt-1.5">
                    <div className="truncate">
                      <span>BTC: </span>
                      <span className="text-zinc-200 font-medium">{listing.organizerName || 'VieON Entertainment'}</span>
                    </div>
                    {listing.sellerFullName && (
                      <div className="flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-zinc-300">Seller: {listing.sellerFullName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ---------------- SCREEN 2: RIGHT PRICING & CTA TERMINAL ---------------- */}
                <div className="relative flex-1 h-full rounded-2xl bg-[#060709] border border-white/5 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden shadow-[inset_0_3px_10px_rgba(0,0,0,0.95)]">
                  {/* Subtle Screen Glare */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/50 pointer-events-none" />

                  {/* Ticket Masked ID Tag */}
                  <div className="relative z-10 flex items-center justify-start">
                    <span className="px-2 py-0.5 rounded-md bg-[#131720] border border-white/10 font-mono text-[10px] font-bold text-zinc-300">
                      {maskedCode}
                    </span>
                  </div>

                  {/* Price Block */}
                  <div className="relative z-10 my-auto py-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      PRICE
                    </div>
                    <div className="text-[22px] sm:text-[24px] font-black text-white tracking-tight leading-tight">
                      {formattedTotalPrice}{' '}
                      <span className="text-[12px] font-bold text-zinc-300">VND</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      Organizer Verified Price
                    </div>
                  </div>

                  {/* Pill CTA Button */}
                  <div className="relative z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewDetails) onViewDetails(listing);
                        else onBuy(listing);
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-[#f95721] hover:bg-[#e64a17] text-white font-extrabold text-[12px] tracking-wider uppercase shadow-[0_4px_14px_rgba(249,87,33,0.45)] flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer"
                    >
                      <span>XEM & MUA</span>
                      <span className="text-sm font-black transition-transform duration-150 group-hover:translate-x-1">→</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ================= 3. RIGHT FLANK (MẶT HÔNG 3D CỦA CỖ MÁY) ================= */}
          <div
            className="relative w-[38px] sm:w-[44px] h-full rounded-r-[32px] -ml-[2px] bg-gradient-to-r from-[#2a303d] via-[#222631] to-[#171a22] border-t border-b border-r border-black/80 shadow-[inset_1px_0_1px_rgba(255,255,255,0.15)] flex items-center justify-center"
            style={{
              transformOrigin: 'left center',
            }}
          >
            {/* Miệng khe cơ khí dập chìm trên mặt hông (Recessed Slot Port) */}
            <div className="relative w-[18px] sm:w-[20px] h-[145px] sm:h-[155px] rounded-[8px] p-[2.5px] bg-[#0c0e13] border border-white/10 shadow-[inset_2px_0_6px_rgba(0,0,0,0.95)] flex items-center justify-start overflow-visible">

              {/* Lỗ hốc đen sâu hút bên trong (Pitch Black Well) */}
              <div className="relative w-full h-full rounded-[5px] bg-black shadow-[inset_0_0_8px_#000] overflow-visible">

                {/* ================= 4. THE 3 EJECTING TICKETS STACK ================= */}
                {/* Toàn bộ xấp vé chui từ trong lỗ này thò dài ra ngoài sang phải */}
                <div
                  className={`absolute left-[3px] top-[4px] bottom-[4px] flex items-center transition-transform duration-300 ease-out pointer-events-none ${
                    isHovered ? 'translate-x-3' : 'translate-x-0'
                  }`}
                  style={{ width: '130px' }}
                >
                  {/* --- TICKET 1 (TRONG CÙNG): VÉ ĐEN CARBON --- */}
                  <div
                    className="absolute left-[8px] w-[95px] sm:w-[105px] h-[125px] sm:h-[135px] rounded-r-xl bg-[#0f1117] border border-white/15 p-2 flex flex-col justify-between text-white shadow-[0_6px_16px_rgba(0,0,0,0.8)] z-10"
                    style={{
                      transform: 'rotate(-2deg)',
                      transformOrigin: 'left center',
                    }}
                  >
                    {/* Cutout notch mép trên & dưới */}
                    <div className="absolute -top-1.5 right-6 w-3 h-1.5 rounded-b-full bg-[#1e222b]" />
                    <div className="absolute -bottom-1.5 right-6 w-3 h-1.5 rounded-t-full bg-[#1e222b]" />

                    <div className="flex items-center justify-between">
                      <span className="text-[7px] font-black uppercase text-amber-500">2026</span>
                    </div>

                    <div className="my-auto text-center font-mono text-[8px] text-zinc-300 leading-tight">
                      <div>05 Nov</div>
                      <div>02:11</div>
                    </div>

                    <div className="text-[6.5px] text-zinc-400 font-mono truncate border-t border-white/10 pt-0.5">
                      Nguyen Van Seller
                    </div>
                  </div>

                  {/* --- TICKET 2 (Ở GIỮA): VÉ TRẮNG SẮC NÉT (MÃ VẠCH + GIÁ) --- */}
                  <div
                    className="absolute left-[20px] w-[98px] sm:w-[110px] h-[132px] sm:h-[142px] rounded-r-xl bg-white border border-slate-300 p-2 flex flex-col justify-between text-slate-900 shadow-[4px_8px_20px_rgba(0,0,0,0.6)] z-20"
                    style={{
                      transform: 'rotate(2deg)',
                      transformOrigin: 'left center',
                    }}
                  >
                    {/* Cutout notch mép trên & dưới */}
                    <div className="absolute -top-1.5 right-6 w-3 h-1.5 rounded-b-full bg-[#1e222b]" />
                    <div className="absolute -bottom-1.5 right-6 w-3 h-1.5 rounded-t-full bg-[#1e222b]" />

                    {/* Header vé có logo VieON */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-black text-[8px] text-orange-600 tracking-wider">VieON</span>
                      <span className="font-mono text-[7px] text-slate-500 font-bold">#2</span>
                    </div>

                    {/* Thân vé: Tên sự kiện & Barcode thẳng đứng */}
                    <div className="my-auto flex items-center justify-between gap-1 py-0.5">
                      <div className="flex-1 font-bold text-[7.5px] leading-tight text-slate-800 line-clamp-3">
                        Anh Trai Say Hi Concert 2026
                      </div>

                      {/* Barcode SVG sắc nét */}
                      <div className="flex items-center gap-[1px] h-9 shrink-0 pr-1">
                        <div className="w-[1px] h-full bg-slate-900" />
                        <div className="w-[2px] h-full bg-slate-900" />
                        <div className="w-[1px] h-full bg-slate-900" />
                        <div className="w-[3px] h-full bg-slate-900" />
                        <div className="w-[1px] h-full bg-slate-900" />
                        <div className="w-[2px] h-full bg-slate-900" />
                        <div className="w-[1px] h-full bg-slate-900" />
                        <div className="w-[3px] h-full bg-slate-900" />
                      </div>
                    </div>

                    {/* Footer giá vé */}
                    <div className="border-t border-slate-200 pt-1 flex items-center justify-between">
                      <span className="font-black text-[9px] text-slate-900">
                        {formattedTotalPrice} VND
                      </span>
                    </div>
                  </div>

                  {/* --- TICKET 3 (NGOÀI CÙNG PHÍA SAU): VÉ TRẮNG SỐ 3 --- */}
                  <div
                    className="absolute left-[34px] w-[96px] sm:w-[106px] h-[128px] sm:h-[138px] rounded-r-xl bg-slate-50 border border-slate-300 p-2 flex flex-col justify-between text-slate-800 shadow-[6px_10px_22px_rgba(0,0,0,0.5)] z-15"
                    style={{
                      transform: 'rotate(5deg)',
                      transformOrigin: 'left center',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-black text-[8px] text-zinc-500">VieON</span>
                      <span className="font-mono text-[7px] text-slate-500 font-bold">#3</span>
                    </div>

                    {/* Barcode phụ */}
                    <div className="my-auto flex items-center justify-center gap-[1.5px] h-8 opacity-60">
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-[2px] h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-[2px] h-full bg-slate-900" />
                      <div className="w-[3px] h-full bg-slate-900" />
                    </div>

                    <div className="border-t border-slate-200 pt-0.5 text-right font-mono text-[7px] text-slate-500">
                      VIP PASS
                    </div>
                  </div>

                </div>

                {/* Vành gờ cơ khí mép ngoài cùng kẹp gốc vé (Lip Bezel) */}
                <div className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-zinc-700 to-black z-30 pointer-events-none rounded-l-sm" />

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
