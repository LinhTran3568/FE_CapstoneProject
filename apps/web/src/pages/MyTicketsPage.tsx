import React, { useCallback, useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Check,
  Copy,
  Download,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { useMyTickets } from '../hooks/useMyTickets';
import { useUIStore } from '../stores/uiStore';
import { formatEventDateTime, formatVND } from '../utils/formatters';

const entryPayload = (ticket: PurchasedTicketDto) =>
  (ticket.qrCodeData || ticket.ticketPassCode || '').trim();

/** Returns true if the payload is a base64-encoded PNG/image data URL */
const isBase64Image = (value: string) => value.startsWith('data:image/');

const canShowEntryQr = (ticket: PurchasedTicketDto) => {
  const status = (ticket.status || '').trim().toUpperCase();
  if (status === 'PENDING_PAYMENT' || status === 'REFUNDED' || status === 'REFUNDQUEUED') {
    return false;
  }
  return entryPayload(ticket).length > 0;
};

const getStatusBadge = (ticket: PurchasedTicketDto) => {
  const status = (ticket.status || '').trim().toUpperCase();
  if (status === 'VALID') {
    return {
      label: 'VALID • READY FOR ENTRY',
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
    };
  }
  if (status === 'IN_ESCROW') {
    return {
      label: 'UNDER 24H PROTECTION',
      classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      dotClass: 'bg-cyan-400',
    };
  }
  if (status === 'DISPUTED') {
    return {
      label: 'DISPUTED',
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-400',
    };
  }
  if (status === 'PENDING_PAYMENT') {
    return {
      label: 'PENDING PAYMENT',
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    label: ticket.status || 'OFFICIAL PASS',
    classes: 'bg-white/10 text-white/80 border-white/20',
    dotClass: 'bg-white/60',
  };
};

export const MyTicketsPage: React.FC = () => {
  const { data: tickets = [], isPending, isError, error, refetch, isFetching } = useMyTickets();
  const [qrTicket, setQrTicket] = useState<PurchasedTicketDto | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'escrow'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const showToast = useUIStore((state) => state.showToast);

  const validCount = tickets.filter((t) => (t.status || '').toUpperCase() === 'VALID').length;
  const escrowCount = tickets.filter((t) => (t.status || '').toUpperCase() === 'IN_ESCROW').length;

  const filteredTickets = tickets.filter((ticket) => {
    const status = (ticket.status || '').toUpperCase();
    if (filter === 'valid' && status !== 'VALID') return false;
    if (filter === 'escrow' && status !== 'IN_ESCROW') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (ticket.eventName || '').toLowerCase();
      const venue = (ticket.eventVenue || '').toLowerCase();
      const code = (ticket.ticketPassCode || ticket.qrCodeData || '').toLowerCase();
      const zone = (ticket.seatZone || ticket.tierName || '').toLowerCase();
      return name.includes(q) || venue.includes(q) || code.includes(q) || zone.includes(q);
    }
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#07090E] text-[#F8FAFC] pt-28 pb-24 px-4 sm:px-6 md:px-10 lg:px-12 font-sans antialiased overflow-hidden selection:bg-[#FF573D]/30 selection:text-white">
      {/* Rich Dynamic Atmospheric Background with Motion Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Breathing Slow Zoom on Hero Image */}
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            x: [0, -8, 0],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src="/images/landing/my-tickets-hero.jpg"
            alt=""
            className="w-full h-full object-cover object-center opacity-75 filter brightness-105 contrast-120 saturate-120"
          />
        </motion.div>

        {/* Diagonal Laser Light Sweep Effect */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
            opacity: [0, 0.25, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 3,
          }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FF573D]/30 to-transparent transform -skew-x-12 blur-2xl pointer-events-none"
        />

        {/* Layered Gradient Masks for Perfect Content Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090E]/50 via-[#07090E]/75 to-[#07090E]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090E]/70 via-transparent to-[#07090E]/70" />

        {/* Dynamic Floating Coral Glow Orb */}
        <motion.div
          animate={{
            x: [-30, 40, -30],
            y: [-20, 30, -20],
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF573D]/40 via-[#FF573D]/12 to-transparent blur-3xl"
        />

        {/* Dynamic Floating Cyan Light Orb */}
        <motion.div
          animate={{
            x: [40, -40, 40],
            y: [20, -30, 20],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 -right-20 w-[650px] h-[450px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/25 via-cyan-500/5 to-transparent blur-3xl"
        />

        {/* High-tech Micro Dot Matrix Overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-7">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/10">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight">
              My Purchased Tickets
            </h1>
            <p className="text-sm text-[#9CA3AF]">
              Manage your event tickets and entry passes. Official codes and QR keys issued directly by organizers.
            </p>
          </div>

          {/* Quick Actions & Refresh */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                refetch();
                showToast('Refreshed ticket passes', 'info');
              }}
              disabled={isFetching}
              aria-label="Refresh tickets"
              className="px-3.5 py-2 min-h-10 bg-[#12151C] hover:bg-[#1A1E29] border border-white/10 hover:border-white/20 text-[#CBD5E1] hover:text-white rounded-xl text-xs font-mono font-medium inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FF573D] ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Syncing...' : 'Sync Passes'}</span>
            </button>
          </div>
        </div>

        {/* Stats & Filter Bar */}
        {!isPending && !isError && tickets.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="inline-flex items-center gap-1.5 bg-[#10141D] p-1 rounded-xl border border-white/10 text-xs font-mono self-start">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#FF573D] text-white shadow-md shadow-[#FF573D]/25'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }`}
              >
                All Passes ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('valid')}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                  filter === 'valid'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }`}
              >
                Ready for Entry ({validCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('escrow')}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer ${
                  filter === 'escrow'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }`}
              >
                24h Protected ({escrowCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
              <input
                type="text"
                placeholder="Search event, venue, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#10141D] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:border-[#FF573D] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#94A3B8] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading State: Skeleton Cards */}
        {isPending && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TicketCardSkeleton />
            <TicketCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="py-16 bg-[#12151C]/90 border border-rose-500/20 rounded-3xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-md max-w-xl mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-display">Could not load purchased tickets</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {error instanceof Error
                  ? error.message
                  : 'Unable to communicate with TicketShield services. Please refresh or verify your connection.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-5 py-2.5 min-h-11 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl text-xs font-semibold font-mono inline-flex items-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isPending && !isError && tickets.length === 0 && (
          <div className="py-20 bg-[#10141D]/60 border border-white/10 rounded-3xl p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#FF573D]/20 to-[#FF573D]/5 border border-[#FF573D]/30 text-[#FF573D] flex items-center justify-center shadow-lg shadow-[#FF573D]/10">
              <Ticket className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-white">No Tickets Found</h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                You have not purchased any event tickets yet. Explore verified tickets protected by TicketShield escrow.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-11 bg-[#FF573D] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF573D]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Ticket className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </Link>
          </div>
        )}

        {/* Filtered Empty State */}
        {!isPending && !isError && tickets.length > 0 && filteredTickets.length === 0 && (
          <div className="py-14 bg-[#10141D]/60 border border-white/10 rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-[#94A3B8]">No tickets match the selected filter.</p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-xs font-mono text-[#FF573D] hover:underline"
            >
              Show all tickets
            </button>
          </div>
        )}

        {/* Tickets Grid: Balanced 1 column if 1 item, 2 columns if multiple */}
        {!isPending && !isError && filteredTickets.length > 0 && (
          <div
            className={`grid gap-6 ${
              filteredTickets.length === 1 ? 'grid-cols-1 max-w-3xl mx-auto' : 'grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {filteredTickets.map((ticket) => (
              <OfficialTicketPassCard
                key={ticket.escrowId || ticket.listingId}
                ticket={ticket}
                onViewQr={() => setQrTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Entry QR Modal */}
      {qrTicket && (
        <EntryQrModal ticket={qrTicket} onClose={() => setQrTicket(null)} />
      )}
    </div>
  );
};

/**
 * Official Digital Pass Card Component
 * Styled with realistic ticket aesthetics (event info on left, ticket stub with perforated divider on right)
 */
interface OfficialTicketPassCardProps {
  ticket: PurchasedTicketDto;
  onViewQr: () => void;
}

const OfficialTicketPassCard: React.FC<OfficialTicketPassCardProps> = ({ ticket, onViewQr }) => {
  const showToast = useUIStore((state) => state.showToast);
  const [copied, setCopied] = useState(false);
  const badge = getStatusBadge(ticket);
  const hasQr = canShowEntryQr(ticket);
  const code = ticket.ticketPassCode || (hasQr ? entryPayload(ticket) : '');

  const handleCopyCode = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!code) return;
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Copied ticket code to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    },
    [code, showToast]
  );

  return (
    <div className="group relative bg-[#0E121A]/95 backdrop-blur-md border border-white/10 hover:border-[#FF573D]/40 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_35px_rgba(255,87,61,0.12)] flex flex-col md:flex-row">
      {/* LEFT SECTION: Event Main Details */}
      <div className="relative flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4 overflow-hidden">
        {/* Content Container */}
        <div className="relative z-10 space-y-3.5">
          {/* Top Status & Zone Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF573D]/15 border border-[#FF573D]/30 text-[11px] font-mono font-bold text-[#FF573D] uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF573D]" />
              <span>{ticket.seatZone || ticket.tierName || 'GENERAL ADMISSION'}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider uppercase ${badge.classes}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
              <span>{badge.label}</span>
            </span>
          </div>

          {/* Event Title */}
          <h3 className="text-lg sm:text-xl font-bold font-display text-white group-hover:text-[#FF573D] transition-colors leading-snug line-clamp-2">
            {ticket.eventName}
          </h3>

          {/* Date, Location & Holder Metadata */}
          <div className="space-y-2 text-xs text-[#94A3B8] font-sans">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#FF573D] shrink-0" />
              <span className="text-white font-medium truncate">
                {ticket.eventStartAt ? formatEventDateTime(ticket.eventStartAt) : 'Date & Time Announced by Organizer'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[#CBD5E1] truncate">
                {ticket.eventVenue || 'Official Venue Stated on Ticket'}
              </span>
            </div>

            {ticket.recipientName && (
              <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Pass Holder: <strong className="text-white font-medium">{ticket.recipientName}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Left: Protection Guarantee */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
          <div className="inline-flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>24h Escrow Protection Active</span>
          </div>
          <span className="text-white font-bold">{formatVND(ticket.totalAmountPaid)}</span>
        </div>
      </div>

      {/* PERFORATED NOTCH DIVIDER (Ticket Tear-line) */}
      <div className="relative hidden md:flex flex-col items-center justify-between w-0 shrink-0 z-20">
        {/* Top semi-circle cutout */}
        <div className="w-5 h-5 rounded-full bg-[#07090E] border-b border-white/10 -mt-2.5" />
        {/* Dashed vertical separator */}
        <div className="w-[1px] h-full border-r border-dashed border-white/15 my-1" />
        {/* Bottom semi-circle cutout */}
        <div className="w-5 h-5 rounded-full bg-[#07090E] border-t border-white/10 -mb-2.5" />
      </div>

      {/* Mobile Horizontal Divider */}
      <div className="md:hidden relative flex items-center justify-between h-0 w-full z-20">
        <div className="w-5 h-5 rounded-full bg-[#07090E] border-r border-white/10 -ml-2.5" />
        <div className="w-full border-t border-dashed border-white/15 mx-1" />
        <div className="w-5 h-5 rounded-full bg-[#07090E] border-l border-white/10 -mr-2.5" />
      </div>

      {/* RIGHT SECTION: Pass Stub & Entry Actions */}
      <div className="w-full md:w-56 lg:w-60 bg-[#121620] p-5 sm:p-6 flex flex-col justify-between space-y-4 shrink-0 border-t md:border-t-0 md:border-l border-white/10">
        {/* Ticket Code Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
            <span>Pass Code</span>
            <span className="text-emerald-400 font-bold">100% Genuine</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#090C12] border border-white/10 flex items-center justify-between gap-2 group/code">
            <span className="text-xs font-mono font-bold text-white tracking-wider truncate">
              {code || 'ISSUING...'}
            </span>
            {code ? (
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Ticket Code"
                className="p-1 rounded-md text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Decorative Mini Barcode / Security Strip */}
        <div className="space-y-1.5 text-center">
          <div className="h-6 flex items-center justify-center gap-[3px] opacity-40">
            <span className="w-0.5 h-full bg-white" />
            <span className="w-1.5 h-full bg-white" />
            <span className="w-0.5 h-full bg-white" />
            <span className="w-1 h-full bg-white" />
            <span className="w-0.5 h-full bg-white" />
            <span className="w-2 h-full bg-white" />
            <span className="w-0.5 h-full bg-white" />
            <span className="w-1 h-full bg-white" />
            <span className="w-1.5 h-full bg-white" />
            <span className="w-0.5 h-full bg-white" />
          </div>
          <p className="text-[10px] font-mono text-[#94A3B8] tracking-widest uppercase">
            Official TicketShield Pass
          </p>
        </div>

        {/* Action Button */}
        <div>
          {hasQr ? (
            <button
              type="button"
              onClick={onViewQr}
              className="w-full py-2.5 px-4 min-h-11 bg-[#FF573D] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF573D]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>View Entry QR</span>
            </button>
          ) : (
            <div className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <p className="text-[11px] font-mono font-semibold text-amber-400 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Issuing Pass...</span>
              </p>
              <p className="text-[10px] text-[#94A3B8] leading-tight">
                Organizer is generating your official entry QR.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Entry QR Modal Component
 * Renders high-resolution official pass QR code with one-click download to PNG.
 */
interface EntryQrModalProps {
  ticket: PurchasedTicketDto;
  onClose: () => void;
}

const EntryQrModal: React.FC<EntryQrModalProps> = ({ ticket, onClose }) => {
  const titleId = useId();
  const showToast = useUIStore((state) => state.showToast);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const payload = entryPayload(ticket);
  const code = ticket.ticketPassCode || (isBase64Image(payload) ? '' : payload);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCopyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Copied ticket code to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [code, showToast]);

  const handleDownloadQr = useCallback(() => {
    try {
      setIsDownloading(true);
      const safeTicketCode = (ticket.ticketPassCode || ticket.escrowId || 'ticket').replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      );
      const filename = `TicketShield-${safeTicketCode}.png`;

      // 1. If backend gave base64 data URL
      if (isBase64Image(payload)) {
        const link = document.createElement('a');
        link.href = payload;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Tải mã QR vé thành công!', 'success');
        setIsDownloading(false);
        return;
      }

      // 2. If rendered via QRCodeCanvas
      const sourceCanvas = document.getElementById('official-entry-qr-canvas') as HTMLCanvasElement | null;
      if (sourceCanvas) {
        // Create high-res offscreen canvas with white background and clean margins
        const padding = 28;
        const offscreen = document.createElement('canvas');
        offscreen.width = sourceCanvas.width + padding * 2;
        offscreen.height = sourceCanvas.height + padding * 2;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);
          ctx.drawImage(sourceCanvas, padding, padding);
          const dataUrl = offscreen.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('Tải mã QR vé thành công!', 'success');
          setIsDownloading(false);
          return;
        }
      }

      showToast('Không thể tạo file ảnh QR lúc này.', 'error');
      setIsDownloading(false);
    } catch (err) {
      console.error('Failed to download QR image:', err);
      showToast('Lỗi khi tải mã QR.', 'error');
      setIsDownloading(false);
    }
  }, [payload, ticket.escrowId, ticket.ticketPassCode, showToast]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[#10141D] border border-white/20 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative text-center"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 min-w-10 min-h-10 inline-flex items-center justify-center rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF573D]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>OFFICIAL ENTRY PASS</span>
          </div>
          <h2 id={titleId} className="text-xl font-bold font-display text-white leading-tight">
            {ticket.eventName}
          </h2>
          <p className="text-xs font-mono text-[#94A3B8]">
            {ticket.seatZone || ticket.tierName || 'Standard Entry'} • {ticket.eventVenue || 'Venue entrance'}
          </p>
        </div>

        {/* Official QR Code Box */}
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-white inline-block">
            {isBase64Image(payload) ? (
              <img
                src={payload}
                alt="Official Ticket QR Code"
                className="w-[200px] h-[200px] object-contain rounded-lg"
              />
            ) : (
              <QRCodeCanvas
                id="official-entry-qr-canvas"
                value={payload}
                size={200}
                level="H"
                includeMargin={false}
              />
            )}
          </div>

          {/* Ticket Pass Code with Copy */}
          {code && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080B10] border border-white/10">
              <span className="text-xs font-mono font-bold text-[#FF573D] tracking-wider">
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Pass Code"
                className="p-1 rounded text-[#94A3B8] hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <p className="text-xs text-[#94A3B8] max-w-xs leading-relaxed">
            Show this official QR code to event staff at the gate for rapid scanner check-in.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={isDownloading}
            className="flex-1 py-3 px-4 min-h-11 bg-[#FF573D] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF573D]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download QR Code</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 min-h-11 bg-white/5 hover:bg-white/10 text-[#CBD5E1] hover:text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Ticket Pass Cards
 */
const TicketCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#0E121A] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6 animate-pulse">
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-28 h-5 bg-white/10 rounded-full" />
          <div className="w-24 h-5 bg-white/10 rounded-full" />
        </div>
        <div className="w-3/4 h-7 bg-white/10 rounded-lg" />
        <div className="space-y-2">
          <div className="w-1/2 h-4 bg-white/10 rounded" />
          <div className="w-2/3 h-4 bg-white/10 rounded" />
        </div>
        <div className="pt-3 border-t border-white/10 flex justify-between">
          <div className="w-32 h-4 bg-white/10 rounded" />
          <div className="w-20 h-4 bg-white/10 rounded" />
        </div>
      </div>
      <div className="w-full md:w-52 bg-[#121620] p-4 rounded-2xl flex flex-col justify-between space-y-3">
        <div className="w-full h-8 bg-white/10 rounded-lg" />
        <div className="w-full h-6 bg-white/10 rounded" />
        <div className="w-full h-10 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
};

export default MyTicketsPage;
