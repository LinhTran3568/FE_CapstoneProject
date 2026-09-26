import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Check,
  AlertTriangle,
  RotateCw,
  Info,
  Lock,
  ArrowRight,
  Shield,
  Tag,
  CreditCard,
  User,
} from 'lucide-react';
import { MarketplaceListingDto, HoldListingForPurchaseResponse } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { formatVND } from '../../utils/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';

import { PaymentCountdownBar } from './checkout/PaymentCountdownBar';
import { VietQrPanel } from './checkout/VietQrPanel';
import { BankTransferDetails } from './checkout/BankTransferDetails';
import { CheckoutSkeleton } from './checkout/CheckoutSkeleton';
import { PaymentStatusView } from './checkout/PaymentStatusView';

interface BuyTicketModalProps {
  listing: MarketplaceListingDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderData: any) => void;
}

export const BuyTicketModal: React.FC<BuyTicketModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  // Step 1: Buyer Info Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [idCard, setIdCard] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Step 2: Hold Transaction State
  const [isHolding, setIsHolding] = useState(false);
  const [holdData, setHoldData] = useState<HoldListingForPurchaseResponse | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);

  // Verification & Status Handlers
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const [pollStopped, setPollStopped] = useState(false);
  const paidHandledRef = useRef(false);
  const pollErrorToastedRef = useRef(false);

  // Countdown timer hook
  const targetUnlockTime = holdData?.unlockAt || null;
  const initialDuration = holdData?.holdDurationSeconds || 600;

  const handleTimerExpire = useCallback(() => {
    showToast('Thời gian giữ vé ký quỹ (10 phút) đã hết hạn. Vui lòng thử lại!', 'warning');
  }, [showToast]);

  const countdown = usePaymentCountdown({
    unlockAt: targetUnlockTime,
    durationSeconds: initialDuration,
    enabled: Boolean(holdData) && !paidHandledRef.current,
    onExpire: handleTimerExpire,
  });

  // Backend Payment Status Polling
  const pollEnabled = isOpen && Boolean(holdData) && !countdown.isExpired && !pollStopped;
  const { data: paymentStatus, isError: isPollError, error: pollError } = usePaymentStatus(
    listing?.listingId,
    pollEnabled
  );

  // Sync user profile data when auth changes
  useEffect(() => {
    if (user) {
      if (user.fullName && !fullName) setFullName(user.fullName);
      if (user.phoneNumber && !phone) setPhone(user.phoneNumber);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user, fullName, phone, email]);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setHoldData(null);
      setHoldError(null);
      setPollStopped(false);
      setIsVerifyingManual(false);
      paidHandledRef.current = false;
      pollErrorToastedRef.current = false;
    }
  }, [isOpen, listing]);

  // Handle Backend Polling Result
  useEffect(() => {
    if (!paymentStatus || paidHandledRef.current) return;

    if (paymentStatus.escrowStatus === 'RefundQueued') {
      paidHandledRef.current = true;
      setPollStopped(true);
      showToast('Giao dịch không được chấp nhận. Khoản tiền sẽ được tự động hoàn lại cho bạn.', 'error');
      return;
    }

    if (paymentStatus.listingStatus === 'Sold' || paymentStatus.escrowStatus === 'Locked') {
      if (!listing) return;
      paidHandledRef.current = true;
      setPollStopped(true);
      showToast('Thanh toán thành công! Tiền ký quỹ được bảo vệ theo cơ chế Escrow 24 giờ.', 'success');
      onSuccess({
        orderId: paymentStatus.paymentReference || holdData?.paymentReference || `TS-${listing.listingId.substring(0, 8)}`,
        listing,
        escrowId: paymentStatus.escrowId || holdData?.escrowId,
        paymentReference: paymentStatus.paymentReference || holdData?.paymentReference,
        totalBuyerPaid: holdData?.totalBuyerPaid || listing.resalePrice,
        buyerName: fullName,
        buyerPhone: phone,
        buyerEmail: email,
      });
    }
  }, [paymentStatus, listing, holdData, fullName, phone, email, onSuccess, showToast]);

  // Handle Poll Error
  useEffect(() => {
    if (!isPollError || !pollEnabled || pollErrorToastedRef.current) return;
    pollErrorToastedRef.current = true;
    setPollStopped(true);
    const msg = pollError instanceof Error ? pollError.message : 'Không thể tự động kiểm tra trạng thái thanh toán.';
    showToast(msg, 'error');
  }, [isPollError, pollError, pollEnabled, showToast]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancelAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, holdData, countdown.isExpired]);

  if (!isOpen || !listing) return null;

  // Fee Calculation: 5% Buyer Fee (Min 10,000 VND)
  const buyerFeeRate = 0.05;
  const minBuyerFee = 10000;
  const estimatedBuyerFee = Math.max(Math.round(listing.resalePrice * buyerFeeRate), minBuyerFee);
  const totalBuyerPaidEstimated = Math.max(0, listing.resalePrice + estimatedBuyerFee - discountAmount);

  // Dynamic QR Code fallback URL
  const displayQrUrl =
    holdData?.qrImageUrl ||
    (holdData
      ? `https://img.vietqr.io/image/${holdData.bankBin || '970422'}-${holdData.accountNumber || '0938434102'}-compact2.png?amount=${holdData.totalBuyerPaid}&addInfo=${encodeURIComponent(holdData.paymentReference)}&accountName=${encodeURIComponent(holdData.accountName || 'TICKETSHIELD ESCROW')}`
      : '');

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === 'SAYHI' || code === 'TICKETSHIELD' || code === 'VIP100K') {
      setDiscountAmount(100000);
      setCouponApplied(true);
      showToast('Áp dụng mã giảm giá 100.000 VND thành công!', 'success');
    } else {
      showToast('Mã khuyến mãi không hợp lệ. Thử: SAYHI hoặc TICKETSHIELD', 'warning');
    }
  };

  const handleCancelAndClose = async () => {
    if (holdData && !countdown.isExpired && !paidHandledRef.current && listing) {
      try {
        await resaleListingsApi.releaseHold(listing.listingId);
        queryClient.invalidateQueries({ queryKey: ['resale-listings'] });
        showToast('Đã hủy giữ chỗ. Vé được mở khóa lại trên sàn giao dịch.', 'info');
      } catch {
        // Silently ignore if already released or expired
      }
    }
    onClose();
  };

  // Step 1: Submit Form -> Create 10-Minute Hold & VietQR
  const handleHoldListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Vui lòng đăng nhập để tiến hành mua vé an toàn!', 'error');
      return;
    }
    if (!fullName || !phone || !email) {
      showToast('Vui lòng điền đầy đủ thông tin người nhận vé chính thức!', 'warning');
      return;
    }

    try {
      setIsHolding(true);
      setHoldError(null);

      const response = await resaleListingsApi.holdListing(listing.listingId, {
        recipientName: fullName,
        recipientEmail: email,
        recipientIdCard: idCard || undefined,
        privateAccessToken: (listing as any).privateAccessToken || undefined,
      });

      setHoldData(response);
      showToast('Đã giữ vé thành công trong 10 phút! Vui lòng quét mã VietQR để thanh toán.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Không thể giữ chỗ vé vào lúc này. Vui lòng thử lại sau.';
      setHoldError(msg);
      showToast(msg, 'error');
    } finally {
      setIsHolding(false);
    }
  };

  // Step 2: "I Have Paid" Manual Verification Button
  const handleManualCheckPayment = async () => {
    if (countdown.isExpired) {
      showToast('Phiên giao dịch đã hết hạn. Vui lòng đóng cửa sổ và thử lại.', 'error');
      return;
    }

    if (!holdData) return;

    try {
      setIsVerifyingManual(true);
      const res = await resaleListingsApi.getPaymentStatus(listing.listingId);
      if (res.escrowStatus === 'Locked' || res.listingStatus === 'Sold') {
        showToast('Thanh toán thành công! Tiền ký quỹ đã được xác nhận an toàn.', 'success');
        paidHandledRef.current = true;
        setPollStopped(true);
        onSuccess({
          orderId: holdData.paymentReference || `TS-${listing.listingId.substring(0, 8)}`,
          listing,
          escrowId: holdData.escrowId,
          paymentReference: holdData.paymentReference,
          totalBuyerPaid: holdData.totalBuyerPaid || listing.resalePrice,
          buyerName: fullName,
          buyerPhone: phone,
          buyerEmail: email,
        });
      } else {
        showToast('Hệ thống đang kiểm tra giao dịch VietQR từ ngân hàng. Vui lòng đợi trong giây lát...', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Đang kiểm tra dữ liệu từ ngân hàng...', 'info');
    } finally {
      setIsVerifyingManual(false);
    }
  };

  // Status Badge in Header
  const renderHeaderBadge = () => {
    if (!holdData) {
      return (
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Bước 1: Thông tin người nhận</span>
        </span>
      );
    }

    if (countdown.isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Đã hết hạn</span>
        </span>
      );
    }

    if (isVerifyingManual || paymentStatus?.listingStatus === 'Transacting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Đang chờ thanh toán</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Đang giữ chỗ 10 phút</span>
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div
        id="buy-ticket-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleCancelAndClose();
          }
        }}
      >
        <motion.div
          id="buy-ticket-modal-content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-[#0B0F19] border border-[#293548] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden my-auto text-zinc-100 flex flex-col"
        >
          {/* Top Subtle Brand Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shrink-0" />

          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#293548] bg-[#111827] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  id="checkout-modal-title"
                  className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase truncate"
                >
                  {holdData ? 'Thanh toán VietQR Ký quỹ' : 'Mua vé an toàn & Nhận vé chính thức'}
                </h2>
                <p className="text-[10px] text-zinc-400 truncate">
                  {listing.eventName} • {listing.eventVenue || 'Vé chuyển nhượng đã xác thực'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {renderHeaderBadge()}
              <button
                type="button"
                onClick={handleCancelAndClose}
                aria-label="Đóng cửa sổ thanh toán"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="p-4 sm:p-4.5 space-y-3 flex-1">
            {/* Loading Skeleton during Hold Creation */}
            {isHolding ? (
              <CheckoutSkeleton />
            ) : holdError && !holdData ? (
              /* Hold Error View */
              <PaymentStatusView
                status="ERROR"
                errorMessage={holdError}
                onRetry={() => setHoldError(null)}
                onClose={handleCancelAndClose}
              />
            ) : !holdData ? (
              /* ================= STEP 1: BUYER INFORMATION & SUMMARY ================= */
              <form onSubmit={handleHoldListing} className="space-y-4">
                {/* Warning if listing is locked by another buyer */}
                {((listing.listingStatus || '').toLowerCase() === 'transacting') && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-200 text-xs">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-amber-300">Vé đang trong phiên giao dịch khác</div>
                      <div className="text-amber-200/80 mt-0.5">
                        Vé này hiện đang được giữ chỗ trong 10 phút bởi một người mua khác. Vui lòng quay lại sau ít phút hoặc chọn vé khác.
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket Details Summary Card */}
                <div className="p-3.5 rounded-xl bg-[#111827] border border-[#293548] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {listing.tierName || 'HẠNG VÉ TIÊU CHUẨN'}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Mã vé: {listing.maskedTicketCode || 'AT*********88'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">{listing.eventName}</h3>
                    <p className="text-xs text-zinc-400">{listing.eventVenue || 'Địa điểm tổ chức'}</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Giá niêm yết</div>
                    <div className="text-lg font-extrabold text-white font-mono tabular-nums">
                      {formatVND(listing.resalePrice)}
                    </div>
                  </div>
                </div>

                {/* 24-Hour Guarantee Trust Banner */}
                <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/30 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-emerald-300">
                      Bảo hiểm thanh toán Ký quỹ Escrow 24 Giờ & Cấp mới vé từ BTC
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed">
                      Tiền của bạn được giữ an toàn trong tài khoản Ký quỹ TicketShield. Ban tổ chức sẽ hủy mã vé cũ của người bán và phát hành mã vé QR hoàn toàn mới gửi trực tiếp về email của bạn.
                    </div>
                  </div>
                </div>

                {/* Recipient Form Fields */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Thông tin người nhận vé chính thức</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                        Họ và tên người nhận *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full h-9 px-3 rounded-xl bg-[#151C2B] border border-[#293548] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full h-9 px-3 rounded-xl bg-[#151C2B] border border-[#293548] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                        Email nhận vé điện tử *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="w-full h-9 px-3 rounded-xl bg-[#151C2B] border border-[#293548] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                      Số CCCD / Hộ chiếu (Dùng đối chiếu vé tại cổng sự kiện nếu cần)
                    </label>
                    <input
                      type="text"
                      value={idCard}
                      onChange={(e) => setIdCard(e.target.value)}
                      placeholder="00120000xxxx (Tùy chọn)"
                      className="w-full h-9 px-3 rounded-xl bg-[#151C2B] border border-[#293548] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi (Ví dụ: SAYHI)"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      disabled={couponApplied}
                      className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#151C2B] border border-[#293548] text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !coupon.trim()}
                    className="h-9 px-3.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer border border-white/10 shrink-0"
                  >
                    {couponApplied ? 'Đã áp dụng' : 'Áp dụng'}
                  </button>
                </div>

                {/* Price & Fee Breakdown Box */}
                <div className="p-3 bg-[#111827] border border-[#293548] rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#293548]">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Chi tiết thanh toán</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      Phí bảo hiểm Escrow 5%
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Giá vé gốc:</span>
                      <span className="font-semibold text-zinc-200 font-mono tabular-nums">
                        {formatVND(listing.resalePrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <div className="flex items-center gap-1">
                        <span>Phí bảo vệ người mua (5%):</span>
                        <span className="text-[10px] text-zinc-500">(Tối thiểu 10.000 đ)</span>
                      </div>
                      <span className="font-medium text-amber-400 font-mono tabular-nums">
                        + {formatVND(estimatedBuyerFee)}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-emerald-400">
                        <span>Giảm giá khuyến mãi ({coupon}):</span>
                        <span className="font-medium font-mono tabular-nums">
                          - {formatVND(discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-[#293548]">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Tổng tiền thanh toán VietQR
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        (Bao gồm vé + bảo hiểm ký quỹ 24h)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
                        {formatVND(totalBuyerPaidEstimated)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 1 Submit Button */}
                <div className="pt-1 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCancelAndClose}
                    className="h-10 px-4 rounded-xl bg-transparent hover:bg-white/5 border border-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isHolding || ((listing.listingStatus || '').toLowerCase() === 'transacting')}
                    className="h-10 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto"
                  >
                    <span>Giữ vé 10 phút & Tạo mã VietQR</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* ================= STEP 2: ACTIVE 10-MIN COUNTDOWN & VIETQR CHECKOUT ================= */
              <div className="space-y-3">
                {/* 1. Payment Countdown Bar */}
                <PaymentCountdownBar
                  formattedTime={countdown.formattedTime}
                  progressPercentage={countdown.progressPercentage}
                  isUrgent={countdown.isUrgent}
                  isExpired={countdown.isExpired}
                  statusColor={countdown.statusColor}
                />

                {/* 2. Expired Notice Banner if expired */}
                {countdown.isExpired && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-200 text-xs animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-red-300">Phiên giữ chỗ ký quỹ đã hết hạn (10 phút)</div>
                      <div className="text-zinc-300 text-[11px] mt-0.5">
                        Vé đã được tự động mở lại trên sàn để người khác có thể mua. Vui lòng đóng cửa sổ hoặc tạo lại giao dịch mới.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Main 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  {/* Left Column (5/12): VietQR Panel */}
                  <VietQrPanel
                    qrImageUrl={displayQrUrl}
                    quickLinkUrl={holdData.quickLinkUrl}
                    isExpired={countdown.isExpired}
                    amount={holdData.totalBuyerPaid}
                    className="lg:col-span-5 h-full"
                  />

                  {/* Right Column (7/12): Bank Account & Exact Transfer Reference */}
                  <div className="lg:col-span-7 h-full flex flex-col justify-between">
                    <BankTransferDetails
                      bankBin={holdData.bankBin || '970422'}
                      bankName="MB Bank (Ngân hàng Quân Đội)"
                      accountNumber={holdData.accountNumber || '0938434102'}
                      accountName={holdData.accountName || 'TICKETSHIELD ESCROW'}
                      amount={holdData.totalBuyerPaid}
                      paymentReference={holdData.paymentReference}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2 MODAL FOOTER */}
          {holdData && (
            <div className="px-4 sm:px-5 py-3 border-t border-[#293548] bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 min-w-0 w-full sm:w-auto flex-1">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-zinc-400 truncate sm:whitespace-normal">
                  Vé chính thức sẽ gửi về email <strong className="text-zinc-200 font-medium">{email}</strong> sau khi thanh toán.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={handleCancelAndClose}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#151C2B] hover:bg-[#1E293B] border border-[#293548] text-xs font-semibold text-zinc-300 transition-colors cursor-pointer text-center"
                >
                  Hủy / Để sau
                </button>

                <button
                  type="button"
                  onClick={handleManualCheckPayment}
                  disabled={countdown.isExpired || isVerifyingManual}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isVerifyingManual ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-zinc-950 shrink-0" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                      <span>TÔI ĐÃ CHUYỂN TIỀN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
