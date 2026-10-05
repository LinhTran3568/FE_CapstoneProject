import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Calendar,
  MapPin,
  Ticket,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Layers,
  Sparkles,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi } from '@ticketshield/api-client';
import { ResaleListingDetailDto } from '@ticketshield/types';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { BuyTicketModal } from '../components/marketplace/BuyTicketModal';
import { SeatAdjacencyBadge } from '../components/ui/SeatAdjacencyBadge';
import { formatVND, formatEventDateTime } from '../utils/formatters';

export const PrivateListingPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { showToast } = useUIStore();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const {
    data: listing,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ResaleListingDetailDto>({
    queryKey: ['private-listing', shareToken],
    queryFn: () => resaleListingsApi.getPrivateListing(shareToken || ''),
    enabled: Boolean(shareToken && shareToken.trim().length > 0),
    retry: 1,
  });

  const isOwner = Boolean(
    user?.id && listing?.sellerId && user.id.toLowerCase() === listing.sellerId.toLowerCase()
  );

  const isBundle = Boolean(
    listing &&
      (listing.bundleId ||
        (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2) ||
        (listing.bundleItems && listing.bundleItems.length >= 2))
  );

  const bundleCount =
    listing?.bundleTotalTickets || listing?.bundleItems?.length || (isBundle ? 2 : 1);

  const bundleListings = listing?.bundleItems && listing.bundleItems.length > 0
    ? listing.bundleItems
    : listing ? [listing] : [];

  const totalBundlePrice = bundleListings.length > 1
    ? bundleListings.reduce((sum, item) => sum + item.resalePrice, 0)
    : (listing?.resalePrice || 0) * (isBundle ? bundleCount : 1);

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để tiến hành mua vé bảo đảm qua TicketShield Escrow!', 'info');
      navigate(`/login?returnUrl=/p/${encodeURIComponent(shareToken || '')}`);
      return;
    }

    if (isOwner) {
      showToast('Bạn không thể tự mua vé do chính mình đăng bán!', 'warning');
      return;
    }

    if (listing?.listingStatus === 'Transacting') {
      showToast('Vé này hiện đang có người mua khác giữ chỗ thanh toán. Vui lòng thử lại sau!', 'warning');
      return;
    }

    if (listing?.listingStatus === 'Sold') {
      showToast('Vé này đã được bán thành công.', 'error');
      return;
    }

    setIsBuyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 selection:bg-[#FF5A36] selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#FF5A36]/15 via-purple-600/10 to-cyan-500/10 rounded-full blur-[140px] opacity-70" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-mono font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Chợ vé công khai</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-[#FF5A36]">
            <Lock className="w-3.5 h-3.5" />
            <span>Vé Bán Riêng Tư</span>
          </span>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 sm:p-12 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mx-auto" />
            <p className="text-sm font-mono text-gray-400">
              Đang xác thực liên kết bảo mật và tải thông tin vé...
            </p>
          </div>
        )}

        {/* Error / 404 State */}
        {isError && (
          <div className="bg-[#0B0E14] border border-red-500/20 rounded-3xl p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Liên kết riêng tư không hợp lệ</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {(error as any)?.response?.data?.message ||
                  'Liên kết bán riêng tư này không tồn tại, đã hết hạn hoặc người bán đã hủy tin đăng.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 transition-colors"
              >
                Thử lại
              </button>
              <Link
                to="/marketplace"
                className="px-5 py-2 bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] rounded-xl text-xs font-bold text-white shadow-lg shadow-[#FF5A36]/20 transition-all hover:brightness-110"
              >
                Xem các vé khác
              </Link>
            </div>
          </div>
        )}

        {/* Loaded Active Listing Card */}
        {listing && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0B0E14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl divide-y divide-white/[0.08]"
          >
            {/* Top Banner Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Bạn đang xem vé được chia sẻ trực tiếp từ người bán qua liên kết bảo mật bí mật.
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                ID · {listing.maskedTicketCode}
              </span>
            </div>

            {/* Main Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Event Info Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    ✓ Verified by MockOrganizer
                  </span>
                  {isBundle && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/40 text-purple-300 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>COMBO ({bundleCount} VÉ)</span>
                    </span>
                  )}
                  {listing.listingStatus !== 'Verified' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      {listing.listingStatus}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                  {listing.eventName}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300 font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0" />
                    <span>{formatEventDateTime(listing.eventStartAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0" />
                    <span className="truncate">{listing.eventVenue}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Details Panel */}
              <div className="bg-[#12161F] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                      Hạng vé / Khu vực
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white font-mono">
                        {listing.tierName}
                      </span>
                      {listing.seatZone && (
                        <SeatAdjacencyBadge
                          seats={listing.seatZone}
                          variant="glass"
                          size="xs"
                          showSubtext={true}
                        />
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                      {isBundle ? `Tổng giá gói (${bundleCount} vé)` : 'Giá bán lại'}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#FF5A36] font-display tabular-nums">
                      {formatVND(totalBundlePrice)}
                    </div>
                    {listing.originalPrice > 0 && (
                      <div className="text-xs text-gray-400 font-mono line-through tabular-nums">
                        Giá gốc: {formatVND(listing.originalPrice * (isBundle ? bundleCount : 1))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bundle items list if combo */}
                {isBundle && bundleListings.length > 0 && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-2">
                    <span className="text-xs font-mono font-semibold text-gray-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Danh sách {bundleListings.length} vé trong gói:</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {bundleListings.map((b, idx) => (
                        <div
                          key={b.listingId || idx}
                          className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">
                              Vé #{idx + 1}
                            </span>
                            <p className="font-bold text-gray-200">
                              {b.seatZone || b.tierName || 'Ghế ngồi'}
                            </p>
                          </div>
                          <span className="font-mono text-gray-300 font-semibold">
                            {formatVND(b.resalePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller & Verification Assurance */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-gray-400 font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Người bán: <strong className="text-gray-200">{listing.sellerFullName || 'Chủ vé xác thực'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bảo hiểm 100% hoàn tiền qua TicketShield Escrow</span>
                  </div>
                </div>
              </div>

              {/* Purchase Action Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleBuyClick}
                  disabled={listing.listingStatus !== 'Verified' || isOwner}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] hover:from-[#FF4820] hover:to-[#FF6B47] text-white font-extrabold text-base font-display tracking-wide shadow-xl shadow-[#FF5A36]/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {isOwner
                      ? 'Đây là vé do chính bạn đăng bán'
                      : listing.listingStatus === 'Sold'
                      ? 'Vé này đã được bán'
                      : listing.listingStatus === 'Transacting'
                      ? 'Vé đang có người đặt giữ chỗ'
                      : `Mua vé ngay (${formatVND(totalBundlePrice)})`}
                  </span>
                </button>

                <p className="text-[11px] font-mono text-center text-gray-400">
                  🔒 Tiền được ký quỹ an toàn 24 giờ. Chỉ giải ngân cho người bán sau khi bạn nhận vé và check-in thành công.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Buy Modal Integration */}
      {listing && (
        <BuyTicketModal
          listing={listing}
          allListings={bundleListings}
          isOpen={isBuyModalOpen}
          onClose={() => setIsBuyModalOpen(false)}
          onSuccess={(orderData) => {
            setIsBuyModalOpen(false);
            showToast(
              `Mua vé thành công! Mã đơn: ${orderData.orderId}. Vui lòng kiểm tra email và Vé của tôi.`,
              'success'
            );
            navigate('/my-tickets');
          }}
        />
      )}
    </div>
  );
};

export default PrivateListingPage;
