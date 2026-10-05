import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  CreditCard,
  Receipt,
  ArrowDownRight,
  Wallet,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { ListingStatus, SellerListingDto } from '@ticketshield/types';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { listingsFailedBeforeAnyData, useCancelListing, useMyListings, myListingsQueryKey } from '../hooks/useMyListings';
import { useMyBankAccounts, myBankAccountsQueryKey } from '../hooks/useMyBankAccounts';
import { myPayoutsQueryKey } from '../hooks/useMyPayouts';
import { useSellerPayoutSignalR, SignalRPayoutPayload } from '../hooks/usePaymentSignalR';
import { SellerBankAccountModal } from '../components/profile/SellerBankAccountModal';
import { PayoutSuccessModal } from '../components/seller/PayoutSuccessModal';
import { RevenueTab } from '../components/seller/RevenueTab';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatEventDateTime, formatVND } from '../utils/formatters';
import { buildPrivateShareLink, copyToClipboard } from '../utils/shareLink';

type StatusFilter = 'all' | 'Verified' | 'Transacting' | 'Sold' | 'Cancelled' | 'Expired';

const ITEMS_PER_PAGE = 5;

interface FilterTabOption {
  key: StatusFilter;
  label: string;
}

const SELLER_SECTION_TABS = [
  { key: 'listings' as const, label: 'My tickets' },
  { key: 'revenue' as const, label: 'Revenue' },
];

const FILTER_TABS: FilterTabOption[] = [
  { key: 'all', label: 'ALL' },
  { key: 'Verified', label: 'ON SALE' },
  { key: 'Transacting', label: 'PROCESSING' },
  { key: 'Sold', label: 'SOLD' },
  { key: 'Cancelled', label: 'CANCELLED' },
  { key: 'Expired', label: 'EXPIRED' },
];

const TOAST_CANCEL_SUCCESS = 'Listing cancelled successfully. The original ticket has been unlocked by the Organizer.';
const TOAST_CANCEL_ERROR = 'Could not contact the organizer to unlock the ticket. Please try again later.';

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

