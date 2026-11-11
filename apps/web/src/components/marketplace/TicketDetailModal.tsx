import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
} from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatEventDateTime, formatVND } from '../../utils/formatters';
import { detectSeatAdjacency } from '../../utils/seatAdjacency';

interface TicketDetailModalProps {
  listing: MarketplaceListingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: (listing: MarketplaceListingDto, isIndividual?: boolean) => void;
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
  const perTicketOriginalPrice = Math.round(totalOriginalPrice / (bundleCount || 1));

  const displayTickets = useMemo(() => {
    if (effectiveBundleListings.length > 1) {
      return effectiveBundleListings.map((item, idx) => ({
        id: item.listingId || `ticket-${idx}`,
        ticketIndex: idx + 1,
        tierName: item.tierName || listing.tierName || 'VIP ZONE',
        seatZone: item.seatZone || `Seat #${idx + 1}`,
        originalPrice: item.originalPrice || perTicketOriginalPrice,
        price: item.resalePrice || perTicketResalePrice,
        code: item.maskedTicketCode || `AT*******${String(idx + 1).padStart(2, '0')}`,
      }));
    }

    if (isBundle && bundleCount >= 2) {
      if (adjacency.seatNumbers.length >= bundleCount) {
        return adjacency.seatNumbers.slice(0, bundleCount).map((sn, idx) => ({
          id: `seat-${sn}-${idx}`,
          ticketIndex: idx + 1,
          tierName: listing.tierName || 'VIP ZONE A',
          seatZone: adjacency.commonRow ? `Row ${adjacency.commonRow} · Seat ${sn}` : `Seat ${sn}`,
          originalPrice: perTicketOriginalPrice,
          price: perTicketResalePrice,
          code: listing.maskedTicketCode
            ? `${listing.maskedTicketCode.slice(0, -2)}${String(idx + 1).padStart(2, '0')}`
            : `AT*******${String(idx + 1).padStart(2, '0')}`,
        }));
      }

      return Array.from({ length: bundleCount }, (_, idx) => ({
        id: `ticket-${idx}`,
        ticketIndex: idx + 1,
        tierName: listing.tierName || 'VIP ZONE A',
        seatZone: listing.seatZone ? `${listing.seatZone} (Ticket #${idx + 1})` : `Seat #${idx + 1}`,
        originalPrice: perTicketOriginalPrice,
        price: perTicketResalePrice,
        code: listing.maskedTicketCode || `AT*******${String(idx + 1).padStart(2, '0')}`,
      }));
    }

    return [
      {
        id: listing.listingId,
        ticketIndex: 1,
        tierName: listing.tierName || 'VIP ZONE A',
        seatZone: listing.seatZone || 'General Seating',
        originalPrice: listing.originalPrice,
        price: listing.resalePrice,
        code: listing.maskedTicketCode || 'AT*******99',
      },
    ];
  }, [
    effectiveBundleListings,
    isBundle,
    bundleCount,
    adjacency.seatNumbers,
    adjacency.commonRow,
    listing.tierName,
    listing.seatZone,
    listing.originalPrice,
    listing.resalePrice,
    listing.maskedTicketCode,
    listing.listingId,
    perTicketOriginalPrice,
    perTicketResalePrice,
  ]);

  const isRetailAllowed = listing.isBundleAllOrNothing === false;

