import React from 'react';
import { Calendar, MapPin, CheckCircle2, Lock, Timer } from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime } from '../../utils/formatters';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';

interface TicketCardProps {
  listing: MarketplaceListingDto;
  onBuy: (listing: MarketplaceListingDto) => void;
  onViewDetails?: (listing: MarketplaceListingDto) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  listing,
  onBuy,
  onViewDetails,
}) => {
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(listing.resalePrice);
  const formattedOriginalPrice = new Intl.NumberFormat('vi-VN').format(listing.originalPrice);
  const formattedDate = formatEventDateTime(listing.eventStartAt);

  // Status check: Verified, Transacting, Sold, Cancelled
  const rawStatus = (listing.listingStatus || 'Verified').toLowerCase();
  const isTransacting = rawStatus === 'transacting';
  const isSold = rawStatus === 'sold';
  const isCancelled = rawStatus === 'cancelled';
  const isAvailable = !isTransacting && !isSold && !isCancelled;

  // Realtime countdown hook for transacting listings (10-min hold duration)
  const countdown = usePaymentCountdown({
    durationSeconds: 600,
    enabled: isTransacting,
  });

  // Dynamic Zone styling inherited from user design
  const getZoneStyle = (tierName: string) => {
    const lower = (tierName || '').toLowerCase();
    if (lower.includes('svip')) {
      return {
        badge: 'bg-amber-400/15 border-amber-400/50 text-amber-200',
        dot: 'bg-amber-300 shadow-[0_0_8px_#fcd34d]',
      };
    }
    if (lower.includes('vip b') || lower.includes('vip-b')) {
      return {
        badge: 'bg-orange-500/10 border-orange-500/40 text-orange-300',
        dot: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
      };
    }
    if (lower.includes('fanzone') || lower.includes('fan zone')) {
      return {
        badge: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
        dot: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
      };
    }
    if (lower.includes('ga') || lower.includes('standard')) {
      return {
        badge: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
        dot: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
      };
    }
    // Default VIP ZONE A
    return {
      badge: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
      dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    };
  };

  const zoneStyle = getZoneStyle(listing.tierName);
  const passCode = listing.maskedTicketCode || 'AT*********93';

  // Realistic stage/event photo background
  const getEventBackdrop = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('say hi') || lower.includes('anh trai')) {
      return 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80';
    }
    if (lower.includes('mỹ tâm') || lower.includes('tri âm')) {
      return 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80';
    }
    if (lower.includes('rave') || lower.includes('festival') || lower.includes('edm')) {
      return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';
    }
    if (lower.includes('derby') || lower.includes('league') || lower.includes('viettel')) {
      return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
    }
    if (lower.includes('kịch') || lower.includes('ngày xửa')) {
      return 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80';
    }
    return '/images/landing/concert.jpg';
  };

  const backdropUrl = getEventBackdrop(listing.eventName);

  return (
    <div
      id={`ticket-card-${listing.listingId}`}
      className={`group relative isolate w-full h-[224px] sm:h-[230px] flex rounded-2xl bg-[#0a0c10] border shadow-[0_10px_30px_rgba(0,0,0,0.85)] transition-[border-color,box-shadow,transform] duration-200 ease-out select-none cursor-pointer ${
        isTransacting
          ? 'border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.15)]'
          : isSold
          ? 'border-zinc-700/50 opacity-75'
          : 'border-white/10 hover:border-[#FF5A36] hover:shadow-[0_12px_40px_rgba(255,90,54,0.22)] hover:-translate-y-1'
      }`}
      onClick={() => {
        if (!isTransacting && onViewDetails) {
          onViewDetails(listing);
        }
      }}
    >
      {/* ================= REALTIME TRANSACTING BLURRED OVERLAY ================= */}
      {isTransacting && (
        <div
          id={`ticket-transacting-overlay-${listing.listingId}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute inset-0 z-40 rounded-2xl bg-[#07080b]/80 backdrop-blur-[5px] border border-amber-500/40 p-4 flex flex-col items-center justify-center text-center select-none shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-200 pointer-events-auto"
        >
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none rounded-2xl" />

          {/* Badge: Đang có người giữ chỗ */}
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-orange-500/25 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] sm:text-xs font-black text-amber-200 tracking-wider uppercase drop-shadow-sm">
              Đang có người giữ chỗ
            </span>
          </div>

          {/* Realtime Countdown Timer */}
          <div className="relative mt-3 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/75 border border-amber-500/40 shadow-inner backdrop-blur-md">
            <Timer className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs text-zinc-300 font-medium">Mở lại sau:</span>
            <span className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider">
              {countdown.formattedTime}
            </span>
          </div>

          {/* Helper note */}
          <p className="relative mt-2 text-[11px] text-zinc-300 font-normal max-w-[320px] leading-tight text-center">
            Vé sẽ tự động mở bán lại nếu người mua không hoàn tất thanh toán.
          </p>
        </div>
      )}

      {/* ================= LEFT SECTION: MAIN BODY (65% width) ================= */}
      <div
        id={`ticket-body-${listing.listingId}`}
        className="relative w-[65%] h-full rounded-l-2xl overflow-hidden flex flex-col justify-between p-5 sm:p-6 bg-[#0a0c10]"
      >
        {/* Live Concert Stage Photo Background with fast hardware-accelerated subtle zoom */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={backdropUrl}
            alt={listing.eventName}
            className={`w-full h-full object-cover object-center contrast-125 saturate-110 transition-transform duration-300 ease-out group-hover:scale-105 ${
              isSold ? 'opacity-40 grayscale' : isTransacting ? 'opacity-55' : 'opacity-70'
            }`}
            loading="lazy"
          />
          {/* Multi-layer gradient overlays for instant high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#0a0c10]/85 to-[#0b0d13]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/50"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent"></div>
        </div>

        {/* Left Top Content: VIP Badge & Status Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)] ${zoneStyle.badge}`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${zoneStyle.dot}`}></span>
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {listing.tierName || 'VIP ZONE A'}
            </span>
          </div>

          {isTransacting && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-400/50 bg-amber-500/20 text-amber-200 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Lock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Đang giữ chỗ</span>
            </div>
          )}

          {isSold && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-500/50 bg-zinc-800/90 text-zinc-300 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
              <span>Sold</span>
            </div>
          )}
        </div>

        {/* Left Middle & Bottom Content */}
        <div className="relative z-10 space-y-2.5">
          {/* Event Heading - instant smooth color transition on card hover */}
          <h2 className={`text-[19px] sm:text-[21px] font-extrabold tracking-tight leading-tight drop-shadow-sm transition-colors duration-200 ease-out line-clamp-2 ${
            isSold ? 'text-zinc-400' : 'text-white group-hover:text-[#FF5A36]'
          }`}>
            {listing.eventName}
          </h2>

          {/* Metadata with subtle icons */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-300">
            {/* Date & Time */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-300">{formattedDate}</span>
            </div>

            {/* Venue Location */}
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium text-zinc-300 truncate max-w-[170px] sm:max-w-[200px]">
                {listing.eventVenue}
              </span>
            </div>

            {/* Verified Seller */}
            {listing.sellerFullName && (
              <div className="flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                <span className="font-medium text-zinc-300">
                  Seller: <span className="text-[#10b981] font-semibold">{listing.sellerFullName}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= PERFORATION JUNCTION, NOTCHES & VERTICAL TEAR LINE ================= */}
      {/* Top Notch Cutout with contour border that hugs the card */}
      <div className="absolute left-[65%] -top-[1px] -translate-x-1/2 w-7 h-[15px] z-30 pointer-events-none">
        <svg
          viewBox="0 0 28 15"
          className="w-full h-full block overflow-visible"
          fill="none"
        >
          {/* Mask: strictly bounded between x=0 and x=28, covering 1px card border without bleeding onto white stub */}
          <path
            d="M 0,-1 L 28,-1 L 28,0 A 14,14 0 0,1 0,0 Z"
            fill="#05070A"
          />
          {/* Semicircular contour border dipping downward into the ticket */}
          <path
            d="M 0,0.5 A 14,14 0 0,0 28,0.5"
            fill="none"
            className="stroke-white/10 group-hover:stroke-[#FF5A36] transition-colors duration-200 ease-out"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Vertical Perforated Tear Line */}
      <div className="absolute left-[65%] -ml-[2px] top-[14px] bottom-[14px] -translate-x-1/2 w-[2px] z-20 pointer-events-none flex flex-col items-center justify-center">
        <svg
          className="h-full w-[2px] overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 2 202"
        >
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

      {/* Bottom Notch Cutout with contour border that hugs the card */}
      <div className="absolute left-[65%] -bottom-[1px] -translate-x-1/2 w-7 h-[15px] z-30 pointer-events-none">
        <svg
          viewBox="0 0 28 15"
          className="w-full h-full block overflow-visible"
          fill="none"
        >
          {/* Mask: strictly bounded between x=0 and x=28, covering 1px card border without bleeding onto white stub */}
          <path
            d="M 0,14.5 A 14,14 0 0,1 28,14.5 L 28,15.5 L 0,15.5 Z"
            fill="#05070A"
          />
          {/* Semicircular contour border dipping upward into the ticket */}
          <path
            d="M 0,14.5 A 14,14 0 0,1 28,14.5"
            fill="none"
            className="stroke-white/10 group-hover:stroke-[#FF5A36] transition-colors duration-200 ease-out"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* ================= RIGHT SECTION: TICKET STUB (35% width) ================= */}
      <div
        id={`ticket-stub-${listing.listingId}`}
        className="relative w-[35%] h-full bg-[#e2e8f0] rounded-r-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 paper-texture shadow-inner"
      >
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"></div>

        {/* Stub Top: Monospace code pill and barcode */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="px-2 py-0.5 rounded bg-slate-300/80 border border-slate-400/50">
            <span className="font-mono-code text-[11px] font-bold tracking-wider text-slate-800">
              {passCode}
            </span>
          </div>

          {/* Realistic Barcode Graphic */}
          <div className="flex items-center gap-[2px] h-5 opacity-80" title="Ticket barcode">
            <span className="w-[2.5px] h-full bg-slate-900"></span>
            <span className="w-[1px] h-full bg-slate-900"></span>
            <span className="w-[3px] h-full bg-slate-900"></span>
            <span className="w-[1px] h-full bg-slate-900"></span>
            <span className="w-[2px] h-full bg-slate-900"></span>
            <span className="w-[4px] h-full bg-slate-900"></span>
            <span className="w-[1.5px] h-full bg-slate-900"></span>
            <span className="w-[1px] h-full bg-slate-900"></span>
            <span className="w-[2.5px] h-full bg-slate-900"></span>
            <span className="w-[1px] h-full bg-slate-900"></span>
            <span className="w-[3px] h-full bg-slate-900"></span>
            <span className="w-[2px] h-full bg-slate-900"></span>
          </div>
        </div>

        {/* Stub Middle: Pricing Block */}
        <div className="my-auto py-1">
          <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-0.5">
            PRICE
          </div>
          <div className="flex items-baseline">
            <span className="text-[23px] sm:text-[25px] font-extrabold tracking-tight text-slate-900 leading-none">
              {formattedPrice}
            </span>
            <span className="ml-1 text-sm font-bold text-slate-700">VND</span>
          </div>

          {listing.discountPercentage > 0 ? (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-slate-400 line-through font-medium">
                {formattedOriginalPrice} VND
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                -{listing.discountPercentage}%
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-mono-code text-slate-500 mt-1">
              Organizer Verified Price
            </div>
          )}
        </div>

        {/* Stub Bottom: Action Button */}
        <div>
          {isTransacting ? (
            <div className="space-y-1">
              <button
                id={`btn-buy-${listing.listingId}`}
                type="button"
                disabled
                className="w-full py-2.5 px-2.5 bg-amber-100 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-sm"
                title="Vé đang trong phiên giao dịch thanh toán"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-extrabold text-[11px]">GIỮ CHỖ</span>
              </button>
              <div className="text-[10px] text-center font-medium text-amber-800 leading-none">
                Đang thanh toán
              </div>
            </div>
          ) : isSold ? (
            <button
              id={`btn-buy-${listing.listingId}`}
              type="button"
              disabled
              className="w-full py-2.5 px-3 bg-slate-300 border border-slate-400 text-slate-600 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
              title="This ticket has been sold"
            >
              <span>SOLD OUT</span>
            </button>
          ) : (
            <button
              id={`btn-buy-${listing.listingId}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBuy(listing);
              }}
              className="w-full py-2.5 px-4 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] transition-all duration-150 rounded-xl font-bold text-xs text-white tracking-wide shadow-[0_4px_14px_rgba(255,87,34,0.35)] flex items-center justify-center gap-1.5 cursor-pointer group/btn"
            >
              <span>BUY TICKET</span>
              <span className="transition-transform duration-150 group-hover/btn:translate-x-1">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