const SettlementCountdownBanner: React.FC<{
  unlockAt?: string | null;
  netSellerPayout?: number | null;
  resalePrice: number;
  onRefresh?: () => void;
  onToggleBreakdown?: () => void;
  isBreakdownOpen?: boolean;
}> = ({ unlockAt, netSellerPayout, resalePrice, onRefresh, onToggleBreakdown, isBreakdownOpen }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = unlockAt ? new Date(unlockAt).getTime() : 0;
  const diffSeconds = target > 0 ? Math.max(0, Math.floor((target - now) / 1000)) : 0;
  const isEnded = target > 0 && diffSeconds <= 0;

  useEffect(() => {
    if (isEnded && onRefresh) {
      onRefresh();
      const interval = setInterval(onRefresh, 1500);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isEnded, onRefresh]);

  const pad = (v: number) => String(v).padStart(2, '0');
  const mm = pad(Math.floor(diffSeconds / 60));
  const ss = pad(diffSeconds % 60);

  return (
    <div
      onClick={onToggleBreakdown}
      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-between gap-3 text-xs text-amber-200 cursor-pointer transition-all group"
      title="Bấm để xem chi tiết tiền khấu trừ"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="truncate">
          <strong className="text-amber-300">Đang ký quỹ ({isEnded ? '00:00' : `${mm}:${ss}`}):</strong>{' '}
          Dự kiến nhận {formatVND(netSellerPayout || resalePrice)}
        </span>
      </div>

      {onToggleBreakdown && (
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 group-hover:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded transition-colors shrink-0">
          <span>{isBreakdownOpen ? 'Đóng' : 'Chi tiết'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isBreakdownOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Bảng Kê Chi Tiết Tiền Bán Vé & Khấu Trừ (Thiết kế tinh gọn, súc tích)
 */
const ListingFinancialBreakdown: React.FC<{
  listing: SellerListingDto;
  onClose?: () => void;
}> = ({ listing, onClose }) => {
  const isBundle = Boolean(
    listing.bundleId || (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2)
  );
  const bundleTotal = listing.bundleTotalTickets || 1;

  const singlePrice = listing.resalePrice;
  const netPayout = listing.netSellerPayout || singlePrice;

  const grossAmount = listing.totalBuyerPaid
    ? listing.totalBuyerPaid - (listing.buyerFee || 0)
    : netPayout > singlePrice && isBundle
      ? Math.max(singlePrice * bundleTotal, Math.round(netPayout / 0.95))
      : netPayout > singlePrice
        ? Math.round(netPayout / 0.95)
        : isBundle && bundleTotal > 1
          ? singlePrice * bundleTotal
          : singlePrice;

  const feeAmount = listing.sellerFee ?? Math.max(0, grossAmount - netPayout);
  const feePercent = grossAmount > 0 ? Math.round((feeAmount / grossAmount) * 100) : 5;

  return (
    <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-[#080B10] border border-white/10 space-y-2 text-xs font-mono text-left animate-fade-in-up">
      {/* 3 dòng chi tiết ngắn gọn */}
      <div className="space-y-1.5 pb-2 border-b border-white/10">
        <div className="flex justify-between text-gray-400">
          <span>Giá bán {isBundle && bundleTotal > 1 ? `(${bundleTotal} vé)` : ''}:</span>
          <span className="text-white font-semibold tabular-nums">+{formatVND(grossAmount)}</span>
        </div>
        <div className="flex justify-between text-rose-400">
          <span>Phí sàn ({feePercent}%):</span>
          <span className="tabular-nums font-semibold">-{formatVND(feeAmount)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Phí chuyển khoản:</span>
          <span className="text-emerald-400 font-semibold">0 ₫ (Miễn phí)</span>
        </div>
      </div>

      {/* Thực nhận */}
      <div className="flex justify-between items-center text-sm pt-0.5">
        <span className="text-gray-300 font-bold">Thực nhận:</span>
        <span className="text-base font-extrabold text-emerald-400 tabular-nums font-display">
          {formatVND(netPayout)}
        </span>
      </div>

      {/* Tài khoản nhận & Mã đối soát */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 flex-wrap gap-2">
        <div className="truncate">
          <span className="text-gray-500">Nhận tại: </span>
          <span className="text-gray-200 font-medium">
            {listing.payoutBankInfo ||
              (listing.payoutBankCode
                ? `${listing.payoutBankCode} - ${listing.payoutAccountNumber}`
                : 'TK liên kết')}
          </span>
          {listing.payoutAccountName && (
            <span className="text-gray-400"> ({listing.payoutAccountName})</span>
          )}
        </div>
        <div className="shrink-0">
          <span className="text-gray-500">Mã: </span>
          <span className="text-cyan-400 font-medium">
            {listing.payoutCode || `PO-${listing.listingId.substring(0, 8).toUpperCase()}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export const MyListingsPage: React.FC = () => {
  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: bankAccounts = [], isLoading: isLoadingBankAccounts } = useMyBankAccounts();
  const { data, isPending, isError, error, refetch, isFetching } = useMyListings();
  const listings = data ?? [];

  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [payoutSuccessData, setPayoutSuccessData] = useState<SignalRPayoutPayload | null>(null);

  // SignalR Realtime Payout & Payment Listener (NOTIF-SETTLE-5.4.3a & FE-SETTLE-5.4.5)
  useSellerPayoutSignalR({
    sellerId: user?.id,
    enabled: !!user?.id,
    onPayoutCompleted: useCallback((payload: SignalRPayoutPayload) => {
      void queryClient.invalidateQueries({ queryKey: myListingsQueryKey });
      void queryClient.invalidateQueries({ queryKey: myPayoutsQueryKey });
      void refetch();
      setPayoutSuccessData(payload);
      const amountStr = payload.amount ? formatVND(payload.amount) : '';
      const bankInfo = payload.bankCode && payload.accountNumber
        ? ` (${payload.bankCode} - ${payload.accountNumber})`
        : '';
      showToast(
        `🎉 Tiền bán vé ${amountStr} đã được giải ngân thành công về tài khoản${bankInfo}!`,
        'success'
      );
    }, [queryClient, refetch, showToast]),
    onPaymentSuccess: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: myListingsQueryKey });
      void queryClient.invalidateQueries({ queryKey: myPayoutsQueryKey });
      void refetch();
      showToast('🎟️ Vé của bạn vừa được người mua thanh toán! Đang chuyển sang trạng thái xử lý/ký quỹ.', 'info');
    }, [queryClient, refetch, showToast]),
    onHoldExpired: useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: myListingsQueryKey });
      void queryClient.invalidateQueries({ queryKey: myPayoutsQueryKey });
      void refetch();
    }, [queryClient, refetch]),
  });

  const showListingsError = listingsFailedBeforeAnyData(data, isError);
  const cancelMutation = useCancelListing();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listingToCancel, setListingToCancel] = useState<SellerListingDto | null>(null);
  const [copiedListingId, setCopiedListingId] = useState<string | null>(null);
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);
  const [pageView, setPageView] = useState<'listings' | 'revenue'>('listings');

  const moveSellerTab = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = SELLER_SECTION_TABS.length - 1;
    let next = index;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    const key = SELLER_SECTION_TABS[next].key;
    setPageView(key);
    queueMicrotask(() => document.getElementById(`seller-tab-${key}`)?.focus());
  };

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
            </div>
          </div>

          <Link
            to="/sell-ticket"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 hover:shadow-xl hover:shadow-[#FF5A36]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>SELL A TICKET</span>
          </Link>
        </div>

        {/* Missing Bank Account Warning Banner */}
        {!isLoadingBankAccounts && bankAccounts.length === 0 && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-amber-300 font-semibold">Chưa liên kết ngân hàng:</strong> Vui lòng thêm tài khoản để nhận tiền bán vé tự động qua NAPAS 247.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddBankModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs rounded-lg transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Liên kết ngay</span>
            </button>
          </div>
        )}

        <div
          className="inline-flex w-full sm:w-auto items-center gap-1.5 p-1.5 bg-[#0B0E12] border border-white/[0.08] rounded-2xl shadow-xl"
          role="tablist"
          aria-label="Seller sections"
        >
          {SELLER_SECTION_TABS.map((tab, index) => {
            const selected = pageView === tab.key;
            return (
              <button
                key={tab.key}
                id={`seller-tab-${tab.key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`seller-panel-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setPageView(tab.key)}
                onKeyDown={(event) => moveSellerTab(event, index)}
                className={`flex-1 sm:flex-none min-w-[140px] py-2.5 px-5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
                  selected
                    ? 'bg-[#11151B] text-[#F5F5F5] border border-[#FF5A36] shadow-[0_0_15px_rgba(255,90,54,0.15)]'
                    : 'text-[#8B929C] hover:text-[#F5F5F5] hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="seller-panel-revenue"
          aria-labelledby="seller-tab-revenue"
          hidden={pageView !== 'revenue'}
        >
          {pageView === 'revenue' && <RevenueTab />}
        </div>
        <div
          role="tabpanel"
          id="seller-panel-listings"
          aria-labelledby="seller-tab-listings"
          hidden={pageView !== 'listings'}
        >
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
          {showListingsError && (
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
          {!isPending && !showListingsError && visibleListings.length === 0 && (
            <EmptyState filter={filter} onReset={() => handleFilterChange('all')} />
          )}

          {/* Listing Inventory Cards (Paginated 5 per page) */}
          {!isPending &&
            !showListingsError &&
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
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/landing/concert.jpg';
                        }}
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

                        {/* Combo / Bundle Badge */}
                        {Boolean(listing.bundleId || (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2)) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/40 text-purple-300">
                            <span>COMBO ({listing.bundleTotalTickets || 2} VÉ)</span>
                          </span>
                        )}

                        {/* Subtle Technical ID */}
                        <span className="text-[11px] text-[#8B929C]/70 font-mono pl-1">
                          ID · {listing.originalTicketCode}
                        </span>
                      </div>

                      {/* 30-Second Escrow Settlement & Payout Banner */}
                      {listing.listingStatus === 'Sold' && (
                        <div className="pt-2 w-full">
                          {listing.inSettlementBuffer ? (
                            <SettlementCountdownBanner
                              unlockAt={listing.unlockAt}
                              netSellerPayout={listing.netSellerPayout}
                              resalePrice={listing.resalePrice}
                              onRefresh={() => {
                                void queryClient.invalidateQueries({ queryKey: myListingsQueryKey });
                                void queryClient.invalidateQueries({ queryKey: myPayoutsQueryKey });
                                void refetch();
                              }}
                              onToggleBreakdown={() =>
                                setExpandedBreakdownId((prev) =>
                                  prev === listing.listingId ? null : listing.listingId
                                )
                              }
                              isBreakdownOpen={expandedBreakdownId === listing.listingId}
                            />
                          ) : (
                            <div
                              onClick={() =>
                                setExpandedBreakdownId((prev) =>
                                  prev === listing.listingId ? null : listing.listingId
                                )
                              }
                              className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 hover:border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-300 transition-all cursor-pointer group"
                              title="Bấm để xem chi tiết tiền bán & khấu trừ"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="truncate">
                                  <strong className="text-emerald-400 font-semibold">Đã thanh toán:</strong>{' '}
                                  {formatVND(listing.netSellerPayout || listing.resalePrice)}
                                  {listing.payoutBankInfo && (
                                    <span className="text-emerald-400/80 font-normal"> · {listing.payoutBankInfo}</span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 text-[11px] font-mono font-bold transition-colors shrink-0">
                                <span>{expandedBreakdownId === listing.listingId ? 'Đóng' : 'Chi tiết'}</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    expandedBreakdownId === listing.listingId ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Chi tiết tài chính & khấu trừ được mở rộng khi người dùng bấm vào */}
                          {expandedBreakdownId === listing.listingId && (
                            <ListingFinancialBreakdown
                              listing={listing}
                              onClose={() => setExpandedBreakdownId(null)}
                            />
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
          {!isPending && !showListingsError && visibleListings.length > ITEMS_PER_PAGE && (
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
            {Boolean(listingToCancel.bundleId || (listingToCancel.bundleTotalTickets && listingToCancel.bundleTotalTickets >= 2)) && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-[11px] leading-relaxed flex gap-2">
                <span className="font-bold text-xs uppercase text-purple-400 shrink-0">COMBO:</span>
                <span>
                  Vé này thuộc gói combo ({listingToCancel.bundleTotalTickets || 2} vé). Khi xác nhận hủy, toàn bộ các vé thuộc combo này sẽ được mở khóa và hủy bán cùng lúc.
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

      {/* Seller Bank Account Setup Modal (FE-SETTLE-5.4.5) */}
      <SellerBankAccountModal
        isOpen={isAddBankModalOpen}
        onClose={() => setIsAddBankModalOpen(false)}
        onSuccess={() => {
          setIsAddBankModalOpen(false);
          void queryClient.invalidateQueries({ queryKey: myBankAccountsQueryKey });
          showToast('Liên kết tài khoản ngân hàng nhận tiền thành công!', 'success');
        }}
      />

      {/* Realtime Payout Success Modal (SignalR - FE-SETTLE-5.4.5) */}
      <PayoutSuccessModal
        isOpen={payoutSuccessData !== null}
        onClose={() => setPayoutSuccessData(null)}
        payoutData={payoutSuccessData}
      />
    </div>
  );
};

/** Compact status pill badge conforming to design specifications */
const ListingStatusPill: React.FC<{ status: ListingStatus }> = ({ status }) => {
  switch (status) {
    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 border border-[#FF5A36]/50 text-white backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] animate-pulse" />
          <span>ON SALE</span>
        </span>
      );
    case 'Transacting':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 border border-amber-400/50 text-white backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>PROCESSING</span>
        </span>
      );
    case 'Sold':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 border border-[#20C997]/50 text-white backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#20C997]" />
          <span>SOLD</span>
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 border border-zinc-600/50 text-zinc-300 backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span>CANCELLED</span>
        </span>
      );
    case 'Expired':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 border border-zinc-600/50 text-zinc-300 backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
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
            <span>SELL A TICKET</span>
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
