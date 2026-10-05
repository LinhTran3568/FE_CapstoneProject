import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Building2,
  Lock,
  Tag,
} from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime, formatVND } from '../../utils/formatters';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';

interface TicketDetailModalProps {
  listing: MarketplaceListingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: (listing: MarketplaceListingDto) => void;
  /** Danh sách toàn bộ các vé con trong cùng bundle (nếu là vé combo) */
  bundleListings?: MarketplaceListingDto[];
  isOwner?: boolean;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  onBuy,
  bundleListings = [],
  isOwner = false,
}) => {
  if (!isOpen || !listing) return null;

  const rawStatus = (listing.listingStatus || 'Verified').toLowerCase();
  const isTransacting = rawStatus === 'transacting';
  const isSold = rawStatus === 'sold';
  const isAvailable = !isTransacting && !isSold && !isOwner;

  // Bundle calculations
  const effectiveBundleListings = bundleListings.length > 0 ? bundleListings : [listing];
  const isBundle =
    effectiveBundleListings.length > 1 ||
    Boolean(listing.bundleTotalTickets && listing.bundleTotalTickets >= 2) ||
    Boolean(listing.bundleId);

  const bundleCount =
    listing.bundleTotalTickets && listing.bundleTotalTickets >= 2
      ? listing.bundleTotalTickets
      : effectiveBundleListings.length;

  const totalResalePrice = isBundle && effectiveBundleListings.length > 1
    ? effectiveBundleListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
    : (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2 && effectiveBundleListings.length === 1)
      ? listing.resalePrice * listing.bundleTotalTickets
      : listing.resalePrice;

  const totalOriginalPrice = isBundle && effectiveBundleListings.length > 1
    ? effectiveBundleListings.reduce((sum, item) => sum + (item.originalPrice || 0), 0)
    : (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2 && effectiveBundleListings.length === 1)
      ? listing.originalPrice * listing.bundleTotalTickets
      : listing.originalPrice;

  const perTicketResalePrice = Math.round(totalResalePrice / (bundleCount || 1));
  const perTicketOriginalPrice = Math.round(totalOriginalPrice / (bundleCount || 1));

  // Adjacency detection for all seats in combo
  const allSeatZones = effectiveBundleListings
    .map((l) => l.seatZone || l.tierName)
    .filter(Boolean)
    .join(', ');
  const adjacency = detectSeatAdjacency(allSeatZones || listing.seatZone || listing.tierName);

  // Background image based on event
  const getEventBackdrop = (name: string): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('say hi') || lower.includes('anh trai')) return '/images/landing/hero-concert.jpg';
    if (lower.includes('mỹ tâm') || lower.includes('tri âm')) return '/images/landing/featured-1.jpg';
    if (lower.includes('rave') || lower.includes('festival') || lower.includes('edm')) return '/images/landing/festival.jpg';
    if (lower.includes('derby') || lower.includes('league') || lower.includes('sports')) return '/images/landing/sports.jpg';
    if (lower.includes('kịch') || lower.includes('theater')) return '/images/landing/theater.jpg';
    return '/images/landing/concert.jpg';
  };

  const backdropUrl = getEventBackdrop(listing.eventName);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#0A0D14] border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-left"
        >
          {/* Header Banner with Event Photo */}
          <div className="relative h-44 sm:h-52 w-full overflow-hidden">
            <img
              src={backdropUrl}
              alt={listing.eventName}
              className="w-full h-full object-cover object-center contrast-125 saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14]/90 via-transparent to-[#0A0D14]/60" />

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer z-20"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badges in Header */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
              <span className="px-3 py-1 rounded-full bg-black/75 border border-white/20 text-white text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                {listing.tierName || 'VIP ZONE'}
              </span>

              {isBundle && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/20 border border-[#FF5A36]/60 text-[#FF8A65] text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Combo · {bundleCount} vé</span>
                </span>
              )}

              {adjacency.status === 'ADJACENT' && (
                <SeatAdjacencyBadge
                  result={adjacency}
                  variant="glass"
                  size="xs"
                  className="shadow-sm"
                />
              )}
            </div>

            {/* Event Name & Short Details */}
            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md line-clamp-2">
                {listing.eventName}
              </h2>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[calc(85vh-200px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* 1. Date, Time & Venue Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#FF5A36]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Thời gian</span>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {formatEventDateTime(listing.eventStartAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Địa điểm tổ chức</span>
                  <p className="text-xs sm:text-sm font-semibold text-white truncate" title={listing.eventVenue}>
                    {listing.eventVenue}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Seat Details Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>{isBundle ? `Danh sách ghế trong Combo (${bundleCount} vé)` : 'Chi tiết vị trí ghế'}</span>
                </span>
                {listing.organizerName && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-zinc-500" />
                    <span>BTC: {listing.organizerName}</span>
                  </span>
                )}
              </div>

              {isBundle && effectiveBundleListings.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {effectiveBundleListings.map((item, idx) => (
                    <div
                      key={item.listingId || idx}
                      className="p-3.5 rounded-xl bg-[#05070A] border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-1.5 py-0.5 rounded border border-[#FF5A36]/25">
                            Vé #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {item.seatZone || item.tierName || 'Khu vực chính'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400">
                          Mã vé: {item.maskedTicketCode || 'AT*********'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-white block">
                          {formatVND(item.resalePrice || perTicketResalePrice)}
                        </span>
                        <span className="text-[10px] text-zinc-500">giá bán lại</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#05070A] border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {listing.seatZone || listing.tierName || 'Khu vực chính'}
                      </span>
                      {adjacency.status === 'SINGLE_SEAT' && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
                          Ghế đơn
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-400">
                      Mã định danh vé: {listing.maskedTicketCode || 'AT*********93'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      Xác thực chính chủ
                    </span>
                    <span className="text-[10px] text-zinc-500 block">Đổi mã QR mới sau thanh toán</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Pricing Breakdown Card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                Chi tiết giá & Thanh toán
              </span>

              {isBundle && (
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Đơn giá mỗi vé:</span>
                  <span className="font-mono font-semibold text-white">
                    {formatVND(perTicketResalePrice)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Tổng giá vé niêm yết (Gốc):</span>
                <span className="font-mono text-zinc-400 line-through">
                  {formatVND(totalOriginalPrice)}
                </span>
              </div>

              {listing.discountPercentage > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Mức ưu đãi từ người bán:</span>
                  </span>
                  <span className="font-mono font-bold">
                    -{listing.discountPercentage}% ({formatVND(totalOriginalPrice - totalResalePrice)})
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">
                    {isBundle ? `Tổng thanh toán (${bundleCount} vé)` : 'Tổng thanh toán'}
                  </span>
                  <span className="text-[11px] text-zinc-400">Đã bao gồm phí bảo vệ giao dịch</span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#FF5A36]">
                    {formatVND(totalResalePrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Seller & Rules Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 pt-1">
              {listing.sellerFullName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>Người bán: <strong className="text-zinc-200">{listing.sellerFullName}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Sàn đóng trước giờ diễn sự kiện 2 tiếng</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-[#07090E] border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              Quay lại sàn
            </button>

            {isTransacting ? (
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Lock className="w-4 h-4" />
                <span>Vé đang trong phiên thanh toán</span>
              </div>
            ) : isSold ? (
              <div className="text-xs font-semibold text-zinc-400 px-4 py-2.5 rounded-xl bg-white/5">
                Vé đã bán hết
              </div>
            ) : isOwner ? (
              <div className="text-xs font-semibold text-zinc-400 px-4 py-2.5 rounded-xl bg-white/5">
                Đây là vé của bạn
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuy(listing);
                }}
                className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-lg shadow-[#FF5A36]/30 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{isBundle ? `Mua Combo (${bundleCount} Vé)` : 'Tiến hành mua vé'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
