import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Tag,
  Ticket,
  Undo2,
  XCircle,
  Clock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import type { ListingStatus, SellerListingDto } from '@ticketshield/types';
import { useUIStore } from '../stores/uiStore';
import { useCancelListing, useMyListings } from '../hooks/useMyListings';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatEventDateTime, formatVND } from '../utils/formatters';
import { buildPrivateShareLink, copyToClipboard } from '../utils/shareLink';

type StatusFilter = 'all' | 'Verified' | 'Transacting' | 'Sold' | 'Cancelled' | 'Expired';

const ITEMS_PER_PAGE = 5;

interface FilterTabOption {
  key: StatusFilter;
  label: string;
}

const FILTER_TABS: FilterTabOption[] = [
  { key: 'all', label: 'ALL' },
  { key: 'Verified', label: 'ON SALE' },
  { key: 'Transacting', label: '24H PROTECTION' },
  { key: 'Sold', label: 'SOLD' },
  { key: 'Cancelled', label: 'CANCELLED' },
  { key: 'Expired', label: 'EXPIRED' },
];

const TOAST_CANCEL_SUCCESS = 'Listing cancelled successfully. The original ticket has been unlocked by the Organizer.';
const TOAST_CANCEL_ERROR = 'Could not contact the organizer to unlock the ticket. Please try again later.';
const ESCROW_LOCKED_NOTICE =
  'Funds held safely under 24-hour protection — Automatic payout upon completion';

/** Only listings nobody has bought yet can be cancelled (backend rule). */
const canCancel = (listing: SellerListingDto) => listing.listingStatus === 'Verified';

/** Private links are worth sharing only while the listing is still live. */
const canCopyLink = (listing: SellerListingDto) =>
  listing.isPrivate &&
  !!listing.privateAccessToken &&
  (listing.listingStatus === 'Verified' || listing.listingStatus === 'Transacting');

/** Deterministic event poster image selector based on event name or listing id */
const getEventThumbnail = (listing: SellerListingDto, index: number) => {
  const images = [
    '/images/landing/featured-1.jpg',
    '/images/landing/featured-2.jpg',
    '/images/landing/concert.jpg',
    '/images/landing/festival.jpg',
    '/images/landing/hero-concert.jpg',
  ];
  const charCodeSum = listing.listingId
    ? listing.listingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : index;
  return images[charCodeSum % images.length];
};

