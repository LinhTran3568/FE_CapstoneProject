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
import { usePaymentCountdown } from '../../hooks/usePaymentCountdown';
import { usePaymentSignalR, SignalRPaymentPayload } from '../../hooks/usePaymentSignalR';

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

  // Countdown timer hook
  const targetUnlockTime = holdData?.unlockAt || null;
  const initialDuration = holdData?.holdDurationSeconds || 600;

  const handleTimerExpire = useCallback(() => {
    showToast('Escrow hold period (10 minutes) has expired. Please try again!', 'warning');
  }, [showToast]);

  const countdown = usePaymentCountdown({
    unlockAt: targetUnlockTime,
    durationSeconds: initialDuration,
    enabled: Boolean(holdData) && !paidHandledRef.current,
    onExpire: handleTimerExpire,
  });

  // SignalR Realtime Payment Notification Handler
  const isRealtimeActive = isOpen && Boolean(holdData) && !countdown.isExpired && !pollStopped && !paidHandledRef.current;

  const handlePaymentSuccess = useCallback(
    (payload: SignalRPaymentPayload) => {
      if (paidHandledRef.current || !listing) return;
      paidHandledRef.current = true;
      setPollStopped(true);
      showToast('Payment successful! Your funds are protected under 24-hour Escrow guarantee.', 'success');
      onSuccess({
        orderId: payload.paymentReference || holdData?.paymentReference || `TS-${listing.listingId.substring(0, 8)}`,
        listing,
        escrowId: payload.escrowId || holdData?.escrowId,
        paymentReference: payload.paymentReference || holdData?.paymentReference,
        totalBuyerPaid: payload.totalBuyerPaid || holdData?.totalBuyerPaid || listing.resalePrice,
        buyerName: fullName,
        buyerPhone: phone,
        buyerEmail: email,
        newTicketCode: payload.newTicketCode,
        qrCodeData: payload.qrCodeData,
      });
    },
    [listing, holdData, fullName, phone, email, onSuccess, showToast]
  );

  const handleHoldExpired = useCallback(
    () => {
      if (paidHandledRef.current) return;
      paidHandledRef.current = true;
      setPollStopped(true);
      showToast('Transaction was not accepted or hold session has expired. Any transferred funds will be automatically refunded.', 'error');
    },
    [showToast]
  );

  // Realtime SignalR Connection to /hubs/payment
  usePaymentSignalR({
    listingId: listing?.listingId,
    paymentReference: holdData?.paymentReference,
    enabled: isRealtimeActive,
    onPaymentSuccess: handlePaymentSuccess,
    onHoldExpired: handleHoldExpired,
  });

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
    }
  }, [isOpen, listing]);

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
      showToast('Discount voucher of 100,000 VND applied successfully!', 'success');
    } else {
      showToast('Invalid promo code. Try: SAYHI or TICKETSHIELD', 'warning');
    }
  };

  const handleCancelAndClose = async () => {
    if (holdData && !countdown.isExpired && !paidHandledRef.current && listing) {
      try {
        await resaleListingsApi.releaseHold(listing.listingId);
        queryClient.invalidateQueries({ queryKey: ['resale-listings'] });
        showToast('Hold released. Ticket is now unlocked on the marketplace.', 'info');
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
      showToast('Please sign in to proceed with safe ticket purchase!', 'error');
      return;
    }
    if (!fullName || !phone || !email) {
      showToast('Please fill in all recipient details!', 'warning');
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
      showToast('Ticket reserved for 10 minutes! Please scan the VietQR code to pay.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Unable to hold ticket at this moment. Please try again later.';
      setHoldError(msg);
      showToast(msg, 'error');
    } finally {
      setIsHolding(false);
    }
  };

  // Step 2: "I Have Paid" Manual Verification Button
  const handleManualCheckPayment = async () => {
    if (countdown.isExpired) {
      showToast('Transaction session has expired. Please close this window and try again.', 'error');
      return;
    }

    if (!holdData) return;

    try {
      setIsVerifyingManual(true);
      const res = await resaleListingsApi.getPaymentStatus(listing.listingId);
      if (res.escrowStatus === 'Locked' || res.listingStatus === 'Sold') {
        showToast('Payment confirmed! Escrow funds have been safely secured.', 'success');
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
        showToast('Verifying VietQR transaction with banking network. Please wait a moment...', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Checking banking transaction records...', 'info');
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
          className="relative w-full max-w-[620px] bg-[#0B0F19] border border-[#293548] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden my-auto text-zinc-100 flex flex-col max-h-[calc(100dvh-48px)]"
        >
          {/* Top Brand Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shrink-0" />

          {/* FIXED MODAL HEADER */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#293548] bg-[#111827] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  id="checkout-modal-title"
                  className="text-base font-bold text-white tracking-wide truncate"
                >
                  {holdData ? 'VietQR Escrow Payment' : 'Ticket Reservation'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                {holdData ? 'Step 2/2' : 'Step 1/2'}
              </span>

              <button
                type="button"
                onClick={handleCancelAndClose}
                aria-label="Close modal"
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE MODAL BODY */}
          <div className="px-5 py-4 space-y-3.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
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
              /* ================= STEP 1: COMPACT TICKET INFORMATION FORM ================= */
              <form id="buyer-info-form" onSubmit={handleHoldListing} className="space-y-3.5">
                {/* Warning if listing is locked by another buyer */}
                {((listing.listingStatus || '').toLowerCase() === 'transacting') && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-amber-200 text-xs">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-amber-200/90 text-xs">
                      This ticket is currently in an active checkout session by another buyer.
                    </div>
                  </div>
                )}

                {/* 1. Ticket Summary Strip */}
                <div className="p-3.5 rounded-xl bg-[#111827] border border-[#293548] flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {listing.tierName || 'STANDARD'}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 truncate">
                        {listing.maskedTicketCode || 'AT*********88'}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white truncate">
                      {listing.eventName}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {listing.eventVenue || 'Official Venue'}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3 border-l border-[#293548]">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Price</div>
                    <div className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                      {formatVND(listing.resalePrice)}
                    </div>
                  </div>
                </div>

                {/* 2. Customer Information Form Fields */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recipient Information</span>
                  </div>

                  {/* Row 1: Full Name & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-10 px-3 rounded-lg bg-[#151C2B] border border-[#293548] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full h-10 px-3 rounded-lg bg-[#151C2B] border border-[#293548] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Delivery Email */}
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full h-10 px-3 rounded-lg bg-[#151C2B] border border-[#293548] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                    />
                  </div>

                  {/* Row 3: Optional National ID */}
                  {showIdCardInput || idCard ? (
                    <div className="animate-in fade-in duration-150 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-300">
                          National ID / Passport (Optional)
                        </label>
                        {!idCard && (
                          <button
                            type="button"
                            onClick={() => setShowIdCardInput(false)}
                            className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            Collapse
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={idCard}
                        onChange={(e) => setIdCard(e.target.value)}
                        placeholder="ID number for check-in verification"
                        className="w-full h-10 px-3 rounded-lg bg-[#151C2B] border border-[#293548] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
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
                        <span>Add National ID / Passport (Optional)</span>
                      </button>
                    </div>
                  )}

                  {/* Row 4: Promo Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300 block">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Enter code (e.g. SAYHI)"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          disabled={couponApplied}
                          className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#151C2B] border border-[#293548] text-xs sm:text-sm text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponApplied || !coupon.trim()}
                        className="h-10 px-3.5 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-semibold rounded-lg text-white transition-colors cursor-pointer border border-white/10 shrink-0 active:scale-95"
                      >
                        {couponApplied ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Compact Price Receipt Summary */}
                <div className="p-3 bg-[#111827] border border-[#293548] rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Ticket Price:</span>
                    <span className="font-semibold text-zinc-200 font-mono tabular-nums">
                      {formatVND(listing.resalePrice)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Escrow Fee (5%):</span>
                    <span className="font-medium text-amber-400 font-mono tabular-nums">
                      + {formatVND(estimatedBuyerFee)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-400">
                      <span>Discount ({coupon}):</span>
                      <span className="font-medium font-mono tabular-nums">
                        - {formatVND(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2 border-t border-[#293548]">
                    <span className="text-xs font-bold text-white">
                      Total
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono tabular-nums">
                      {formatVND(totalBuyerPaidEstimated)}
                    </span>
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
                      <div className="font-semibold text-red-300">Escrow hold session expired (10 minutes)</div>
                      <div className="text-zinc-300 text-[11px] mt-0.5">
                        This ticket has been released back to the marketplace. Please close this window or initiate a new checkout session.
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
            {/* Info Icon with Hover Tooltip */}
            <div className="relative group/info flex items-center shrink-0">
              <div
                tabIndex={0}
                role="button"
                aria-label="Delivery information"
                className="w-8 h-8 rounded-lg bg-[#151C2B] hover:bg-[#1E293B] border border-[#293548] flex items-center justify-center text-zinc-400 hover:text-emerald-400 cursor-pointer transition-colors"
              >
                <Info className="w-4 h-4" />
              </div>

              {/* Tooltip on Hover / Focus */}
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/info:block group-focus-within/info:block z-50 w-64 p-2.5 rounded-xl bg-[#090C12] border border-[#293548] text-xs text-zinc-300 shadow-xl shadow-black/80 animate-in fade-in zoom-in-95 pointer-events-none">
                <div className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {holdData ? (
                      <>
                        Pass will be sent to <strong className="text-white font-medium">{email}</strong> upon payment.
                      </>
                    ) : (
                      <>
                        Pass and QR code will be delivered to your email instantly upon payment.
                      </>
                    )}
                  </span>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -bottom-1 left-3.5 w-2 h-2 bg-[#090C12] border-r border-b border-[#293548] transform rotate-45" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={handleCancelAndClose}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-[#151C2B] hover:bg-[#1E293B] border border-[#293548] text-xs sm:text-sm font-semibold text-zinc-300 transition-colors cursor-pointer text-center"
              >
                Cancel
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
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                      <span>I HAVE TRANSFERRED</span>
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
                  <span>Reserve & Pay</span>
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
