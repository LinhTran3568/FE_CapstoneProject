import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  Layers,
  Check,
  Clock,
  ArrowRight,
  User,
  Building2,
  Lock,
  Tag,
  ShieldCheck,
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

  // Gói vé có bắt buộc mua cả cặp/combo (all-or-nothing) hay cho phép tick chọn mua lẻ?
  const isAllOrNothing = listing.isBundleAllOrNothing !== false;

  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && effectiveBundleListings.length > 0) {
      setSelectedListingIds(effectiveBundleListings.map((l) => l.listingId));
    }
  }, [isOpen, listing?.listingId, effectiveBundleListings.length]);

  const handleToggleTicket = (listingId: string) => {
    setSelectedListingIds((prev) => {
      if (prev.includes(listingId)) {
        if (prev.length <= 1) return prev; // Giữ tối thiểu 1 vé được chọn
        return prev.filter((id) => id !== listingId);
      } else {
        return [...prev, listingId];
      }
    });
  };

  const handleToggleAll = () => {
    if (selectedListingIds.length === effectiveBundleListings.length) {
      setSelectedListingIds([effectiveBundleListings[0].listingId]);
    } else {
      setSelectedListingIds(effectiveBundleListings.map((l) => l.listingId));
    }
  };

  const activeBundleListings =
    isBundle && !isAllOrNothing
      ? effectiveBundleListings.filter((l) => selectedListingIds.includes(l.listingId))
      : effectiveBundleListings;

  const bundleCount =
    listing.bundleTotalTickets && listing.bundleTotalTickets >= 2
      ? listing.bundleTotalTickets
      : effectiveBundleListings.length;

  const activeCount = isBundle && !isAllOrNothing ? activeBundleListings.length : bundleCount;

  const totalResalePrice =
    isBundle && effectiveBundleListings.length > 1
      ? activeBundleListings.reduce((sum, item) => sum + (item.resalePrice || 0), 0)
      : listing.bundleTotalTickets && listing.bundleTotalTickets >= 2 && effectiveBundleListings.length === 1
        ? listing.resalePrice * listing.bundleTotalTickets
        : listing.resalePrice;

  const totalOriginalPrice =
    isBundle && effectiveBundleListings.length > 1
      ? activeBundleListings.reduce((sum, item) => sum + (item.originalPrice || 0), 0)
      : listing.bundleTotalTickets && listing.bundleTotalTickets >= 2 && effectiveBundleListings.length === 1
        ? listing.originalPrice * listing.bundleTotalTickets
        : listing.originalPrice;

  const perTicketResalePrice = Math.round(totalResalePrice / (activeCount || 1));
  const perTicketOriginalPrice = Math.round(totalOriginalPrice / (activeCount || 1));

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

  // Theme styling for each pass card in bundle
  const getTicketTheme = (idx: number) => {
    const themes = [
      {
        borderColor: 'border-cyan-500/40',
        bgGradient: 'bg-gradient-to-b from-cyan-950/30 via-slate-900/95 to-slate-950',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        accentText: 'text-cyan-400',
        glowHover: 'hover:border-cyan-400/60 shadow-[0_4px_20px_rgba(6,182,212,0.15)]',
        tagText: 'PASS #1',
      },
      {
        borderColor: 'border-slate-600/40',
        bgGradient: 'bg-gradient-to-b from-slate-800/30 via-slate-900/95 to-slate-950',
        badgeClass: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
        accentText: 'text-slate-300',
        glowHover: 'hover:border-slate-400/60 shadow-[0_4px_20px_rgba(148,163,184,0.1)]',
        tagText: 'PASS #2',
      },
      {
        borderColor: 'border-orange-500/40',
        bgGradient: 'bg-gradient-to-b from-orange-950/30 via-slate-900/95 to-slate-950',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        accentText: 'text-orange-400',
        glowHover: 'hover:border-orange-400/60 shadow-[0_4px_20px_rgba(249,115,22,0.15)]',
        tagText: 'PASS #3',
      },
      {
        borderColor: 'border-purple-500/40',
        bgGradient: 'bg-gradient-to-b from-purple-950/30 via-slate-900/95 to-slate-950',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        accentText: 'text-purple-400',
        glowHover: 'hover:border-purple-400/60 shadow-[0_4px_20px_rgba(168,85,247,0.15)]',
        tagText: `PASS #${idx + 1}`,
      },
    ];
    return themes[idx % themes.length];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#0A0D14] border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-left"
        >
          {/* Header Banner with Event Photo */}
          <div className="relative h-40 sm:h-48 w-full overflow-hidden">
            <img
              src={backdropUrl}
              alt={listing.eventName}
              className="w-full h-full object-cover object-center contrast-125 saturate-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14]/90 via-transparent to-[#0A0D14]/60" />

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer z-20"
              title="Đóng modal"
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
                  <span>
                    {isAllOrNothing ? `Combo · ${bundleCount} vé` : `Gói ${bundleCount} vé (Tách vé được)`}
                  </span>
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
          <div className="p-5 sm:p-6 space-y-6 max-h-[calc(88vh-180px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Top Bar: Live Status & Total Summary Box (3D Dispenser Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    {isBundle ? 'DISPENSED SMART PASS BUNDLE' : 'VERIFIED SMART PASS'}
                  </span>
                  {isBundle && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      {isAllOrNothing ? 'Combo trọn gói' : 'Tùy chọn tách lẻ'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                    {formatEventDateTime(listing.eventStartAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300 truncate max-w-xs sm:max-w-md" title={listing.eventVenue}>
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {listing.eventVenue}
                  </span>
                </div>
              </div>

              {/* Total Summary Pill */}
              <div className="flex items-center space-x-3 bg-slate-950/70 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {isBundle ? `Tổng cộng ${activeCount} Vé` : 'Giá vé niêm yết'}
                  </div>
                  <div className="text-lg font-mono font-bold text-white">
                    {formatVND(totalResalePrice)}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                  ĐÃ XÁC THỰC
                </span>
              </div>
            </div>

            {/* Smart Pass Tickets Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>
                    {isBundle
                      ? isAllOrNothing
                        ? `Danh sách Smart Pass trong Gói (${bundleCount} vé)`
                        : `Danh sách Smart Pass (${activeCount}/${effectiveBundleListings.length} vé đã chọn)`
                      : 'Chi tiết Smart Pass'}
                  </span>
                </span>

                {listing.organizerName && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-zinc-500" />
                    <span>BTC: {listing.organizerName}</span>
                  </span>
                )}
              </div>

              {/* Toggle select all if bundle permits individual buying */}
              {isBundle && effectiveBundleListings.length > 1 && !isAllOrNothing && (
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-zinc-400">
                    Tick chọn từng vé bạn muốn mua:
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="text-xs font-semibold text-[#FF5A36] hover:text-[#FF7252] transition-colors cursor-pointer"
                  >
                    {selectedListingIds.length === effectiveBundleListings.length ? 'Bỏ chọn bớt' : 'Chọn tất cả'}
                  </button>
                </div>
              )}

              {/* Grid Cards Container */}
              {isBundle && effectiveBundleListings.length > 1 ? (
                <div
                  className={`grid grid-cols-1 ${
                    effectiveBundleListings.length === 2
                      ? 'md:grid-cols-2'
                      : 'md:grid-cols-2 lg:grid-cols-3'
                  } gap-4`}
                >
                  {effectiveBundleListings.map((t, idx) => {
                    const theme = getTicketTheme(idx);
                    const isSelected = selectedListingIds.includes(t.listingId);
                    return (
                      <div
                        key={t.listingId || idx}
                        onClick={() => !isAllOrNothing && handleToggleTicket(t.listingId)}
                        className={`group relative rounded-2xl p-5 border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 ${
                          theme.bgGradient
                        } ${
                          !isAllOrNothing && !isSelected
                            ? 'opacity-40 border-white/10'
                            : `${theme.borderColor} ${theme.glowHover}`
                        } ${!isAllOrNothing ? 'cursor-pointer hover:border-white/30' : ''}`}
                      >
                        {/* Top notch cutout decoration (Dispenser Style) */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0A0D14] border border-white/15 shadow-inner" />

                        <div>
                          {/* Card Top Row */}
                          <div className="flex items-center justify-between mb-3 pt-2">
                            <div className="flex items-center gap-2">
                              {!isAllOrNothing && (
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? 'bg-[#FF5A36] text-white'
                                      : 'border border-white/30 bg-white/5'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              )}
                              <span
                                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${theme.badgeClass}`}
                              >
                                {theme.tagText}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                              {listing.organizerName ? `${listing.organizerName} Pass` : 'Smart Pass'}
                            </span>
                          </div>

                          <div className="font-bold text-base text-white mb-1">
                            {t.tierName || listing.tierName || 'Hạng Vé Chính Thức'}
                          </div>
                          <div className="text-xs text-amber-400 font-mono font-semibold mb-3 truncate">
                            {t.seatZone || listing.seatZone || 'Khu vực khán đài'}
                          </div>

                          {/* Info Rows */}
                          <div className="space-y-1.5 text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Cổng vào:</span>
                              <span className="text-white">Cổng {String.fromCharCode(65 + (idx % 4))} (Đông)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Vị trí:</span>
                              <span className="text-white font-medium">
                                {t.seatZone || `Seat #${String(idx + 1).padStart(2, '0')}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Giá vé:</span>
                              <span className="text-emerald-400 font-bold">
                                {formatVND(t.resalePrice || perTicketResalePrice)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Barcode & Security ID */}
                        <div className="mt-4 pt-3.5 border-t border-dashed border-white/15">
                          <div className="h-8 bg-white/95 rounded flex items-center justify-center p-1 space-x-1 mb-2 shadow-inner">
                            {Array.from({ length: 28 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-full bg-slate-950 ${
                                  i % 4 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-[1px]'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span className="truncate max-w-[140px] tracking-wider">
                              {t.maskedTicketCode || `AT-2026-${String(idx + 1).padStart(4, '0')}`}
                            </span>
                            <span className={theme.accentText}>NFC ENCRYPTED</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single Ticket Card */
                <div className="relative rounded-2xl p-6 border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 via-slate-900/95 to-slate-950 shadow-xl overflow-hidden max-w-xl mx-auto">
                  {/* Top notch cutout decoration */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0A0D14] border border-white/15 shadow-inner" />

                  <div className="flex items-center justify-between mb-3 pt-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      SMART PASS #1
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {listing.organizerName ? `${listing.organizerName} Pass` : 'Official Pass'}
                    </span>
                  </div>

                  <div className="font-bold text-lg text-white mb-1">
                    {listing.tierName || 'Hạng Vé Chính Thức'}
                  </div>
                  <div className="text-xs text-amber-400 font-mono font-semibold mb-4">
                    {listing.seatZone || 'Khu vực khán đài'}
                  </div>

                  <div className="space-y-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cổng vào:</span>
                      <span className="text-white">Cổng chính</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vị trí:</span>
                      <span className="text-white font-medium">{listing.seatZone || 'Khán đài'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Giá niêm yết:</span>
                      <span className="text-emerald-400 font-bold">{formatVND(listing.resalePrice)}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-dashed border-white/15">
                    <div className="h-9 bg-white/95 rounded flex items-center justify-center p-1.5 space-x-1 mb-2">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-full bg-slate-950 ${
                            i % 4 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-[1px]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                      <span>{listing.maskedTicketCode || 'AT-2026-XXXX'}</span>
                      <span className="text-cyan-400 font-bold">NFC ENCRYPTED</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Breakdown Card */}
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
                    {isBundle
                      ? isAllOrNothing
                        ? `Tổng thanh toán (${bundleCount} vé)`
                        : `Tổng thanh toán (${activeCount} vé đã chọn)`
                      : 'Tổng thanh toán'}
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

            {/* Seller & Rules Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 pt-1">
              {listing.sellerFullName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>
                    Người bán: <strong className="text-zinc-200">{listing.sellerFullName}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Sàn đóng trước giờ diễn sự kiện 2 tiếng</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-[#07090E] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Xác thực bởi {listing.organizerName || 'Ban tổ chức'} & TicketShield Escrow Protocol
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Đóng lại
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
                    const target = activeBundleListings[0] || listing;
                    onBuy(target);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-lg shadow-[#FF5A36]/30 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>
                    {isBundle
                      ? isAllOrNothing
                        ? `Mua Combo (${bundleCount} Vé)`
                        : `Mua ${activeCount} Vé (${formatVND(totalResalePrice)})`
                      : 'Tiến hành mua vé'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
