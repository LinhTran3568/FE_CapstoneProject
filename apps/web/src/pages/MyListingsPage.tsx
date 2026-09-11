import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Copy,
  Lock,
  MapPin,
  PlusCircle,
  RefreshCw,
  Ticket,
  Undo2,
} from 'lucide-react';
import type { ListingStatus, SellerListingDto } from '@ticketshield/types';
import { useUIStore } from '../stores/uiStore';
import { useCancelListing, useMyListings } from '../hooks/useMyListings';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  LISTING_STATUS_META,
  ListingStatusBadge,
  VerificationBadge,
  VisibilityBadge,
} from '../components/listings/ListingBadges';
import { formatEventDateTime, formatVND } from '../utils/formatters';
import { buildPrivateShareLink, copyToClipboard } from '../utils/shareLink';

type StatusFilter = 'all' | ListingStatus;

/** Filter tiles shown above the list. Draft listings are only counted under "All". */
const FILTERS: StatusFilter[] = ['all', 'Verified', 'Transacting', 'Sold', 'Cancelled'];

const TOAST_CANCEL_SUCCESS = 'Hủy niêm yết vé thành công và vé gốc đã được giải phóng khóa.';
const TOAST_CANCEL_ERROR = 'Không thể liên lạc với ban tổ chức để mở khóa vé. Vui lòng thử lại sau.';

/** Only listings nobody has bought yet can be cancelled (backend rule). */
const canCancel = (listing: SellerListingDto) => listing.listingStatus === 'Verified';

/** Private links are worth sharing only while the listing is still live. */
const canCopyLink = (listing: SellerListingDto) =>
  listing.isPrivate &&
  !!listing.privateAccessToken &&
  (listing.listingStatus === 'Verified' || listing.listingStatus === 'Transacting');

