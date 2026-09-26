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
  Zap,
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
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [pollStopped, setPollStopped] = useState(false);
  const paidHandledRef = useRef(false);

  const handleSimulatePayment = async () => {
    if (!holdData?.paymentReference) return;
    try {
      setIsSimulatingPayment(true);
      showToast('Sending simulated SePay payment webhook...', 'info');
      await resaleListingsApi.simulatePaymentWebhook(
        holdData.paymentReference,
        holdData.totalBuyerPaid
      );
      showToast('Simulated payment sent! Awaiting SignalR approval...', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to simulate payment', 'error');
    } finally {
      setIsSimulatingPayment(false);
    }
  };

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
    listingId: listing?.listingId,
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
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto"
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
          className="relative w-full max-w-[840px] bg-[#121824] border border-[#28354D] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden my-auto text-zinc-100 flex flex-col max-h-[90vh]"
        >
          {/* 1. MINIMAL REFINED HEADER */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#28354D] bg-[#121824] shrink-0 h-11">
            <div />
            <button
              type="button"
              onClick={handleCancelAndClose}
              aria-label="Close modal"
              className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#ff5722]/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. SCROLLABLE MODAL BODY */}
          <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {/* Loading Skeleton during Hold Creation */}
            {isHolding ? (
              <div className="p-6">
                <CheckoutSkeleton />
              </div>
            ) : holdError && !holdData ? (
              /* Hold Error View */
              <div className="p-6">
                <PaymentStatusView
                  status="ERROR"
                  errorMessage={holdError}
                  onRetry={() => setHoldError(null)}
                  onClose={handleCancelAndClose}
                />
              </div>
            ) : !holdData ? (
              /* ================= STEP 1: ULTRA-COMPACT 2-COLUMN CHECKOUT ================= */
              <div className="grid grid-cols-1 lg:grid-cols-12 items-start">
                {/* LEFT COLUMN (~64%): Event Details & Recipient Form */}
                <div className="lg:col-span-7 p-6 space-y-4">
                  {/* Warning if listing is locked by another buyer */}
                  {((listing.listingStatus || '').toLowerCase() === 'transacting') && (
                    <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-amber-200 text-xs font-medium">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        This ticket is currently in an active checkout session by another buyer.
                      </div>
                    </div>
                  )}

                  {/* A. COMPACT EVENT DETAILS PANEL */}
                  <div className="p-4 rounded-xl bg-[#1A2335] border border-[#28354D] space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-[#ff5722] px-2.5 py-0.5 rounded bg-[#ff5722]/15 border border-[#ff5722]/30 uppercase tracking-wide">
                        {listing.tierName || 'STANDARD'}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {listing.maskedTicketCode || 'AT*********88'}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-[20px] font-bold text-white tracking-tight leading-snug pt-0.5">
                      {listing.eventName}
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-400">
                      {listing.eventVenue || 'Official Venue'}
                    </p>
                  </div>

                  {/* B. RECIPIENT INFORMATION FORM */}
                  <form id="buyer-info-form" onSubmit={handleHoldListing} className="space-y-3 pt-1">
                    <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Recipient information
                    </div>

                    {/* Row 1: Full Name & Phone Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="w-full h-10 px-3 rounded-lg bg-[#1A2335] border border-[#28354D] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722]/30 transition-all"
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
                          className="w-full h-10 px-3 rounded-lg bg-[#1A2335] border border-[#28354D] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722]/30 transition-all"
                        />
                      </div>
                    </div>

                    {/* Row 2: Delivery Email */}
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full h-10 px-3 rounded-lg bg-[#1A2335] border border-[#28354D] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722]/30 transition-all"
                      />
                    </div>

                    {/* Row 3: Optional National ID */}
                    {showIdCardInput || idCard ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-zinc-300">
                            National ID / Passport (Optional)
                          </label>
                          {!idCard && (
                            <button
                              type="button"
                              onClick={() => setShowIdCardInput(false)}
                              className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              Collapse
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={idCard}
                          onChange={(e) => setIdCard(e.target.value)}
                          placeholder="ID / Passport for venue check-in"
                          className="w-full h-10 px-3 rounded-lg bg-[#1A2335] border border-[#28354D] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722]/30 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setShowIdCardInput(true)}
                          className="text-xs text-[#ff5722] hover:text-[#f4511e] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer py-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add National ID / Passport (Optional)</span>
                        </button>
                      </div>
                    )}

                    {/* Row 4: Compact Promo Code */}
                    <div className="pt-1">
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Promo Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code (e.g. SAYHI)"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          disabled={couponApplied}
                          className="flex-1 h-10 px-3 rounded-lg bg-[#1A2335] border border-[#28354D] text-sm text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722]/30 transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponApplied || !coupon.trim()}
                          className="h-10 px-4 bg-[#ff5722] hover:bg-[#f4511e] disabled:opacity-40 text-xs font-bold rounded-lg text-white transition-colors cursor-pointer shrink-0 active:scale-95"
                        >
                          {couponApplied ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                      {couponApplied && (
                        <p className="text-xs text-[#ff5722] mt-1 flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5 text-[#ff5722]" />
                          <span>100,000 VND discount voucher applied!</span>
                        </p>
                      )}
                    </div>
                  </form>
                </div>

                {/* RIGHT COLUMN (~36%): COMPACT ORDER SUMMARY */}
                <div className="lg:col-span-5 bg-[#0C101A] lg:border-l border-[#28354D] p-6 space-y-4 h-full">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Order summary
                  </h4>

                  {/* Price Breakdown */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Ticket Price</span>
                      <span className="font-semibold text-white font-mono tabular-nums">
                        {formatVND(listing.resalePrice)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1">
                        <span>Escrow & Service Fee</span>
                        <span className="text-xs text-zinc-500">(5%)</span>
                      </span>
                      <span className="font-medium text-amber-400 font-mono tabular-nums">
                        + {formatVND(estimatedBuyerFee)}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[#ff5722]">
                        <span>Voucher Discount</span>
                        <span className="font-medium font-mono tabular-nums">
                          - {formatVND(discountAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-[#28354D] space-y-1">
                    <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                      Total to Pay
                    </div>
                    <div className="text-2xl sm:text-[26px] font-extrabold text-[#ff5722] font-mono tracking-tight tabular-nums">
                      {formatVND(totalBuyerPaidEstimated)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= STEP 2: ACTIVE 10-MIN COUNTDOWN & VIETQR CHECKOUT ================= */
              <div className="p-6 space-y-5 bg-[#121824]">
                {/* 1. Payment Countdown Bar */}
                <PaymentCountdownBar
                  formattedTime={countdown.formattedTime}
                  progressPercentage={countdown.progressPercentage}
                  isUrgent={countdown.isUrgent}
                  isExpired={countdown.isExpired}
                  statusColor={countdown.statusColor}
                />

                {/* 1.5. Demo Quick Payment Simulation Shortcut */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#ff5722]/15 via-amber-500/10 to-transparent border border-[#ff5722]/40 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[#ff5722]/20 border border-[#ff5722]/40 text-[#ff5722] shrink-0">
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white tracking-wide flex items-center gap-2">
                        <span>DEMO SIMULATION TOOL</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ff5722] text-white font-mono">FAST DEMO</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Test bank transfer webhook without logging into banking app
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isSimulatingPayment || countdown.isExpired}
                    className="px-4 py-2 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] active:scale-95 text-white text-xs font-bold shadow-[0_4px_15px_rgba(255,87,34,0.35)] hover:shadow-orange-500/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSimulatingPayment ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Sending Webhook...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-white" />
                        <span>⚡ Giả lập thanh toán ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Expired Notice Banner if expired */}
                {countdown.isExpired && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-red-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-red-300">Escrow hold session expired (10 minutes)</div>
                      <div className="text-zinc-400 text-xs mt-0.5">
                        This ticket has been released back to the marketplace. Please close this window or initiate a new checkout session.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Main 2-Column Responsive Layout for Step 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column (6/12): VietQR Panel */}
                  <VietQrPanel
                    qrImageUrl={displayQrUrl}
                    quickLinkUrl={holdData.quickLinkUrl}
                    isExpired={countdown.isExpired}
                    amount={holdData.totalBuyerPaid}
                    className="lg:col-span-6 h-full"
                  />

                  {/* Right Column (6/12): Bank Account & Exact Transfer Reference */}
                  <div className="lg:col-span-6 h-full flex flex-col justify-between">
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

          {/* 3. COMPACT MODAL FOOTER */}
          <div className="px-6 py-3.5 border-t border-[#28354D] bg-[#0C101A] flex items-center justify-end gap-3 shrink-0 h-16">
            <button
              type="button"
              onClick={handleCancelAndClose}
              className="h-11 px-5 rounded-lg bg-transparent hover:bg-white/10 border border-[#28354D] text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>

            {holdData ? (
              <button
                type="button"
                onClick={handleManualCheckPayment}
                disabled={countdown.isExpired || isVerifyingManual}
                className="h-11 px-6 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-lg shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {isVerifyingManual ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3] shrink-0" />
                    <span>I HAVE TRANSFERRED</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                form="buyer-info-form"
                disabled={isHolding || ((listing.listingStatus || '').toLowerCase() === 'transacting')}
                className="h-11 px-6 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-lg shadow-[0_4px_14px_rgba(255,87,34,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Reserve & Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