  // Selection state for individual retail sale tickets (Ảnh 2)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Do NOT auto select on open; start with empty selection (0/N tickets) so user chooses
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen, listing?.listingId]);

  const activeSelectedTickets = useMemo(() => {
    return isRetailAllowed && isBundle
      ? displayTickets.filter((t) => selectedIds.includes(t.id))
      : displayTickets;
  }, [isRetailAllowed, isBundle, displayTickets, selectedIds]);

  const currentSelectedCount = activeSelectedTickets.length;
  const isAllSelected = isBundle && currentSelectedCount === displayTickets.length && displayTickets.length > 0;

  const dynamicResaleTotal = useMemo(() => {
    return isRetailAllowed && isBundle
      ? activeSelectedTickets.reduce((sum, t) => sum + (t.price || 0), 0)
      : totalResalePrice;
  }, [isRetailAllowed, isBundle, activeSelectedTickets, totalResalePrice]);

  const dynamicOriginalTotal = useMemo(() => {
    return isRetailAllowed && isBundle
      ? activeSelectedTickets.reduce((sum, t) => sum + (t.originalPrice || 0), 0)
      : totalOriginalPrice;
  }, [isRetailAllowed, isBundle, activeSelectedTickets, totalOriginalPrice]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayTickets.map((t) => t.id));
    }
  };

  const handleToggleTicket = (ticketId: string) => {
    setSelectedIds((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#090C12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 my-auto text-left"
        >
          {/* Header Banner */}
          <div className="relative h-28 w-full overflow-hidden">
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
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badges in Header */}
            <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
              <span className="px-2.5 py-0.5 rounded-full bg-black/75 border border-white/20 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
                {listing.tierName || 'VIP ZONE'}
              </span>

              {isBundle && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF5A36] text-white text-[11px] font-extrabold tracking-wider uppercase shadow-sm">
                  <Layers className="w-3 h-3 text-white" />
                  <span>COMBO · {bundleCount} TICKETS</span>
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
            {/* Event Meta Line */}
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

            {/* Authentic Visual Ticket Stubs with Interactive Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1.5 text-white">
                  <Ticket className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>
                    {isBundle ? `Tickets in Bundle (${bundleCount})` : 'Ticket Details'}
                  </span>
                </span>
                {isBundle && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide ${
                      isRetailAllowed
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 border border-white/10'
                    }`}
                  >
                    {isRetailAllowed ? 'Individual Sale' : 'Bundle Only'}
                  </span>
                )}
              </div>

              {/* Minimal Selection Bar */}
              {isRetailAllowed && isBundle && (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Selected {currentSelectedCount}/{displayTickets.length} tickets
                    </span>
                    {currentSelectedCount === 1 && (
                      <span className="text-xs text-[#FF5A36] font-medium">
                        (Ticket #{activeSelectedTickets[0]?.ticketIndex})
                      </span>
                    )}
                    {isAllSelected && (
                      <span className="text-xs text-zinc-400 font-medium">
                        (All tickets)
                      </span>
                    )}
                  </div>

                  {/* Master Checkbox: Select All */}
                  <div
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white cursor-pointer select-none transition-colors group"
                  >
                    <span className="group-hover:text-white">
                      {isAllSelected ? 'Deselect All' : 'Select All'}
                    </span>
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isAllSelected
                          ? 'bg-[#FF5A36] border-[#FF5A36] text-white shadow-sm'
                          : 'border-zinc-500 bg-black/40 group-hover:border-zinc-300'
                      }`}
                    >
                      {isAllSelected && <Check className="w-3.5 h-3.5 stroke-[3.5] text-white" />}
                    </div>
                  </div>
                </div>
              )}

              {/* Authentic Ticket Stubs: Chuẩn Marketplace TicketCard với viền cam toàn phần, SVG Contours & Paper texture */}
              <div className="space-y-3">
                {displayTickets.map((t) => {
                  const isSelected = isRetailAllowed && isBundle ? selectedIds.includes(t.id) : true;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (isRetailAllowed && isBundle) {
                          handleToggleTicket(t.id);
                        }
                      }}
                      className={`group relative isolate w-full h-[140px] sm:h-[148px] select-none transition-transform duration-150 ease-out ${
                        isRetailAllowed && isBundle ? 'cursor-pointer hover:-translate-y-0.5' : ''
                      }`}
                    >
                      {/* ================= MASKED TICKET CONTAINER (Cutout Notches via CSS Mask at 65%) ================= */}
                      <div
                        className={`relative w-full h-full flex rounded-2xl overflow-hidden border transition-colors duration-150 ease-out ${
                          isRetailAllowed && isBundle
                            ? isSelected
                              ? 'border-[#FF5A36] shadow-[0_4px_20px_rgba(255,90,54,0.35)]'
                              : 'border-white/10 group-hover:border-[#FF5A36] shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:shadow-[0_6px_20px_rgba(255,90,54,0.25)]'
                            : 'border-white/10 group-hover:border-[#FF5A36] shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:shadow-[0_6px_20px_rgba(255,90,54,0.25)]'
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
                        {/* LEFT BODY (65% width): Dark concert atmosphere */}
                        <div className="relative w-[65%] h-full rounded-l-2xl overflow-hidden flex flex-col justify-between p-3 sm:p-3.5 bg-[#0a0c10]">
                          {/* Image Backdrop */}
                          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            <img
                              src={backdropUrl}
                              alt={listing.eventName}
                              className="w-full h-full object-cover object-center contrast-125 saturate-110 opacity-55"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/95 via-[#0a0c10]/85 to-[#0b0d13]/95" />
                          </div>

                          {/* Header Row: Tier badge & Ticket Index */}
                          <div className="relative z-10 flex items-center justify-between gap-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/20 bg-black/75 backdrop-blur-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] shadow-[0_0_6px_#FF5A36] animate-pulse" />
                              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white truncate max-w-[120px]">
                                {t.tierName}
                              </span>
                            </div>

                            <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-mono text-[9px] font-extrabold uppercase tracking-wider">
                              TICKET #{t.ticketIndex}
                            </span>
                          </div>

                          {/* Event Title */}
                          <div className="relative z-10 my-0.5">
                            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug truncate drop-shadow-sm">
                              {listing.eventName}
                            </h3>
                          </div>

                          {/* Metadata */}
                          <div className="relative z-10 space-y-0.5 text-[10px] sm:text-[11px] text-zinc-300">
                            <div className="flex items-center gap-1.5 text-amber-200 font-semibold truncate">
                              <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{t.seatZone}</span>
                            </div>

                            <div className="flex items-center justify-between text-zinc-400 text-[10px] pt-1 border-t border-white/[0.08]">
                              <div className="flex items-center gap-1 truncate">
                                <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{formatEventDateTime(listing.eventStartAt)}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 text-zinc-300">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span className="truncate">{listing.sellerFullName ? `Seller: ${listing.sellerFullName}` : 'Seller: Verified'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT STUB (35% width): Paper texture stub matching TicketCard */}
                        <div className="relative w-[35%] h-full bg-[#e2e8f0] rounded-r-2xl overflow-hidden flex flex-col justify-between p-2.5 sm:p-3 text-slate-900 paper-texture shadow-inner">
                          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

                          <div className="flex items-center justify-between">
                            <div className="px-1.5 py-0.5 rounded bg-slate-300/80 border border-slate-400/50">
                              <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-800">
                                {t.code}
                              </span>
                            </div>

                            {/* Checkbox on the right stub */}
                            {isRetailAllowed && isBundle && (
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-colors duration-150 ${
                                  isSelected
                                    ? 'bg-[#FF5A36] border-[#FF5A36] text-white shadow-sm'
                                    : 'border-slate-400 bg-white group-hover:border-[#FF5A36]'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3.5] text-white" />}
                              </div>
                            )}
                          </div>

                          <div className="my-auto py-0.5 text-left">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              PRICE
                            </div>
                            {t.originalPrice > t.price && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-400 line-through font-medium">
                                  {formatVND(t.originalPrice)}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700">
                                  -{Math.round(((t.originalPrice - t.price) / t.originalPrice) * 100)}%
                                </span>
                              </div>
                            )}
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-base sm:text-lg font-black text-slate-900 leading-none">
                                {formatVND(t.price)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-mono border-t border-slate-300/60 pt-1">
                            <span className="text-slate-500 font-bold">TICKET #{t.ticketIndex}</span>
                            {isRetailAllowed && isBundle && (
                              <span className={isSelected ? 'text-[#FF5A36] font-extrabold' : 'text-slate-500 font-medium group-hover:text-[#FF5A36] transition-colors'}>
                                {isSelected ? 'SELECTED' : 'SELECT'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ================= PERFORATION JUNCTION, NOTCHES & VERTICAL TEAR LINE (Stroke-only transparent cutout matching TicketCard) ================= */}
                      {/* Top Notch Contour Border (bo theo vết khoét bán nguyệt mép trên) */}
                      <div className="absolute left-[65%] top-0 -translate-x-1/2 w-7 h-3.5 z-30 pointer-events-none">
                        <svg viewBox="0 0 28 14" className="w-full h-full block overflow-visible">
                          <path
                            d="M 0,0.5 A 14,14 0 0,0 28,0.5"
                            fill="none"
                            className={`transition-colors duration-150 ease-out ${
                              isSelected ? 'stroke-[#FF5A36]' : 'stroke-white/10 group-hover:stroke-[#FF5A36]'
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
                            className={`transition-colors duration-150 ease-out ${
                              isSelected ? 'stroke-[#FF5A36]' : 'stroke-[#FF5A36]/45 group-hover:stroke-[#FF5A36]'
                            }`}
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
                            className={`transition-colors duration-150 ease-out ${
                              isSelected ? 'stroke-[#FF5A36]' : 'stroke-white/10 group-hover:stroke-[#FF5A36]'
                            }`}
                            strokeWidth="1.5"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              {dynamicOriginalTotal > dynamicResaleTotal && (
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Original face value:</span>
                  <span className="font-mono text-zinc-400 line-through">
                    {formatVND(dynamicOriginalTotal)}
                  </span>
                </div>
              )}

              {isBundle && currentSelectedCount > 1 && (
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Average per ticket:</span>
                  <span className="font-mono text-orange-300 font-bold">
                    ~{formatVND(Math.round(dynamicResaleTotal / currentSelectedCount))} / ticket
                  </span>
                </div>
              )}

              <div className="pt-1.5 border-t border-white/10 flex items-baseline justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white block">
                    {isBundle ? `Total Amount (${currentSelectedCount} tickets)` : 'Total Amount'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#FF5A36]">
                    {formatVND(dynamicResaleTotal)}
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
                    Seller: <strong className="text-zinc-200">{listing.sellerFullName}</strong>
                  </span>
                </div>
                {listing.organizerName && <span>Organizer: {listing.organizerName}</span>}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3.5 sm:p-4 bg-[#06080d] border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              Close
            </button>

            {isTransacting ? (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Lock className="w-3.5 h-3.5" />
                <span>Currently In Checkout</span>
              </div>
            ) : isSold ? (
              <div className="text-xs font-semibold text-zinc-400 px-4 py-2 rounded-xl bg-white/5">
                Sold Out
              </div>
            ) : isOwner ? (
              <div className="text-xs font-semibold text-zinc-400 px-4 py-2 rounded-xl bg-white/5">
                Your Listing
              </div>
            ) : isRetailAllowed && isBundle && currentSelectedCount === 0 ? (
              <button
                type="button"
                disabled
                className="px-5 py-2.5 bg-zinc-800 text-zinc-500 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase cursor-not-allowed border border-white/5"
              >
                Please select tickets
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (isRetailAllowed && isBundle) {
                    if (currentSelectedCount === 1) {
                      const selectedTicket = activeSelectedTickets[0];
                      const matchedItem =
                        effectiveBundleListings.find((l) => l.listingId === selectedTicket.id) ||
                        effectiveBundleListings[selectedTicket.ticketIndex - 1] ||
                        listing;
                      onBuy(matchedItem, true);
                    } else {
                      const anchor = effectiveBundleListings[0] || listing;
                      onBuy(anchor, false);
                    }
                  } else {
                    const target = effectiveBundleListings[0] || listing;
                    onBuy(target, false);
                  }
                }}
                className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md shadow-[#FF5A36]/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>
                  {isRetailAllowed && isBundle
                    ? currentSelectedCount === 1
                      ? `Buy Ticket #${activeSelectedTickets[0]?.ticketIndex}`
                      : currentSelectedCount === displayTickets.length
                        ? `Buy All ${displayTickets.length} Tickets (Bundle)`
                        : `Buy ${currentSelectedCount} Selected Tickets`
                    : isBundle
                      ? `Buy Bundle (${bundleCount} tickets)`
                      : 'Proceed to Checkout'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
