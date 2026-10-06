import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  Layers,
  ArrowRight,
  User,
  Lock,
} from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime, formatVND } from '../../utils/formatters';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';

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

  // Bundle calculations: Ưu tiên bundleListings truyền vào, sau đó đến listing.bundleItems, cuối cùng là [listing]
  const effectiveBundleListings =
    bundleListings.length > 0
      ? bundleListings
      : (listing.bundleItems && listing.bundleItems.length > 0)
        ? listing.bundleItems
        : [listing];

  const isBundle =
    effectiveBundleListings.length > 1 ||
    Boolean(listing.bundleTotalTickets && listing.bundleTotalTickets >= 2) ||
    Boolean(listing.bundleId);

  const bundleCount =
    listing.bundleTotalTickets && listing.bundleTotalTickets >= 2
      ? listing.bundleTotalTickets
      : effectiveBundleListings.length;

  const totalResalePrice =
    isBundle && effectiveBundleListings.length > 1
      ? effectiveBundleListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
      : listing.bundleTotalTickets && listing.bundleTotalTickets >= 2 && effectiveBundleListings.length === 1
        ? listing.resalePrice * listing.bundleTotalTickets
        : listing.resalePrice;

  const totalOriginalPrice =
    isBundle && effectiveBundleListings.length > 1
      ? effectiveBundleListings.reduce((sum, item) => sum + (item.originalPrice || 0), 0)
      : listing.bundleTotalTickets && listing.bundleTotalTickets >= 2 && effectiveBundleListings.length === 1
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

  // Build the array of visual ticket cards to display
  const displayTickets = (() => {
    if (effectiveBundleListings.length > 1) {
      return effectiveBundleListings.map((item, idx) => ({
        id: item.listingId || `ticket-${idx}`,
        ticketIndex: idx + 1,
        tierName: item.tierName || listing.tierName || 'VIP ZONE',
        seatZone: item.seatZone || `Ghế #${idx + 1}`,
        price: item.resalePrice || perTicketResalePrice,
        code: item.maskedTicketCode || `AT-2026-${String(idx + 1).padStart(4, '0')}`,
      }));
    }

    if (isBundle && bundleCount >= 2) {
      if (adjacency.seatNumbers.length >= bundleCount) {
        return adjacency.seatNumbers.slice(0, bundleCount).map((sn, idx) => ({
          id: `seat-${sn}-${idx}`,
          ticketIndex: idx + 1,
          tierName: listing.tierName || 'VIP ZONE A',
          seatZone: adjacency.commonRow ? `Hàng ${adjacency.commonRow} · Ghế ${sn}` : `Ghế ${sn}`,
          price: perTicketResalePrice,
          code: listing.maskedTicketCode
            ? `${listing.maskedTicketCode.slice(0, -2)}${String(idx + 1).padStart(2, '0')}`
            : `AT-2026-${String(idx + 1).padStart(4, '0')}`,
        }));
      }

      return Array.from({ length: bundleCount }, (_, idx) => ({
        id: `ticket-${idx}`,
        ticketIndex: idx + 1,
        tierName: listing.tierName || 'VIP ZONE A',
        seatZone: listing.seatZone ? `${listing.seatZone} (Vé #${idx + 1})` : `Ghế #${idx + 1}`,
        price: perTicketResalePrice,
        code: listing.maskedTicketCode || `AT-2026-${String(idx + 1).padStart(4, '0')}`,
      }));
    }

    return [
      {
        id: listing.listingId,
        ticketIndex: 1,
        tierName: listing.tierName || 'VIP ZONE A',
        seatZone: listing.seatZone || 'Khán đài',
        price: listing.resalePrice,
        code: listing.maskedTicketCode || 'AT-2026-XXXX',
      },
    ];
  })();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window: Kích thước tinh gọn max-w-2xl */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#090C12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto text-left"
        >
          {/* Header Banner: Tinh gọn chiều cao h-28 sm:h-32 */}
          <div className="relative h-28 sm:h-32 w-full overflow-hidden">
            <img
              src={backdropUrl}
              alt={listing.eventName}
              className="w-full h-full object-cover object-center contrast-125 saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090C12] via-[#090C12]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090C12]/95 via-transparent to-[#090C12]/70" />

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer z-20"
              title="Đóng modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badges in Header: Tối giản, chỉ giữ 2 badge quan trọng */}
            <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
              <span className="px-2.5 py-0.5 rounded-full bg-black/75 border border-white/20 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
                {listing.tierName || 'VIP ZONE'}
              </span>

              {isBundle && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5A36] text-white text-[11px] font-extrabold tracking-wider uppercase shadow-sm">
                  <Layers className="w-3 h-3 text-white" />
                  <span>GÓI COMBO · {bundleCount} VÉ</span>
                </span>
              )}
            </div>

            {/* Event Name */}
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md truncate">
                {listing.eventName}
              </h2>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[calc(88vh-140px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Event Meta Line: Ngày & Địa điểm */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>{formatEventDateTime(listing.eventStartAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300 truncate max-w-xs" title={listing.eventVenue}>
                <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                <span className="truncate">{listing.eventVenue}</span>
              </div>
            </div>

            {/* ================= DANH SÁCH CÁC CARD VÉ TRỰC QUAN (VISUAL TICKET CARDS) ================= */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1.5 text-white">
                  <Ticket className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>
                    {isBundle ? `Vé có trong Gói (${bundleCount} vé)` : 'Chi tiết vé'}
                  </span>
                </span>
                {isBundle && (
                  <span className="text-[11px] font-mono text-amber-300">
                    Bán nguyên lô · Không tách lẻ
                  </span>
                )}
              </div>

              {/* Grid các card vé con: Hiển thị trực quan, đẹp mắt */}
              <div
                className={`grid gap-2.5 ${
                  displayTickets.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {displayTickets.map((t) => (
                  <div
                    key={t.id}
                    className="relative rounded-xl p-3 border border-white/15 bg-gradient-to-b from-[#131724] to-[#0b0e16] flex flex-col justify-between shadow-md overflow-hidden group/ticket hover:border-[#FF5A36]/60 transition-colors"
                  >
                    {/* Top Notch khuyết vé */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#090C12] border border-white/10" />

                    <div>
                      {/* Card Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF8A65] border border-[#FF5A36]/40">
                          VÉ #{t.ticketIndex}
                        </span>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                          {t.tierName}
                        </span>
                      </div>

                      {/* Vị trí ghế nổi bật */}
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5 mb-2">
                        <div className="text-[9px] text-zinc-400 font-mono">VỊ TRÍ CHỖ NGỒI</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                          {t.seatZone}
                        </div>
                      </div>
                    </div>

                    {/* Footer cuống vé: Mã & Giá vé con */}
                    <div className="pt-2 border-t border-dashed border-white/15 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 truncate max-w-[110px]">{t.code}</span>
                      <span className="text-emerald-400 font-bold">{formatVND(t.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= TỔNG KẾT TÀI CHÍNH (COMPACT FINANCIAL SUMMARY) ================= */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              {isBundle && (
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Giá bình quân:</span>
                  <span className="font-mono text-orange-300 font-bold">
                    ~{formatVND(perTicketResalePrice)} / vé
                  </span>
                </div>
              )}

              <div className="pt-1.5 border-t border-white/10 flex items-baseline justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white block">
                    {isBundle ? `Tổng thanh toán (${bundleCount} vé)` : 'Tổng thanh toán'}
                  </span>
                  <span className="text-[10px] text-zinc-400">Đã bao gồm thuế và phí bảo vệ người mua</span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#FF5A36]">
                    {formatVND(totalResalePrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            {listing.sellerFullName && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    Người bán: <strong className="text-zinc-200">{listing.sellerFullName}</strong>
                  </span>
                </div>
                {listing.organizerName && <span>BTC: {listing.organizerName}</span>}
              </div>
            )}
          </div>

          {/* Footer Actions: Tinh gọn */}
          <div className="p-3.5 sm:p-4 bg-[#06080d] border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              Đóng lại
            </button>

            {isTransacting ? (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Lock className="w-3.5 h-3.5" />
                <span>Vé đang thanh toán</span>
              </div>
            ) : isSold ? (
              <div className="text-xs font-semibold text-zinc-400 px-4 py-2 rounded-xl bg-white/5">
                Vé đã bán hết
              </div>
            ) : isOwner ? (
              <div className="text-xs font-semibold text-zinc-400 px-4 py-2 rounded-xl bg-white/5">
                Đây là vé của bạn
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const target = effectiveBundleListings[0] || listing;
                  onBuy(target);
                }}
                className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md shadow-[#FF5A36]/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
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
