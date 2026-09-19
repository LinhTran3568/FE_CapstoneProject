import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

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
  if (!isOpen || !listing) return null;

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

  // Copy Feedback Indicators
  const [copiedType, setCopiedType] = useState<'amount' | 'reference' | 'account' | null>(null);

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
    }
  }, [isOpen, listing]);

  // 10-Minute Countdown Timer Handler
  useEffect(() => {
    if (!holdData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          showToast('Thời gian giữ chỗ vé (10 phút) đã hết hạn. Vui lòng thao tác lại!', 'warning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [holdData]);

  // Real-time Payment Status Polling (every 2.5s)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    if (!holdData || isExpired) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await resaleListingsApi.getPaymentStatus(listing.listingId);
        if (!isMounted) return;

        if (res.escrowStatus === 'Locked' || res.listingStatus === 'Sold') {
          clearInterval(pollInterval);
          showToast('Thanh toán thành công! Giao dịch đã được khóa Escrow an toàn.', 'success');
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
        }
      } catch {
        // Silently continue polling
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [holdData, isExpired, listing, fullName, phone, email, onSuccess, showToast]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'SAYHI' || coupon.trim().toUpperCase() === 'TICKETSHIELD') {
      setDiscountAmount(100000);
      setCouponApplied(true);
      showToast('Đã áp dụng mã giảm giá 100.000 VNĐ!', 'success');
    } else {
      showToast('Mã giảm giá không hợp lệ. Gợi ý: SAYHI hoặc TICKETSHIELD', 'warning');
    }
  };

  const handleCopy = (text: string, type: 'amount' | 'reference' | 'account') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    showToast(`Đã sao chép!`, 'success');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Step 1: Submit Form -> Call POST /resale-listings/{id}/hold
  const handleHoldListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Bạn phải đăng nhập để thực hiện mua vé!', 'error');
      return;
    }
    if (!fullName || !phone || !email) {
      showToast('Vui lòng nhập đầy đủ thông tin người nhận vé!', 'warning');
      return;
    }

    try {
      setIsHolding(true);
      showToast('Đang khởi tạo lệnh giữ chỗ 10 phút & tạo VietQR dynamic...', 'info');

      const response = await resaleListingsApi.holdListing(listing.listingId, {
        recipientName: fullName,
        recipientEmail: email,
        recipientIdCard: idCard || undefined,
        privateAccessToken: (listing as any).privateAccessToken || undefined,
      });

      setHoldData(response);
      setTimeLeft(response.holdDurationSeconds || 600);
      setIsExpired(false);
      showToast('Giữ chỗ vé thành công trong 10 phút! Vui lòng quét mã VietQR để thanh toán.', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Không thể giữ chỗ vé vào lúc này.';
      showToast(msg, 'error');
    } finally {
      setIsHolding(false);
    }
  };

  const handleConfirmPaid = async () => {
    if (isExpired) {
      showToast('Đơn giữ chỗ đã hết hạn. Vui lòng đóng và thử lại.', 'error');
      return;
    }

    if (!holdData) return;

    try {
      setIsCheckingPayment(true);
      const res = await resaleListingsApi.getPaymentStatus(listing.listingId);
      if (res.escrowStatus === 'Locked' || res.listingStatus === 'Sold') {
        showToast('Thanh toán thành công! Giao dịch đã được xác nhận vào quỹ Escrow.', 'success');
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
        showToast('Hệ thống đang kiểm tra giao dịch chuyển khoản VietQR. Vui lòng đợi trong giây lát...', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Đang kiểm tra giao dịch...', 'info');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const finalPrice = Math.max(0, listing.resalePrice - discountAmount);

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
                {holdData ? 'Khung Thanh Toán VietQR Tự Động' : 'Giữ Chỗ & Đặt Mua Vé An Toàn'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {listing.eventName} • Đổi mã QR mới từ Ban tổ chức
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
                <span>{isExpired ? 'ĐÃ HẾT HẠN' : formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={onClose}
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
                <div className="text-xs text-zinc-400">Giá vé công khai</div>
                <div className="text-lg sm:text-xl font-extrabold text-[#FF5A36] font-display">
                  {formatVND(finalPrice)}
                </div>
                {discountAmount > 0 && (
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Giảm giá: -{formatVND(discountAmount)}
                  </div>
                )}
              </div>
            </div>

            {/* Escrow Trust Guarantee Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-emerald-300">
                  Bảo hiểm giao dịch Smart Escrow 24h
                </div>
                <div className="text-zinc-300 text-[11px] leading-relaxed">
                  Tiền chuyển khoản của bạn được giữ an toàn tại TicketShield. Ban tổ chức sẽ hủy mã QR cũ và cấp mã QR chính chủ hoàn toàn mới trực tiếp sang email của bạn.
                </div>
              </div>
            </div>

            {/* Buyer Contact Form */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Thông tin người nhận vé chính chủ
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">Họ và tên *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-10 px-3 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">Số điện thoại *</span>
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
                  <span className="text-[11px] text-zinc-400 block mb-1">Email nhận vé *</span>
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
                  Số CCCD / CMND (Dùng xác minh cổng soát vé Ban Tổ Chức)
                </span>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="Nhập 12 số CCCD (Không bắt buộc)"
                  className="w-full h-10 px-3 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã giảm giá (VD: SAYHI)"
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
                {couponApplied ? 'Đã áp dụng' : 'Áp dụng'}
              </button>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-[#1d2232] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400 block">Tổng số tiền cần trả:</span>
                <span className="text-2xl font-black font-display text-white">
                  {formatVND(finalPrice)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isHolding}
                className="h-12 px-7 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 disabled:opacity-50 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.4)] transition-all flex items-center gap-2 cursor-pointer"
              >
                {isHolding ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang giữ chỗ 10 phút...</span>
                  </>
                ) : (
                  <>
                    <span>Giữ chỗ 10 phút & Thanh toán VietQR</span>
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
                  <div className="font-bold">Khung thời gian giữ chỗ vé đã kết thúc (10 phút)</div>
                  <div>Vé đã được tự động mở lại trên sàn cho các người mua khác. Vui lòng đóng cửa sổ này và đặt giữ chỗ lại.</div>
                </div>
              </div>
            )}

            {/* VietQR & Transfer Info Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Left Column: VietQR Code Canvas */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#070910] border border-[#232738] rounded-2xl relative overflow-hidden group">
                <div className="text-[11px] font-mono text-zinc-400 mb-2 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Quét bằng ứng dụng ngân hàng</span>
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
                      <span className="text-xs font-bold text-red-400 uppercase">QR Hết Hạn</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Napas 247 QuickLink VietQR</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Tự động điền đúng Số tiền & Nội dung chuyển khoản
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Transfer Details Table with Quick Copy Buttons */}
              <div className="md:col-span-7 space-y-3">
                <div className="p-4 rounded-2xl bg-[#0e121d] border border-[#232738] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/10 flex items-center justify-between">
                    <span>Thông tin tài khoản nhận tiền</span>
                    <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Hệ thống đang chờ giao dịch
                    </span>
                  </div>

                  {/* Account Name */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Tên người nhận:</span>
                    <span className="font-bold text-white uppercase">{holdData.accountName || 'NGUYEN HUNG THINH'}</span>
                  </div>

                  {/* Bank Name */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Ngân hàng:</span>
                    <span className="font-bold text-white">MBBank (Ngân hàng Quân Đội)</span>
                  </div>

                  {/* Account Number with Quick Copy */}
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Số tài khoản:</span>
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
                      <span>{copiedType === 'account' ? 'Đã chép' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Transfer Amount with Quick Copy */}
                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Số tiền cần thanh toán:</span>
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
                      <span>{copiedType === 'amount' ? 'Đã chép' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Transfer Content / Reference with Quick Copy */}
                  <div className="p-3 rounded-xl bg-[#171408] border border-amber-500/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Nội dung chuyển khoản chính xác:
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
                        <span>{copiedType === 'reference' ? 'Đã chép' : 'Copy nội dung'}</span>
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-black/60 font-mono text-center text-amber-300 font-extrabold text-base tracking-widest">
                      {holdData.paymentReference}
                    </div>
                    <p className="text-[10px] text-amber-200/80 text-center">
                      *Vui lòng giữ nguyên nội dung mã này để hệ thống khớp lệnh thanh toán tự động qua SePay!
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
                  Mã QR mới sẽ được gửi về email <strong className="text-white">{email}</strong> ngay khi nhận tiền.
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
                >
                  Hủy / Để Sau
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isExpired || isCheckingPayment}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                  <span>{isCheckingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
