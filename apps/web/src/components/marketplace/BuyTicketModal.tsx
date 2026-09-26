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
  Plus,
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
  const [showIdCardInput, setShowIdCardInput] = useState(false);
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

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    return undefined;
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      <div
        id="buy-ticket-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto"
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
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="relative w-full max-w-[780px] bg-[#0B0F19] border border-[#293548] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden my-auto text-zinc-100 flex flex-col max-h-[calc(100dvh-48px)] sm:max-h-[calc(100dvh-48px)]"
        >
          {/* Top Brand Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shrink-0" />

          {/* FIXED MODAL HEADER (Height ~64px) */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#293548] bg-[#111827] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  id="checkout-modal-title"
                  className="text-base sm:text-lg font-bold text-white tracking-wide truncate"
                >
                  {holdData ? 'Thanh toán VietQR Ký quỹ' : 'Thông tin đặt vé'}
                </h2>
                <p className="text-xs text-zinc-400 truncate">
                  {listing.eventName} • {listing.eventVenue || 'Vé chuyển nhượng chính thức'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                {holdData ? 'Bước 2/2' : 'Bước 1/2'}
              </span>

              <button
                type="button"
                onClick={handleCancelAndClose}
                aria-label="Đóng cửa sổ"
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE MODAL BODY */}
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
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
              /* ================= STEP 1: BALANCED TICKET INFORMATION FORM ================= */
              <form id="buyer-info-form" onSubmit={handleHoldListing} className="space-y-4">
                {/* Warning if listing is locked by another buyer */}
                {((listing.listingStatus || '').toLowerCase() === 'transacting') && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-amber-200 text-xs">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-amber-300">Vé đang trong phiên giao dịch khác</div>
                      <div className="text-amber-200/80 text-[11px] mt-0.5">
                        Vé này hiện đang được giữ chỗ trong 10 phút bởi một người mua khác. Vui lòng quay lại sau ít phút.
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Ticket Summary Card (Balanced proportions) */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#111827] border border-[#293548] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {listing.tierName || 'HẠNG VÉ TIÊU CHUẨN'}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        Mã vé: {listing.maskedTicketCode || 'AT*********88'}
                      </span>
                    </div>
                    <div className="text-base font-bold text-white truncate mt-0.5">
                      {listing.eventName}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {listing.eventVenue || 'Địa điểm sự kiện'}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">Giá vé gốc</div>
                    <div className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">
                      {formatVND(listing.resalePrice)}
                    </div>
                  </div>
                </div>

                {/* 2. Insurance Trust Banner (Balanced 2-lines) */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-semibold text-emerald-300 text-sm">
                      Bảo vệ giao dịch 24 giờ
                    </div>
                    <p className="text-zinc-300 leading-relaxed text-xs">
                      Tiền được giữ tại TicketShield. BTC hủy vé cũ của người bán và phát hành mã QR mới trực tiếp đến email của bạn.
                    </p>
                  </div>
                </div>

                {/* 3. Customer Information Form Fields */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-200">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Thông tin người nhận vé</span>
                  </div>

                  {/* Row 1: Full Name & Phone Number (2 Columns on Desktop) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                        Họ và tên người nhận <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full h-[42px] sm:h-[44px] px-3.5 rounded-lg bg-[#151C2B] border border-[#293548] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                        Số điện thoại <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full h-[42px] sm:h-[44px] px-3.5 rounded-lg bg-[#151C2B] border border-[#293548] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Delivery Email (Full Width) */}
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Email nhận vé điện tử <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full h-[42px] sm:h-[44px] px-3.5 rounded-lg bg-[#151C2B] border border-[#293548] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                    />
                  </div>

                  {/* Row 3: Optional National ID (Collapsible / Expandable) */}
                  {showIdCardInput || idCard ? (
                    <div className="animate-in fade-in duration-150 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-300">
                          Số CCCD / Hộ chiếu (Tùy chọn)
                        </label>
                        {!idCard && (
                          <button
                            type="button"
                            onClick={() => setShowIdCardInput(false)}
                            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            Thu gọn
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={idCard}
                        onChange={(e) => setIdCard(e.target.value)}
                        placeholder="00120000xxxx (Dùng đối chiếu cổng soát vé nếu cần)"
                        className="w-full h-[42px] sm:h-[44px] px-3.5 rounded-lg bg-[#151C2B] border border-[#293548] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      />
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowIdCardInput(true)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer py-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm số CCCD / Hộ chiếu (tùy chọn)</span>
                      </button>
                    </div>
                  )}

                  {/* Row 4: Promo Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 block">
                      Mã giảm giá / Ưu đãi
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Nhập mã ưu đãi (Ví dụ: SAYHI)"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          disabled={couponApplied}
                          className="w-full h-[42px] sm:h-[44px] pl-9 pr-3.5 rounded-lg bg-[#151C2B] border border-[#293548] text-sm text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponApplied || !coupon.trim()}
                        className="h-[42px] sm:h-[44px] px-4 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs sm:text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer border border-white/10 shrink-0 active:scale-95"
                      >
                        {couponApplied ? 'Đã áp dụng' : 'Áp dụng'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Payment Price Breakdown (Clean & Compact) */}
                <div className="p-3.5 sm:p-4 bg-[#111827] border border-[#293548] rounded-xl space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#293548]">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200 text-xs sm:text-sm">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Chi tiết thanh toán</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Phí bảo hiểm Escrow 5%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Giá vé gốc:</span>
                      <span className="font-semibold text-zinc-200 font-mono tabular-nums">
                        {formatVND(listing.resalePrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Bảo vệ người mua &amp; Dịch vụ (5%):</span>
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

                  <div className="flex justify-between items-baseline pt-2.5 border-t border-[#293548]">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white block">
                        Tổng thanh toán
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
                        {formatVND(totalBuyerPaidEstimated)}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* ================= STEP 2: ACTIVE 10-MIN COUNTDOWN & VIETQR CHECKOUT ================= */
              <div className="space-y-3.5">
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
                      <div className="font-semibold text-red-300">Phiên giữ chỗ ký quỹ đã hết hạn (10 phút)</div>
                      <div className="text-zinc-300 text-[11px] mt-0.5">
                        Vé đã được tự động mở lại trên sàn để người khác có thể mua. Vui lòng đóng cửa sổ hoặc tạo lại giao dịch mới.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Main 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
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

          {/* FIXED MODAL FOOTER (Height ~64px) */}
          <div className="px-5 py-3 border-t border-[#293548] bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-400 flex items-center gap-1.5 min-w-0 w-full sm:w-auto flex-1">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate sm:whitespace-normal">
                {holdData ? (
                  <>
                    Vé chính thức sẽ gửi về email <strong className="text-zinc-200 font-medium">{email}</strong> sau khi xác nhận.
                  </>
                ) : (
                  <>
                    Vé điện tử sẽ gửi về email người nhận ngay sau khi thanh toán.
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={handleCancelAndClose}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-[#151C2B] hover:bg-[#1E293B] border border-[#293548] text-xs sm:text-sm font-semibold text-zinc-300 transition-colors cursor-pointer text-center"
              >
                {holdData ? 'Hủy / Để sau' : 'Hủy bỏ'}
              </button>

              {holdData ? (
                <button
                  type="button"
                  onClick={handleManualCheckPayment}
                  disabled={countdown.isExpired || isVerifyingManual}
                  className="w-full sm:w-auto h-11 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-40 text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
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
              ) : (
                <button
                  type="submit"
                  form="buyer-info-form"
                  disabled={isHolding || ((listing.listingStatus || '').toLowerCase() === 'transacting')}
                  className="w-full sm:w-auto h-11 px-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Giữ vé 10 phút & Tạo mã VietQR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