export const MyListingsPage: React.FC = () => {
  const { showToast } = useUIStore();
  const { data: listings = [], isPending, isError, error, refetch, isFetching } = useMyListings();
  const cancelMutation = useCancelListing();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [listingToCancel, setListingToCancel] = useState<SellerListingDto | null>(null);
  const [copiedListingId, setCopiedListingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: listings.length,
      Draft: 0,
      Verified: 0,
      Transacting: 0,
      Sold: 0,
      Cancelled: 0,
    };
    listings.forEach((listing) => {
      result[listing.listingStatus] += 1;
    });
    return result;
  }, [listings]);

  const visibleListings = useMemo(
    () => (filter === 'all' ? listings : listings.filter((l) => l.listingStatus === filter)),
    [filter, listings]
  );

  const handleCopyLink = async (listing: SellerListingDto) => {
    if (!listing.privateAccessToken) return;
    try {
      await copyToClipboard(buildPrivateShareLink(listing.privateAccessToken));
      setCopiedListingId(listing.listingId);
      showToast('Đã sao chép link riêng tư! Hãy gửi link này cho người mua của bạn.', 'success');
      window.setTimeout(() => setCopiedListingId(null), 2000);
    } catch {
      showToast('Không thể sao chép liên kết. Vui lòng thử lại!', 'error');
    }
  };

  // `reset` is stable across renders, so the modal's Esc listener is not re-attached on every render.
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
        // Keep the modal open: the listing is unchanged and the seller can retry.
        console.error('Cancel listing failed:', err);
        showToast(TOAST_CANCEL_ERROR, 'error');
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased overflow-hidden">
      {/* Background Concert Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/featured-2.jpg"
          alt=""
          className="w-full h-full object-cover opacity-25 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/85 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs text-[#FF5A36] font-bold font-display uppercase tracking-widest">
              Seller Console
            </span>
            <h1 className="text-4xl font-extrabold font-display text-white uppercase tracking-tight">
              Quản Lý Vé Đang Rao Bán (My Listings)
            </h1>
            <p className="text-sm text-[#A3A8B3] max-w-2xl">
              Quản lý tất cả các vé rao bán được niêm yết dưới tài khoản Reseller của bạn. Chia sẻ liên kết riêng tư và hủy các vé chưa có người mua.
            </p>
          </div>
          <Link
            to="/sell-ticket"
            className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/30 flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Đăng Bán Vé Mới</span>
          </Link>
        </div>

        {/* Summary tiles — also act as the status filter */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" role="group" aria-label="Filter listings by status">
          {FILTERS.map((key) => {
            const isActive = filter === key;
            const label = key === 'all' ? 'Tất cả' : LISTING_STATUS_META[key].label;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={isActive}
                className={`text-left bg-[#0A0D12] border p-4 rounded-2xl space-y-1 transition-colors ${
                  isActive
                    ? 'border-[#FF5A36]/70 shadow-lg shadow-[#FF5A36]/10'
                    : 'border-white/10 hover:border-[#FF5A36]/40'
                }`}
              >
                <span
                  className={`block text-[11px] font-display uppercase tracking-wider ${
                    isActive ? 'text-[#FF5A36]' : 'text-[#A3A8B3]'
                  }`}
                >
                  {label}
                </span>
                <span className="block text-2xl font-bold font-display text-white tabular-nums">
                  {isPending ? '–' : counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Listings */}
        <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          {isPending && <ListingSkeleton />}

          {isError && (
            <div className="py-10 flex flex-col items-center text-center gap-3">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">Không thể tải danh sách vé</h4>
              <p className="text-xs text-[#A3A8B3] max-w-md">
                {error instanceof Error ? error.message : 'Vui lòng kiểm tra kết nối mạng và thử lại.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Thử Lại
              </button>
            </div>
          )}

          {!isPending && !isError && visibleListings.length === 0 && (
            <div className="py-10 flex flex-col items-center text-center gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36]">
                <Ticket className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">
                {listings.length === 0 ? 'Bạn chưa có vé nào đang đăng bán' : 'Không có vé nào trong mục này'}
              </h4>
              <p className="text-xs text-[#A3A8B3] max-w-md">
                {listings.length === 0
                  ? 'Xác thực vé chính chủ của bạn và đăng bán để bắt đầu giao dịch an toàn qua Escrow.'
                  : 'Chọn một danh mục trạng thái khác ở trên để xem các vé khác.'}
              </p>
            </div>
          )}

          {!isPending &&
            !isError &&
            visibleListings.map((listing) => (
              <div
                key={listing.listingId}
                className={`p-5 bg-[#05070A] border border-white/10 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 hover:border-[#FF5A36]/40 transition-colors ${
                  listing.listingStatus === 'Cancelled' ? 'opacity-70' : ''
                }`}
              >
                {/* Event & ticket info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-3.5 rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36] shrink-0">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{listing.eventName}</h4>
                      <p className="text-xs text-[#A3A8B3] font-mono flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span>{listing.tierName}</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatEventDateTime(listing.eventStartAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.eventVenue}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ListingStatusBadge status={listing.listingStatus} />
                      <VisibilityBadge isPrivate={listing.isPrivate} />
                      <VerificationBadge status={listing.verificationStatus} />
                      <span className="text-[10px] text-[#A3A8B3] font-mono ml-1">
                        Mã {listing.originalTicketCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & actions */}
                <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="text-left lg:text-right">
                    <p className="font-bold text-white text-base font-display tabular-nums">
                      {formatVND(listing.resalePrice)}
                    </p>
                    <p className="text-[11px] text-[#A3A8B3] font-mono tabular-nums">
                      Giá gốc {formatVND(listing.originalPrice)}
                      {listing.discountPercentage > 0 && (
                        <span className="text-emerald-400 ml-1.5">-{listing.discountPercentage}%</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCopyLink(listing) && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(listing)}
                        className="px-3 py-2 bg-white/5 border border-white/10 hover:border-[#FF5A36]/50 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wider"
                        title="Sao chép link riêng tư gửi cho người mua"
                      >
                        {copiedListingId === listing.listingId ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#FF5A36]" />
                        )}
                        <span>{copiedListingId === listing.listingId ? 'Đã sao chép' : 'Copy Link'}</span>
                      </button>
                    )}
                    {canCancel(listing) && (
                      <button
                        type="button"
                        onClick={() => setListingToCancel(listing)}
                        className="px-3 py-2 bg-white/5 border border-white/10 hover:border-rose-500/50 text-[#A3A8B3] hover:text-rose-400 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold font-display uppercase tracking-wider"
                        title="Hủy tin đăng bán và mở khóa vé gốc"
                      >
                        <Undo2 className="w-4 h-4" />
                        <span>Hủy Niêm Yết</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Cancel confirmation (SCRUM-30) */}
      <ConfirmModal
        open={listingToCancel !== null}
        eyebrow="Thao tác Người Bán"
        title="Hủy tin rao bán vé này?"
        description="Vé sẽ được gỡ khỏi sàn giao dịch và được mở khóa tại hệ thống Ban Tổ Chức, bạn có thể tự sử dụng hoặc đăng bán lại."
        confirmLabel={cancelMutation.isError ? 'Thử Lại' : 'Hủy Niêm Yết'}
        cancelLabel="Giữ Lại Vé"
        loadingLabel="Đang mở khóa vé..."
        tone="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={closeCancelModal}
      >
        {listingToCancel && (
          <div className="space-y-3">
            <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl space-y-1">
              <p className="font-bold text-white text-sm">{listingToCancel.eventName}</p>
              <p className="text-xs text-[#A3A8B3] font-mono">
                {listingToCancel.tierName} • Mã {listingToCancel.originalTicketCode}
              </p>
              <p className="text-sm font-bold font-display text-white tabular-nums">
                {formatVND(listingToCancel.resalePrice)}
              </p>
            </div>
            {listingToCancel.isPrivate && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed flex gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Bất kỳ ai mở liên kết riêng tư sẽ thấy tin này đã bị hủy và không thể mua được nữa.
                </span>
              </div>
            )}
            {cancelMutation.isError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] leading-relaxed flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Ban tổ chức không thể mở khóa vé này lúc này, tin chưa bị hủy. Bạn có thể thử lại sau.
                </span>
              </div>
            )}
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

/** Placeholder rows while listings load. */
const ListingSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading listings">
    {[0, 1, 2].map((row) => (
      <div
        key={row}
        className="p-5 bg-[#05070A] border border-white/10 rounded-2xl flex items-center gap-4 animate-pulse"
      >
        <div className="w-12 h-12 rounded-2xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
        </div>
        <div className="h-5 w-24 rounded bg-white/10" />
      </div>
    ))}
  </div>
);

export default MyListingsPage;