export const MyListingsPage: React.FC = () => {
  const { showToast } = useUIStore();
  const { data: listings = [], isPending, isError, error, refetch, isFetching } = useMyListings();
  const cancelMutation = useCancelListing();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listingToCancel, setListingToCancel] = useState<SellerListingDto | null>(null);
  const [copiedListingId, setCopiedListingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: listings.length,
      Verified: 0,
      Transacting: 0,
      Sold: 0,
      Cancelled: 0,
      Expired: 0,
    };
    listings.forEach((listing) => {
      if (listing.listingStatus in result) {
        result[listing.listingStatus as StatusFilter] += 1;
      }
    });
    return result;
  }, [listings]);

  const visibleListings = useMemo(() => {
    if (filter === 'all') return listings;
    return listings.filter((l) => l.listingStatus === filter);
  }, [filter, listings]);

  const totalPages = Math.max(1, Math.ceil(visibleListings.length / ITEMS_PER_PAGE));

  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleListings.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleListings, currentPage]);

  const handleFilterChange = (newFilter: StatusFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleCopyLink = async (listing: SellerListingDto) => {
    if (!listing.privateAccessToken) return;
    try {
      await copyToClipboard(buildPrivateShareLink(listing.privateAccessToken));
      setCopiedListingId(listing.listingId);
      showToast('Private link copied to clipboard! Share this link with your buyer.', 'success');
      window.setTimeout(() => setCopiedListingId(null), 2500);
    } catch {
      showToast('Could not copy link. Please try again!', 'error');
    }
  };

  const resetCancelMutation = cancelMutation.reset;
  const closeCancelModal = useCallback(() => {
    setListingToCancel(null);
    resetCancelMutation();
  }, [resetCancelMutation]);

  const handleConfirmCancel = () => {
    if (!listingToCancel) return;
    cancelMutation.mutate(listingToCancel.listingId, {
      onSuccess: () => {
        showToast(TOAST_CANCEL_SUCCESS, 'success');
        setListingToCancel(null);
      },
      onError: (err) => {
        console.error('Cancel listing failed:', err);
        showToast(TOAST_CANCEL_ERROR, 'error');
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] pt-28 pb-24 px-4 sm:px-6 md:px-12 font-sans antialiased selection:bg-[#FF5A36] selection:text-white overflow-hidden">
      {/* Inline Animation Styles for Cinematic Concert Atmosphere */}
      <style>{`
        @keyframes kenburnsConcert {
          0% { transform: scale(1.02) translate(0, 0); filter: brightness(1.1) contrast(1.2); }
          50% { transform: scale(1.08) translate(-1%, -1%); filter: brightness(1.2) contrast(1.25); }
          100% { transform: scale(1.02) translate(0, 0); filter: brightness(1.1) contrast(1.2); }
        }
        @keyframes concertSpotlight {
          0% { transform: rotate(-25deg) translateY(-10%) translateX(-15%); opacity: 0.3; }
          50% { transform: rotate(20deg) translateY(10%) translateX(20%); opacity: 0.6; }
          100% { transform: rotate(-25deg) translateY(-10%) translateX(-15%); opacity: 0.3; }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        .animate-kenburns-concert {
          animation: kenburnsConcert 24s ease-in-out infinite;
        }
        .animate-concert-spotlight {
          animation: concertSpotlight 6s ease-in-out infinite alternate;
        }
        .animate-ambient-pulse {
          animation: ambientPulse 5s ease-in-out infinite;
        }
      `}</style>

      {/* Full-Page Cinematic Concert Background with Dynamic Lighting */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/landing/festival.jpg"
          alt="Live Music Festival Arena"
          className="w-full h-full object-cover opacity-50 animate-kenburns-concert transform-gpu origin-center"
        />
        {/* Sweeping Concert Spotlight Beam */}
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-[#FF5A36]/30 to-transparent blur-3xl animate-concert-spotlight pointer-events-none" />
        
        {/* Ambient Stage Lights */}
        <div className="absolute top-10 -left-20 w-96 h-96 bg-[#FF5A36]/20 rounded-full blur-3xl animate-ambient-pulse pointer-events-none" />
        <div className="absolute top-32 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-ambient-pulse pointer-events-none" style={{ animationDelay: '2.5s' }} />

        {/* Natural gradient fade into dark bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/60 via-[#05070A]/80 to-[#05070A]/95" />
      </div>

      <div className="relative z-10 max-w-[1220px] mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/[0.06]">
          <div className="space-y-2">
            <span className="text-[11px] font-bold font-mono uppercase tracking-[0.18em] text-[#FF5A36] block">
              SELLER CONSOLE
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display uppercase tracking-tight text-[#F5F5F5] leading-none">
              MY LISTINGS
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1 text-sm text-[#8B929C]">
              <p>Manage your tickets and track your resale activity.</p>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="text-xs font-mono font-medium text-[#F5F5F5]/80 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06] shrink-0">
                {counts.all} total listings · {counts.Verified} active · {counts.Sold} sold
              </span>
            </div>
          </div>

          <Link
            to="/sell-ticket"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 hover:shadow-xl hover:shadow-[#FF5A36]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ SELL A TICKET</span>
          </Link>
        </div>

        {/* Status Filter — Unified Segmented Filter Container */}
        <div className="bg-[#0B0E12] border border-white/[0.08] rounded-2xl p-1.5 shadow-xl backdrop-blur-md">
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
            role="tablist"
            aria-label="Filter listings by status"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = filter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`flex-1 min-w-[120px] sm:min-w-0 py-2.5 px-4 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#11151B] text-[#F5F5F5] border border-[#FF5A36] shadow-[0_0_15px_rgba(255,90,54,0.15)] ring-1 ring-[#FF5A36]/20'
                      : 'text-[#8B929C] hover:text-[#F5F5F5] hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums transition-colors ${
                      isActive
                        ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-extrabold'
                        : 'bg-white/[0.05] text-[#8B929C]'
                    }`}
                  >
                    {isPending ? '–' : count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listings Section */}
        <div className="space-y-4">
          {/* Loading Skeleton */}
          {isPending && <ListingSkeleton />}

          {/* Error State */}
          {isError && (
            <div className="py-16 px-6 bg-[#0B0E12] border border-white/[0.08] rounded-2xl flex flex-col items-center text-center gap-3.5 shadow-xl">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#F5F5F5] text-lg font-display">Unable to load listings</h4>
              <p className="text-xs text-[#8B929C] max-w-md leading-relaxed">
                {error instanceof Error ? error.message : 'Please check your connection and try again.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty States */}
          {!isPending && !isError && visibleListings.length === 0 && (
            <EmptyState filter={filter} onReset={() => handleFilterChange('all')} />
          )}

          {/* Listing Inventory Cards (Paginated 5 per page) */}
          {!isPending &&
            !isError &&
            paginatedListings.map((listing, index) => {
              const isDiscounted = listing.discountPercentage > 0;
              const thumbnail = getEventThumbnail(listing, index);

              return (
                <div
                  key={listing.listingId}
                  className={`group relative bg-[#0B0E12] border border-white/[0.08] hover:border-[#FF5A36]/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
                    listing.listingStatus === 'Cancelled' ? 'opacity-75 hover:opacity-100' : ''
                  }`}
                >
                  {/* Left & Center: Event Thumbnail + Metadata */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 w-full lg:w-auto min-w-0">
                    {/* Event Image Thumbnail */}
                    <div className="relative w-full sm:w-36 md:w-44 h-32 sm:h-28 md:h-32 rounded-xl overflow-hidden bg-[#11151B] border border-white/[0.08] shrink-0">
                      <img
                        src={thumbnail}
                        alt={listing.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Sub-badge over image on mobile */}
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white/90 border border-white/10">
                        {listing.tierName || 'TICKET PASS'}
                      </span>
                    </div>

                    {/* Event & Ticket Details */}
                    <div className="space-y-2.5 min-w-0 flex-1">
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-[#F5F5F5] group-hover:text-[#FF7252] transition-colors uppercase tracking-tight leading-snug truncate">
                          {listing.eventName}
                        </h3>
                        <p className="text-xs font-mono font-semibold text-[#FF5A36] tracking-wider mt-0.5">
                          {listing.tierName}
                        </p>
                      </div>

                      {/* Date & Venue Metadata */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8B929C] font-mono">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8B929C]/80" />
                          <span>{formatEventDateTime(listing.eventStartAt)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8B929C]/80" />
                          <span className="truncate max-w-[240px]">{listing.eventVenue}</span>
                        </span>
                      </div>

                      {/* Status Badges & Subtle ID */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {/* Status Badge */}
                        <ListingStatusPill status={listing.listingStatus} />

                        {/* Visibility Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.05] border border-white/[0.08] text-[#8B929C]">
                          {listing.isPrivate ? <Lock className="w-2.5 h-2.5" /> : '●'}
                          <span>{listing.isPrivate ? 'PRIVATE' : 'PUBLIC'}</span>
                        </span>

                        {/* Verification Badge */}
                        {listing.verificationStatus === 'Verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#20C997]/10 border border-[#20C997]/30 text-[#20C997]">
                            ✓ VERIFIED
                          </span>
                        )}

                        {/* Subtle Technical ID */}
                        <span className="text-[11px] text-[#8B929C]/70 font-mono pl-1">
                          ID · {listing.originalTicketCode}
                        </span>

                        {listing.listingStatus === 'Sold' && (
                          <p className="basis-full w-full text-[11px] font-mono text-cyan-400/90 pt-1 leading-snug">
                            {ESCROW_LOCKED_NOTICE}
                          </p>
                        )}
                      </div>

                      {/* 2-Minute Escrow Settlement & Payout Banner */}
                      {listing.listingStatus === 'Sold' && (
                        <div className="pt-2">
                          {listing.inSettlementBuffer ? (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                              <div className="leading-tight">
                                <span className="font-bold text-amber-400">Under 24-Hour Protection: </span>
                                <span>Ticket sale payout ({formatVND(listing.netSellerPayout || listing.resalePrice)}) will be automatically disbursed to your bank account after 2 minutes.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="leading-tight">
                                <span className="font-bold text-emerald-400">Successfully Disbursed: </span>
                                <span>Transferred {formatVND(listing.netSellerPayout || listing.resalePrice)} to linked bank account ({listing.payoutBankInfo || 'linked'}).</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Price & Action Controls */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06] shrink-0">
                    {/* Price Block */}
                    <div className="text-left lg:text-right space-y-0.5">
                      <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#F5F5F5] tabular-nums tracking-tight">
                        {formatVND(listing.resalePrice)}
                      </div>
                      <div className="text-xs text-[#8B929C] font-mono tabular-nums flex items-center lg:justify-end gap-1.5">
                        <span>Original {formatVND(listing.originalPrice)}</span>
                        {isDiscounted && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30 rounded">
                            -{listing.discountPercentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                      {canCopyLink(listing) && (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(listing)}
                          className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#FF5A36]/50 text-[#F5F5F5] rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider cursor-pointer active:scale-95 shadow-sm"
                          title="Copy private link to send to buyer"
                        >
                          {copiedListingId === listing.listingId ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#20C997]" />
                              <span className="text-[#20C997]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#FF5A36]" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      )}

                      {canCancel(listing) && (
                        <button
                          type="button"
                          onClick={() => setListingToCancel(listing)}
                          className="px-3.5 py-2 bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-[#8B929C] hover:text-rose-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider cursor-pointer active:scale-95 shadow-sm"
                          title="Cancel listing and release ticket lock at the organizer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Cancel Listing</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Pagination Controls (when visibleListings.length > ITEMS_PER_PAGE) */}
          {!isPending && !isError && visibleListings.length > ITEMS_PER_PAGE && (
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06]">
              <div className="text-xs text-[#8B929C] font-mono">
                Showing <span className="text-[#F5F5F5] font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> – <span className="text-[#F5F5F5] font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, visibleListings.length)}</span> of <span className="text-[#F5F5F5] font-semibold">{visibleListings.length}</span> listings
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 150, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#0B0E12] border border-white/[0.08] hover:border-[#FF5A36]/40 text-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const isActive = currentPage === page;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 150, behavior: 'smooth' });
                        }}
                        className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30'
                            : 'bg-[#0B0E12] border border-white/[0.08] text-[#8B929C] hover:text-[#F5F5F5] hover:border-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 150, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#0B0E12] border border-white/[0.08] hover:border-[#FF5A36]/40 text-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                  title="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={listingToCancel !== null}
        eyebrow="Seller Action"
        title="Cancel this ticket listing?"
        description="This listing will be removed from the marketplace and an unlock command will be sent to the Organizer to restore the original ticket to VALID."
        confirmLabel={cancelMutation.isError ? 'Retry' : 'Confirm Cancellation'}
        cancelLabel="Keep Listing"
        loadingLabel="Unlocking ticket..."
        tone="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={closeCancelModal}
      >
        {listingToCancel && (
          <div className="space-y-3">
            <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl space-y-1">
              <p className="font-bold text-white text-sm">{listingToCancel.eventName}</p>
              <p className="text-xs text-[#8B929C] font-mono">
                {listingToCancel.tierName} • Code {listingToCancel.originalTicketCode}
              </p>
              <p className="text-sm font-bold font-display text-white tabular-nums">
                {formatVND(listingToCancel.resalePrice)}
              </p>
            </div>
            {listingToCancel.isPrivate && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed flex gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Anyone opening the private share link will see this listing as cancelled and will no longer be able to purchase it.
                </span>
              </div>
            )}
            {cancelMutation.isError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] leading-relaxed flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The organizer could not unlock this ticket at this time. The listing remains active. Please try again.
                </span>
              </div>
            )}
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

/** Compact status pill badge conforming to design specifications */
const ListingStatusPill: React.FC<{ status: ListingStatus }> = ({ status }) => {
  switch (status) {
    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-[#FF5A36]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] animate-pulse" />
          <span>ON SALE</span>
        </span>
      );
    case 'Transacting':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>24H PROTECTION</span>
        </span>
      );
    case 'Sold':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#20C997]/10 border border-[#20C997]/30 text-[#20C997]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20C997]" />
          <span>SOLD</span>
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.05] border border-white/[0.08] text-[#8B929C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B929C]" />
          <span>CANCELLED</span>
        </span>
      );
    case 'Expired':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.05] border border-white/[0.08] text-[#8B929C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B929C]" />
          <span>EXPIRED</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.05] border border-white/[0.08] text-[#8B929C]">
          <span>{status.toUpperCase()}</span>
        </span>
      );
  }
};

/** Empty State Component tailored to the active filter */
const EmptyState: React.FC<{ filter: StatusFilter; onReset: () => void }> = ({ filter, onReset }) => {
  const meta: Record<StatusFilter, { title: string; desc: string; showCta: boolean }> = {
    all: {
      title: 'No tickets listed yet',
      desc: 'Verify and list your official tickets with 100% funds protection.',
      showCta: true,
    },
    Verified: {
      title: 'No tickets on sale',
      desc: 'Your active ticket listings open for marketplace buyers will appear here.',
      showCta: true,
    },
    Transacting: {
      title: 'No listings currently under protection',
      desc: 'Tickets currently undergoing 24-hour buyer funds protection will appear here.',
      showCta: false,
    },
    Sold: {
      title: 'No sold tickets yet',
      desc: 'Completed ticket sales and payout history will be tracked here.',
      showCta: false,
    },
    Cancelled: {
      title: 'No cancelled listings',
      desc: 'Listings that were cancelled and released back to their original owners will appear here.',
      showCta: false,
    },
    Expired: {
      title: 'No expired listings',
      desc: 'Listings closed because the event is within 2 hours or has already started will appear here.',
      showCta: false,
    },
  };

  const current = meta[filter] || meta.all;

  return (
    <div className="py-16 px-6 bg-[#0B0E12] border border-white/[0.08] rounded-2xl flex flex-col items-center text-center gap-3.5 shadow-xl">
      <div className="p-4 rounded-2xl bg-[#FF5A36]/10 border border-[#FF5A36]/20 text-[#FF5A36]">
        {filter === 'Cancelled' ? <XCircle className="w-7 h-7" /> : <Ticket className="w-7 h-7" />}
      </div>
      <h4 className="font-bold text-[#F5F5F5] text-xl font-display uppercase tracking-tight">{current.title}</h4>
      <p className="text-xs text-[#8B929C] max-w-md leading-relaxed">{current.desc}</p>
      
      <div className="flex items-center gap-3 pt-2">
        {current.showCta ? (
          <Link
            to="/sell-ticket"
            className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ SELL A TICKET</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            View All Listings
          </button>
        )}
      </div>
    </div>
  );
};

/** Placeholder loading rows */
const ListingSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading listings">
    {[0, 1, 2].map((row) => (
      <div
        key={row}
        className="p-5 sm:p-6 bg-[#0B0E12] border border-white/[0.08] rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 animate-pulse"
      >
        <div className="flex items-start gap-4 w-full lg:w-auto">
          <div className="w-36 h-28 rounded-xl bg-white/[0.04]" />
          <div className="space-y-2.5 flex-1 min-w-[240px]">
            <div className="h-5 w-48 rounded bg-white/[0.08]" />
            <div className="h-3 w-32 rounded bg-white/[0.04]" />
            <div className="h-3 w-40 rounded bg-white/[0.04]" />
            <div className="h-4 w-28 rounded-full bg-white/[0.04]" />
          </div>
        </div>
        <div className="space-y-2 w-full lg:w-auto lg:text-right">
          <div className="h-7 w-36 rounded bg-white/[0.08] lg:ml-auto" />
          <div className="h-3 w-24 rounded bg-white/[0.04] lg:ml-auto" />
        </div>
      </div>
    ))}
  </div>
);

export default MyListingsPage;
