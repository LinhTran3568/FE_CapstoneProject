import React, { useCallback } from 'react';
import { Calendar, MapPin, CheckCircle2, Lock, Timer, Layers, Ticket, UserCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime } from '../../utils/formatters';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import { useAuthStore } from '../../stores/authStore';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';
import { BundleTicketCard } from './BundleTicketCard';

interface TicketCardProps {
  listing: MarketplaceListingDto;
  onBuy: (listing: MarketplaceListingDto) => void;
  onViewDetails?: (listing: MarketplaceListingDto) => void;
  /** Tất cả các vé trong cùng bundle (dùng để hiện đủ ghế combo) */
  bundleListings?: MarketplaceListingDto[];
}

export const TicketCard: React.FC<TicketCardProps> = ({
  listing,
  onBuy,
  onViewDetails,
  bundleListings,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const formattedDate = formatEventDateTime(listing.eventStartAt);

  // Status check: Verified, Transacting, Sold, Cancelled
  const rawStatus = (listing.listingStatus || 'Verified').toLowerCase();

  // Invalidate query when countdown expires (hits 00:00) so card immediately reopens
  const handleCountdownExpire = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`ticket_hold_target_${listing.listingId}`);
    }
    queryClient.invalidateQueries({ queryKey: ['resale-listings'] });
  }, [listing.listingId, queryClient]);

  // Realtime countdown hook for transacting listings (10-min hold duration)
  const countdown = usePaymentCountdown({
    unlockAt: listing.unlockAt,
    durationSeconds: 600,
    enabled: rawStatus === 'transacting',
    listingId: listing.listingId,
    serverNow: listing.serverNow,
    onExpire: handleCountdownExpire,
  });

  // When timer hits 00:00 (isExpired), hold session is finished -> ticket reopens immediately!
  const isTransacting = rawStatus === 'transacting' && !countdown.isExpired;
  const isSold = rawStatus === 'sold';
  const isCancelled = rawStatus === 'cancelled';
  const isAvailable = !isTransacting && !isSold && !isCancelled;

  // Check if current logged in user owns this listing (or any ticket in bundle)
  const isOwner = Boolean(
    user?.id && (
      listing.sellerId?.toLowerCase() === user.id.toLowerCase() ||
      bundleListings?.some((b) => b.sellerId?.toLowerCase() === user.id.toLowerCase())
    )
  );

  // FE-5.2.6: Bundle Combo & Multi-ticket detection.
  // Chỉ dùng listing thật của gói; không tách seatZone để bịa vé ảo.
  const effectiveBundleListings = bundleListings && bundleListings.length > 0
    ? bundleListings
    : [listing];

  // Package metadata can outlive a separately sold sibling. Render only the
  // listings that are still present in the marketplace response.
  const isBundle = effectiveBundleListings.length > 1;
  const bundleCount = effectiveBundleListings.length;

  const totalBundleResalePrice = isBundle
    ? effectiveBundleListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
    : listing.resalePrice;

  const totalBundleOriginalPrice = isBundle
    ? effectiveBundleListings.reduce((sum, item) => sum + (item.originalPrice || 0), 0)
    : listing.originalPrice;

  const formattedPrice = new Intl.NumberFormat('vi-VN').format(totalBundleResalePrice);
  const formattedOriginalPrice = new Intl.NumberFormat('vi-VN').format(totalBundleOriginalPrice);

  const perTicketPrice = Math.round(totalBundleResalePrice / (bundleCount || 1));
  const formattedPerTicketPrice = new Intl.NumberFormat('vi-VN').format(perTicketPrice);

  const hasDiscount = totalBundleOriginalPrice > totalBundleResalePrice;
  const calculatedDiscountPercent = hasDiscount
    ? Math.round(((totalBundleOriginalPrice - totalBundleResalePrice) / totalBundleOriginalPrice) * 100)
    : 0;
  const discountPercentage = listing.discountPercentage > 0 ? listing.discountPercentage : calculatedDiscountPercent;

  // Dynamic Zone styling with high contrast dark solid accents (no backdrop-blur filter lag on hover)
  const getZoneStyle = (tierName: string) => {
    const lower = (tierName || '').toLowerCase();
    if (lower.includes('svip')) {
      return {
        badge: 'bg-[#18150a] border border-amber-400/50 text-white shadow-sm',
        dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      };
    }
    if (lower.includes('vip b') || lower.includes('vip-b')) {
      return {
        badge: 'bg-[#18110a] border border-orange-400/50 text-white shadow-sm',
        dot: 'bg-orange-400 shadow-[0_0_8px_#fb923c]',
      };
    }
    if (lower.includes('fanzone') || lower.includes('fan zone')) {
      return {
        badge: 'bg-[#180a0f] border border-rose-400/50 text-white shadow-sm',
        dot: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
      };
    }
    if (lower.includes('ga') || lower.includes('standard')) {
      return {
        badge: 'bg-[#0a1218] border border-sky-400/50 text-white shadow-sm',
        dot: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
      };
    }
    // Default VIP ZONE A
    return {
      badge: 'bg-[#121622] border border-white/20 text-white shadow-sm',
      dot: 'bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]',
    };
  };

  const zoneStyle = getZoneStyle(listing.tierName);
  const rawPassCode = listing.maskedTicketCode || 'AT*********93';
  // Backend masks can contain one asterisk for every hidden character. The
  // ticket stub has a fixed width, so keep only a compact, consistent mask.
  const passCode = rawPassCode.length > 14
    ? `${rawPassCode.slice(0, 2)}********${rawPassCode.slice(-2)}`
    : rawPassCode;

  // Realistic stage/event photo background with reliable local fallbacks
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

  const backdropUrl = listing.eventBannerUrl || getEventBackdrop(listing.eventName);

  if (isBundle) {
    return (
      <BundleTicketCard
        title={listing.eventName}
        ticketTypeLabel={listing.tierName || 'VIP ZONE A'}
        zoneLabel={
          effectiveBundleListings.length > 1
            ? effectiveBundleListings.map((b) => b.seatZone || b.tierName).filter(Boolean).join(' · ')
            : (listing.seatZone || `${bundleCount} Adjacent Seats`)
        }
        dateLabel={formattedDate}
        venue={listing.eventVenue}
        organizer={listing.organizerName || 'Organizer'}
        seller={listing.sellerFullName || 'Ticket Seller'}
        count={bundleCount}
        totalPrice={totalBundleResalePrice}
        currency="VND"
        backdropUrl={backdropUrl}
        ctaLabel={isTransacting ? 'RESERVED' : isSold ? 'SOLD' : isOwner ? 'YOUR LISTING' : 'VIEW & BUY'}
        onView={() => {
          if (!isTransacting && onViewDetails) {
            onViewDetails(listing);
          } else if (!isTransacting) {
            onBuy(listing);
          }
        }}
      />
    );
  }

  return (
    <div
      id={`ticket-card-${listing.listingId}`}
      className="group relative isolate w-full h-[195px] sm:h-[200px] select-none cursor-pointer transform-gpu transition-transform duration-200 ease-out hover:-translate-y-1.5 hover:z-20 will-change-transform"
      onClick={() => {
        if (!isTransacting && onViewDetails) {
          onViewDetails(listing);
        }
      }}
    >
      {/* ================= MASKED TICKET CONTAINER (Cutout Notches via CSS Mask) ================= */}
      <div
        className={`relative w-full h-full flex rounded-2xl overflow-hidden border transition-colors duration-150 ${
          isTransacting
            ? 'border-amber-500/40 shadow-md'
            : isSold
              ? 'border-zinc-700/50 opacity-75'
              : isBundle
                ? 'border-white/20 group-hover:border-[#FF5A36] shadow-md'
                : 'border-white/10 group-hover:border-[#FF5A36] shadow-md'
        }`}
        style={{
          WebkitMaskImage:
            'radial-gradient(circle 14px at 65% 0px, transparent 13.5px, black 14px), radial-gradient(circle 14px at 65% 100%, transparent 13.5px, black 14px)',
          WebkitMaskComposite: 'destination-in',
          maskImage:
            'radial-gradient(circle 14px at 65% 0px, transparent 13.5px, black 14px), radial-gradient(circle 14px at 65% 100%, transparent 13.5px, black 14px)',
          maskComposite: 'intersect',
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

          {/* Badge: Reserved */}
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-orange-500/25 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] sm:text-xs font-black text-amber-200 tracking-wider uppercase drop-shadow-sm">
              RESERVED BY BUYER
            </span>
          </div>

          {/* Realtime Countdown Timer */}
          <div className="relative mt-3 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/75 border border-amber-500/40 shadow-inner backdrop-blur-md">
            <Timer className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs text-zinc-300 font-medium">Reopens in:</span>
            <span className="font-mono text-base sm:text-lg font-black text-amber-400 tracking-wider">
              {countdown.formattedTime}
            </span>
          </div>

          {/* Helper note */}
          <p className="relative mt-2 text-[11px] text-zinc-300 font-normal max-w-[320px] leading-tight text-center">
            This ticket is currently in a checkout session. It will automatically reopen if payment is not completed.
          </p>
        </div>
      )}

      {/* ================= LEFT SECTION: MAIN BODY (65% width) ================= */}
      <div
        id={`ticket-body-${listing.listingId}`}
        className="relative w-[65%] h-full rounded-l-2xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 bg-[#0a0c10]"
      >
        {/* Live Concert Stage Photo Background with fast hardware-accelerated rendering */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={backdropUrl}
            alt={listing.eventName}
            className={`w-full h-full object-cover object-center contrast-125 saturate-110 pointer-events-none ${
              isSold ? 'opacity-40 grayscale' : isTransacting ? 'opacity-55' : 'opacity-70'
            }`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/landing/concert.jpg';
            }}
          />
          {/* Multi-layer gradient overlays for instant high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#0a0c10]/85 to-[#0b0d13]/95"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/50"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent"></div>
        </div>

        {/* Left Top Content: VIP Badge, Bundle Badge (Clean, aligned) */}
        <div className="relative z-10 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Tier / Zone Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shrink-0 ${zoneStyle.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${zoneStyle.dot}`}></span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white truncate max-w-[120px]">
                {listing.tierName || 'VIP ZONE A'}
              </span>
            </div>

            {/* Bundle Combo Badge */}
            {isBundle && (
              <div
                id={`badge-bundle-${listing.listingId}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1e0f0a] border border-[#FF5A36]/60 text-[#FF8A65] text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase shadow-[0_0_12px_rgba(255,90,54,0.2)] shrink-0"
                title={`Combo package of ${bundleCount} tickets`}
              >
                <Layers className="w-3 h-3 text-[#FF5A36] shrink-0" />
                <span>COMBO · {bundleCount} {bundleCount > 1 ? 'TICKETS' : 'TICKET'}</span>
              </div>
            )}
          </div>

          {isTransacting && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-400/50 bg-black/75 text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm shrink-0">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Reserved</span>
            </div>
          )}

          {isSold && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-zinc-600/50 bg-black/75 text-zinc-200 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm shrink-0">
              <span>Sold</span>
            </div>
          )}
        </div>

        {/* Left Middle & Bottom Content */}
        <div className="relative z-10 space-y-1.5">
          {/* Event Heading */}
          <h2 className={`text-[16px] sm:text-[18px] font-extrabold tracking-tight leading-snug drop-shadow-sm transition-colors duration-200 ease-out line-clamp-1 ${
            isSold ? 'text-zinc-400' : 'text-white group-hover:text-[#FF5A36]'
          }`}>
            {listing.eventName}
          </h2>

          {/* Row 1: Seat Info */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-300 min-w-0">
            {isBundle ? (
              <>
                <Ticket className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                <span className="font-semibold text-[#FF8A65] shrink-0">{bundleCount} Tickets:</span>
                <span className="font-medium text-zinc-200 truncate">
                  {effectiveBundleListings.length > 1
                    ? effectiveBundleListings.map(b => b.seatZone || b.tierName).filter(Boolean).join(' · ')
                    : (listing.seatZone || `${bundleCount} Adjacent Seats`)}
                </span>
              </>
            ) : (
              <>
                <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-200 truncate">
                  {listing.seatZone || 'General Admission'}
                </span>
              </>
            )}
          </div>

          {/* Row 2: Date & Venue */}
          <div className="flex items-center gap-3 text-[11px] sm:text-xs text-zinc-300 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium truncate max-w-[130px] sm:max-w-[180px]">
                {listing.eventVenue}
              </span>
            </div>
          </div>

          {/* Row 3: Organizer & Seller */}
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-zinc-400 min-w-0 pt-0.5 border-t border-white/5">
            {listing.organizerName && (
              <div className="hidden sm:flex items-center gap-1 truncate max-w-[130px]">
                <span>Organizer:</span>
                <span className="text-white font-medium truncate">{listing.organizerName}</span>
              </div>
            )}
            {listing.sellerFullName && (
              <div className="flex items-center gap-1 truncate max-w-[160px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Sold by:</span>
                <span className="text-white font-medium truncate">{listing.sellerFullName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= RIGHT SECTION: TICKET STUB (35% width) ================= */}
      <div
        id={`ticket-stub-${listing.listingId}`}
        className="relative w-[35%] h-full bg-[#e2e8f0] rounded-r-2xl overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 paper-texture shadow-inner"
      >
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"></div>

        {/* Stub Top: Monospace code pill and barcode */}
        <div className="flex items-center justify-between pt-0.5">
          {isBundle ? (
            <div className="px-2 py-0.5 rounded bg-[#FF5A36]/15 border border-[#FF5A36]/40 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#FF5A36] shrink-0" />
              <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-wider text-[#FF5A36] uppercase">
                {bundleCount} TICKETS
              </span>
            </div>
          ) : (
            <div className="px-1.5 py-0.5 rounded bg-slate-300/80 border border-slate-400/50">
              <span
                className="font-mono-code text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-800"
                title={rawPassCode}
              >
                {passCode}
              </span>
            </div>
          )}

          {/* Realistic Barcode Graphic */}
          <div className="flex items-center gap-[2px] h-4.5 opacity-80" title="Ticket barcode">
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
        <div className="my-auto py-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
              {isBundle ? `COMBO (${bundleCount} ${bundleCount > 1 ? 'TICKETS' : 'TICKET'})` : 'PRICE'}
            </span>
          </div>

          {/* Original face value */}
          {hasDiscount && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] text-slate-400 line-through font-medium">
                {formattedOriginalPrice} VND
              </span>
              {discountPercentage > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  -{discountPercentage}%
                </span>
              )}
            </div>
          )}

          {/* Current price */}
          <div className="flex items-baseline">
            <span className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-slate-900 leading-none">
              {formattedPrice}
            </span>
            <span className="ml-1 text-xs font-bold text-slate-700">VND</span>
          </div>

          {/* Combo per-ticket price */}
          {isBundle && (
            <div className="text-[10px] font-mono text-slate-600 font-semibold mt-0.5">
              ~{formattedPerTicketPrice} VND / ticket
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
                className="w-full py-2 px-2 bg-amber-100 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-sm"
                title="This ticket is currently in a checkout session"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-extrabold text-[10px]">RESERVED</span>
              </button>
              <div className="text-[9px] text-center font-medium text-amber-800 leading-none">
                Checkout in progress
              </div>
            </div>
          ) : isSold ? (
            <button
              id={`btn-buy-${listing.listingId}`}
              type="button"
              disabled
              className="w-full py-2 px-2.5 bg-slate-300 border border-slate-400 text-slate-600 rounded-xl font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
              title="This ticket has been sold"
            >
              <span>SOLD OUT</span>
            </button>
          ) : isOwner ? (
            <div className="space-y-1">
              <button
                id={`btn-buy-${listing.listingId}`}
                type="button"
                disabled
                className="w-full py-2 px-2 bg-slate-100 border border-slate-300 text-slate-500 rounded-xl font-bold text-[11px] tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-inner"
                title="You cannot purchase your own ticket"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                  YOUR TICKET
                </span>
              </button>
              <div className="text-[9px] text-center font-medium text-slate-500 leading-none">
                You are the seller
              </div>
            </div>
          ) : (
            <button
              id={`btn-buy-${listing.listingId}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewDetails) {
                  onViewDetails(listing);
                } else {
                  onBuy(listing);
                }
              }}
              className="w-full py-2 px-3 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] transition-all duration-150 rounded-xl font-bold text-[11px] sm:text-xs text-white tracking-wide shadow-[0_4px_14px_rgba(255,87,34,0.35)] flex items-center justify-center gap-1.5 cursor-pointer group/btn"
            >
              <span className="whitespace-nowrap">{isBundle ? 'VIEW & BUY' : 'VIEW & BUY'}</span>
              <span className="transition-transform duration-150 group-hover/btn:translate-x-1">→</span>
            </button>
          )}
        </div>
      </div>
      </div>

      {/* ================= PERFORATION JUNCTION, NOTCHES & VERTICAL TEAR LINE (Stroke-only transparent cutout) ================= */}
      {/* Top Notch Contour Border (bo theo vết khoét bán nguyệt mép trên) */}
      <div className="absolute left-[65%] top-0 -translate-x-1/2 w-7 h-3.5 z-30 pointer-events-none">
        <svg viewBox="0 0 28 14" className="w-full h-full block overflow-visible">
          <path
            d="M 0,0.5 A 14,14 0 0,0 28,0.5"
            fill="none"
            className={`transition-colors duration-200 ease-out ${
              isTransacting
                ? 'stroke-amber-400/50'
                : isSold
                  ? 'stroke-zinc-600/50'
                  : 'stroke-white/10 group-hover:stroke-[#FF5A36]'
            }`}
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Vertical Perforated Tear Line */}
      <div className="absolute left-[65%] -ml-[1px] top-[14px] bottom-[14px] -translate-x-1/2 w-[2px] z-20 pointer-events-none flex flex-col items-center justify-center">
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
            className="stroke-[#FF5A36]/45 group-hover:stroke-[#FF5A36] transition-colors duration-150 ease-out"
            strokeWidth="2"
            strokeDasharray="9 5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom Notch Contour Border (bo theo vết khoét bán nguyệt mép dưới) */}
      <div className="absolute left-[65%] bottom-0 -translate-x-1/2 w-7 h-3.5 z-30 pointer-events-none">
        <svg viewBox="0 0 28 14" className="w-full h-full block overflow-visible">
          <path
            d="M 0,13.5 A 14,14 0 0,1 28,13.5"
            fill="none"
            className={`transition-colors duration-200 ease-out ${
              isTransacting
                ? 'stroke-amber-400/50'
                : isSold
                  ? 'stroke-zinc-600/50'
                  : 'stroke-white/10 group-hover:stroke-[#FF5A36]'
            }`}
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};
