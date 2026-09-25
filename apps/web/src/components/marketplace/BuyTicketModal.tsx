import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  QrCode,
  ShieldCheck,
  Check,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
  Lock,
} from 'lucide-react';
import { MarketplaceListingDto, HoldListingForPurchaseResponse } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { formatVND } from '../../utils/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';

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

  // Buyer Info Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [idCard, setIdCard] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  // Hold API & VietQR State
  const [isHolding, setIsHolding] = useState(false);
  const [holdData, setHoldData] = useState<HoldListingForPurchaseResponse | null>(null);

  // Countdown & Timer State
  const [timeLeft, setTimeLeft] = useState(600); // Default 600s (10 mins)
  const [isExpired, setIsExpired] = useState(false);
  const [pollStopped, setPollStopped] = useState(false);
  const paidHandledRef = useRef(false);
  const pollErrorToastedRef = useRef(false);

  // Copy Feedback Indicators
  const [copiedType, setCopiedType] = useState<'amount' | 'reference' | 'account' | null>(null);

  const pollEnabled = isOpen && Boolean(holdData) && !isExpired && !pollStopped;
  const { data: paymentStatus, isError, error } = usePaymentStatus(listing?.listingId, pollEnabled);

  // Sync user profile when available
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phoneNumber) setPhone(user.phoneNumber);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setHoldData(null);
      setIsExpired(false);
      setTimeLeft(600);
      setPollStopped(false);
      paidHandledRef.current = false;
      pollErrorToastedRef.current = false;
    }
  }, [isOpen, listing]);

  // 10-Minute Countdown Timer Handler based on target unlockAt timestamp
  useEffect(() => {
    if (!holdData) return;

    const targetTime = holdData.unlockAt
      ? new Date(holdData.unlockAt).getTime()
      : Date.now() + (holdData.holdDurationSeconds || 600) * 1000;

    const checkTimer = () => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
        showToast('The 10-minute hold window has expired. Please try again!', 'warning');
      }
    };

    checkTimer();
    const timer = setInterval(checkTimer, 1000);

    return () => clearInterval(timer);
  }, [holdData, showToast]);

  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    if (!paymentStatus || paidHandledRef.current) return;

    if (paymentStatus.escrowStatus === 'RefundQueued') {
      paidHandledRef.current = true;
      setPollStopped(true);
      setIsExpired(true);
      showToast('Payment was not accepted. Funds will be refunded to your account.', 'error');
      return;
    }

    if (paymentStatus.listingStatus === 'Sold' || paymentStatus.escrowStatus === 'Locked') {
      if (!listing) return;
      paidHandledRef.current = true;
      setPollStopped(true);
      showToast('Payment confirmed! Funds are secured under 24-hour protection.', 'success');
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

  useEffect(() => {
    if (!isError || !pollEnabled || pollErrorToastedRef.current) return;
    pollErrorToastedRef.current = true;
    setPollStopped(true);
    const msg = error instanceof Error ? error.message : 'Unable to check payment status.';
    showToast(msg, 'error');
  }, [isError, error, pollEnabled, showToast]);

  if (!isOpen || !listing) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'SAYHI' || coupon.trim().toUpperCase() === 'TICKETSHIELD') {
      setDiscountAmount(100000);
      setCouponApplied(true);
      showToast('Applied 100,000 VND discount code!', 'success');
    } else {
      showToast('Invalid promo code. Hint: SAYHI or TICKETSHIELD', 'warning');
    }
  };

  const handleCancelAndClose = async () => {
    if (holdData && !isExpired && !paidHandledRef.current && listing) {
      try {
        await resaleListingsApi.releaseHold(listing.listingId);
        queryClient.invalidateQueries({ queryKey: ['resale-listings'] });
        showToast('Reservation cancelled. Ticket is now available on the marketplace.', 'info');
      } catch {
        // Silently ignore if already released or expired
      }
    }
    onClose();
  };

  const handleCopy = (text: string, type: 'amount' | 'reference' | 'account') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    showToast(`Copied to clipboard!`, 'success');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Step 1: Submit Form -> Call POST /resale-listings/{id}/hold
  const handleHoldListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to purchase tickets!', 'error');
      return;
    }
    if (!fullName || !phone || !email) {
      showToast('Please provide all required recipient contact details!', 'warning');
      return;
    }

    try {
      setIsHolding(true);
      showToast('Initializing 10-minute hold and generating dynamic VietQR...', 'info');

      const response = await resaleListingsApi.holdListing(listing.listingId, {
        recipientName: fullName,
        recipientEmail: email,
        recipientIdCard: idCard || undefined,
        privateAccessToken: (listing as any).privateAccessToken || undefined,
      });

      setHoldData(response);
      setTimeLeft(response.holdDurationSeconds || 600);
      setIsExpired(false);
      showToast('Ticket reserved for 10 minutes! Please scan the VietQR code to pay.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Unable to reserve this ticket at the moment.';
      showToast(msg, 'error');
    } finally {
      setIsHolding(false);
    }
  };

  // Step 2: Confirm Payment Completion
  const handleConfirmPaid = async () => {
    if (isExpired) {
      showToast('Reservation expired. Please close this window and try again.', 'error');
      return;
    }

    if (!holdData) return;

    try {
      setIsCheckingPayment(true);
      const res = await resaleListingsApi.getPaymentStatus(listing.listingId);
      if (res.escrowStatus === 'Locked' || res.listingStatus === 'Sold') {
        showToast('Payment confirmed! Funds are secured under 24-hour protection.', 'success');
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
        showToast('Checking VietQR transfer status. Please wait a moment...', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Checking transaction status...', 'info');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Uniform Fee Model for Buyer: 5% (Min 10,000 VND)
  const buyerFeeRate = 0.05;
  const minBuyerFee = 10000;
  const estimatedBuyerFee = Math.max(Math.round(listing.resalePrice * buyerFeeRate), minBuyerFee);
  const totalBuyerPaidEstimated = Math.max(0, listing.resalePrice + estimatedBuyerFee - discountAmount);

  // Dynamic QR Code URL fallback if API does not return a direct image
  const displayQrUrl =
    holdData?.qrImageUrl ||
    (holdData
      ? `https://img.vietqr.io/image/${holdData.bankBin || '970422'}-${holdData.accountNumber || '0938434102'}-compact2.png?amount=${holdData.totalBuyerPaid}&addInfo=${encodeURIComponent(holdData.paymentReference)}&accountName=${encodeURIComponent(holdData.accountName || 'NGUYEN HUNG THINH')}`
      : '');

  return (
    <div
      id="buy-ticket-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="buy-ticket-modal-content"
        className="relative w-full max-w-3xl bg-[#0b0e17] border border-[#232738] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-4 text-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1d2232] bg-[#111422]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A36] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5A36]"></span>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-display uppercase tracking-wide">
                {holdData ? 'Automated VietQR Payment' : 'Secure Ticket Reservation & Purchase'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {listing.eventName} • Direct Re-issuance from Event Organizer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {holdData && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${
                  isExpired
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : timeLeft < 120
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                    : 'bg-[#FF5A36]/15 border-[#FF5A36]/30 text-[#FF5A36]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isExpired ? 'EXPIRED' : formatTimer(timeLeft)}</span>
              </div>
            )}
            {holdData && !isExpired && (
              <span className="hidden sm:inline text-[11px] text-cyan-300/90 font-medium">
                Awaiting payment confirmation...
              </span>
            )}
            <button
              onClick={handleCancelAndClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Content: Step 1 (Form) or Step 2 (VietQR Checkout) */}
        {!holdData ? (
          /* STEP 1: Buyer Information & Initial Hold Request */
          <form onSubmit={handleHoldListing} className="p-5 sm:p-6 space-y-5">
            {/* Warning if listing is already transacting */}
            {((listing.listingStatus || '').toLowerCase() === 'transacting') && (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center gap-3 text-amber-200 text-xs">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">Ticket Currently in a Checkout Session</div>
                  <div className="text-amber-200/80 mt-0.5">This ticket is reserved by another user. Please check back shortly or choose another verified ticket on the marketplace.</div>
                </div>
              </div>
            )}

            {/* Ticket Summary Card */}
            <div className="p-4 rounded-2xl bg-[#141826] border border-[#262c40] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    {listing.tierName || 'VIP ZONE A'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    • {listing.maskedTicketCode || 'AT*********88'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">{listing.eventName}</h3>
                <p className="text-xs text-zinc-400">{listing.eventVenue}</p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs text-zinc-400">Listed Price</div>
                <div className="text-lg sm:text-xl font-extrabold text-white font-display">
                  {formatVND(listing.resalePrice)}
                </div>
              </div>
            </div>

            {/* Protection Guarantee Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-emerald-300">
                  24-Hour Funds Protection &amp; Direct Organizer Re-issuance
                </div>
                <div className="text-zinc-300 text-[11px] leading-relaxed">
                  Your funds are safeguarded under TicketShield's 24-hour guarantee. The event organizer invalidates the previous ticket and issues a brand-new official ticket directly to your email.
                </div>
              </div>
            </div>

            {/* Buyer Contact Form */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Official Ticket Recipient Information
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">Full Name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-10 px-3 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">Phone Number *</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full h-10 px-3 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">Ticket Delivery Email *</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-10 px-3 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">
                  National ID / Passport (For venue entry verification)
                </span>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="Enter ID number (Optional)"
                  className="w-full h-10 px-3 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code (e.g. SAYHI)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                disabled={couponApplied}
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-[#FF5A36]"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponApplied}
                className="h-10 px-4 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-xs font-bold rounded-xl text-white transition-colors cursor-pointer"
              >
                {couponApplied ? 'Applied' : 'Apply'}
              </button>
            </div>

            {/* Payment & Fee Breakdown Box */}
            <div className="p-4 sm:p-4.5 bg-[#080B11]/90 border border-emerald-500/25 rounded-2xl space-y-2.5 text-xs shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 font-semibold text-zinc-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Payment Summary</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  5% Buyer Protection Fee
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Listed Price:</span>
                  <span className="font-semibold text-zinc-200 tabular-nums">
                    {formatVND(listing.resalePrice)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <div className="flex items-center gap-1">
                    <span>Service Fee &amp; 24h Buyer Protection (5%):</span>
                    <span className="text-[10px] text-zinc-500">(Min. 10,000 VND)</span>
                  </div>
                  <span className="font-medium text-amber-400 tabular-nums">
                    + {formatVND(estimatedBuyerFee)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>Promo Discount ({coupon}):</span>
                    <span className="font-medium tabular-nums">
                      - {formatVND(discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline pt-2.5 border-t border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Total VietQR Payment
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    (Includes ticket price + 24-hour protection fee)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-[#FF5A36] font-display tabular-nums tracking-tight">
                    {formatVND(totalBuyerPaidEstimated)}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-[#1d2232] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400 block">Total Amount:</span>
                <span className="text-2xl font-black font-display text-[#FF5A36]">
                  {formatVND(totalBuyerPaidEstimated)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isHolding || ((listing.listingStatus || '').toLowerCase() === 'transacting')}
                className="h-12 px-7 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                {isHolding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Holding for 10 minutes...</span>
                  </>
                ) : ((listing.listingStatus || '').toLowerCase() === 'transacting') ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>Ticket Currently Reserved</span>
                  </>
                ) : (
                  <>
                    <span>Hold for 10 Mins &amp; Pay with VietQR</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: Active 10-Minute Countdown & Dynamic VietQR Checkout */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Top Expired Alert if timer run out */}
            {isExpired && (
              <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-200 text-xs">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">Reservation window expired (10 minutes)</div>
                  <div>The ticket has been automatically released back to the marketplace. Please close this window and try again.</div>
                </div>
              </div>
            )}

            {/* VietQR & Transfer Info Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Left Column: VietQR Code Canvas */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#070910] border border-[#232738] rounded-2xl relative overflow-hidden group">
                <div className="text-[11px] font-mono text-zinc-400 mb-2 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Scan with any Banking App</span>
                </div>

                {/* QR Code Container */}
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-xl overflow-hidden bg-white p-2.5 shadow-[0_0_25px_rgba(255,90,54,0.2)] border-2 border-[#FF5A36]/40">
                  <img
                    src={displayQrUrl}
                    alt="Dynamic VietQR Code"
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      isExpired ? 'filter grayscale blur-[3px] opacity-40' : ''
                    }`}
                  />
                  {isExpired && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-2 text-center">
                      <Lock className="w-8 h-8 text-red-400 mb-1" />
                      <span className="text-xs font-bold text-red-400 uppercase">QR Expired</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Napas 247 QuickLink VietQR</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Automatically fills exact amount and payment reference
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Transfer Details Table with Quick Copy Buttons */}
              <div className="md:col-span-7 space-y-3">
                <div className="p-4 rounded-2xl bg-[#0e121d] border border-[#232738] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/10 flex items-center justify-between">
                    <span>Beneficiary Account Information</span>
                    <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Awaiting payment receipt
                    </span>
                  </div>

                  {/* Account Name */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Account Name:</span>
                    <span className="font-bold text-white uppercase">{holdData.accountName || 'NGUYEN HUNG THINH'}</span>
                  </div>

                  {/* Bank Name */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Bank:</span>
                    <span className="font-bold text-white">MBBank (Military Commercial Joint Stock Bank)</span>
                  </div>

                  {/* Account Number with Quick Copy */}
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Account Number:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {holdData.accountNumber || '0938434102'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(holdData.accountNumber || '0938434102', 'account')}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#FF5A36] rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === 'account' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedType === 'account' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Transfer Amount with Quick Copy */}
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Amount to Transfer:</span>
                      <span className="font-mono font-black text-[#FF5A36] text-base">
                        {formatVND(holdData.totalBuyerPaid)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(holdData.totalBuyerPaid.toString(), 'amount')}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[#FF5A36] rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === 'amount' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedType === 'amount' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Transfer Content / Reference with Quick Copy */}
                  <div className="p-3 rounded-xl bg-[#171408] border border-amber-500/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Exact Transfer Reference:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(holdData.paymentReference, 'reference')}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedType === 'reference' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedType === 'reference' ? 'Copied' : 'Copy Reference'}</span>
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-black/60 font-mono text-center text-amber-300 font-extrabold text-base tracking-widest">
                      {holdData.paymentReference}
                    </div>
                    <p className="text-[10px] text-amber-200/80 text-center">
                      *Please keep this reference exact so our automated system can instantly match your payment!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#1d2232] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate sm:whitespace-normal">
                  {isExpired ? (
                    <>
                      Your new ticket will be delivered to <strong className="text-white">{email}</strong> upon payment confirmation.
                    </>
                  ) : (
                    <>
                      Awaiting payment confirmation... Your official ticket will be delivered to{' '}
                      <strong className="text-white">{email}</strong> immediately.
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleCancelAndClose}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
                >
                  Cancel / Later
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isExpired || isCheckingPayment}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                  <span>{isCheckingPayment ? 'Verifying...' : 'I Have Paid'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
