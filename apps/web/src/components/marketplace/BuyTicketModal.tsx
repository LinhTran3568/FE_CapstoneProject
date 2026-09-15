import React, { useState, useEffect } from 'react';
import { X, Clock, QrCode, ShieldCheck, Check, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { formatVND } from '../../utils/formatters';
import { useAuthStore } from '../../stores/authStore';

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
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'card'>('vietqr');
  const [coupon, setCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync user details if user profile loads or changes
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phoneNumber) setPhone(user.phoneNumber);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // 10-minute seat reservation countdown timer (BR-E01)
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'SAYHI' || coupon.trim().toUpperCase() === 'TICKETSHIELD') {
      setDiscountAmount(100000);
      setCouponApplied(true);
    } else {
      alert('Mã giảm giá không hợp lệ. Hãy thử: SAYHI hoặc TICKETSHIELD');
    }
  };

  const finalPrice = Math.max(0, listing.resalePrice - discountAmount);
  const transferContent = `TS ${listing.listingId.substring(0, 8).toUpperCase()}`;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(transferContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      alert('Vui lòng điền đầy đủ thông tin nhận vé!');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const orderId = `TS-${Math.floor(100000 + Math.random() * 900000)}`;
      setIsProcessing(false);
      onSuccess({
        orderId,
        listing,
        buyerName: fullName,
        buyerPhone: phone,
        buyerEmail: email,
        finalPrice,
      });
    }, 1200);
  };

  return (
    <div
      id="buy-ticket-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="buy-ticket-modal-content"
        className="relative w-full max-w-2xl bg-[#0d0f17] border border-[#232736] rounded-3xl shadow-2xl overflow-hidden my-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2331] bg-[#121520]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] animate-ping"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Giữ chỗ & Thanh toán an toàn
              </h2>
              <p className="text-xs text-zinc-400">
                {listing.eventName} • Đổi mã QR mới tức thì từ Ban tổ chức
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/30 text-[#FF5A36] text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ticket Summary Card */}
          <div className="p-4 rounded-2xl bg-[#141824] border border-[#262c3f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                  {listing.tierName || 'VIP ZONE A'}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  • {listing.maskedTicketCode || 'AT*********93'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">{listing.eventName}</h3>
              <p className="text-xs text-zinc-400">{listing.eventVenue}</p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-xs text-zinc-400">Giá chuyển nhượng</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#FF5A36] font-display">
                {formatVND(listing.resalePrice)}
              </div>
              {listing.discountPercentage > 0 && (
                <div className="text-[11px] text-zinc-500 line-through">
                  {formatVND(listing.originalPrice)}
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Trust Guarantee */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-emerald-300">
                Bảo hiểm tiền 24h & Cấp vé mới 100%
              </div>
              <div className="text-zinc-300 text-[11px]">
                Hệ thống giữ tiền an toàn cho đến khi bạn nhận được mã QR mới chính chủ. Tiền chỉ giải ngân cho người bán sau 24h an toàn.
              </div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Thông tin người nhận vé chính chủ
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Họ và tên</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#141824] border border-[#262c3f] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Số điện thoại</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#141824] border border-[#262c3f] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Email nhận vé</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#141824] border border-[#262c3f] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
            </div>
          </div>

          {/* Payment Method selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Phương thức chuyển khoản
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('vietqr')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  paymentMethod === 'vietqr'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/10 text-white shadow-lg'
                    : 'border-[#262c3f] bg-[#141824] text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <QrCode className="w-5 h-5 text-[#FF5A36]" />
                <div>
                  <div className="text-xs font-bold text-white">Chuyển khoản VietQR</div>
                  <div className="text-[11px] text-zinc-400">Xác nhận tức thì qua Napas 247</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'border-[#FF5A36] bg-[#FF5A36]/10 text-white shadow-lg'
                    : 'border-[#262c3f] bg-[#141824] text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white">Thẻ ATM / Visa / Master</div>
                  <div className="text-[11px] text-zinc-400">Cổng thanh toán liên kết</div>
                </div>
              </button>
            </div>
          </div>

          {/* VietQR Quick Details */}
          {paymentMethod === 'vietqr' && (
            <div className="p-4 rounded-2xl bg-[#090C12] border border-white/10 space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Nội dung chuyển khoản tự động:</span>
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="text-[11px] text-[#FF5A36] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-sm text-amber-300 font-bold tracking-widest text-center">
                {transferContent}
              </div>
            </div>
          )}

          {/* Coupon Code */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá (VD: SAYHI)"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              disabled={couponApplied}
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#141824] border border-[#262c3f] text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-[#FF5A36]"
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

          {/* Total Calculation & Action */}
          <div className="pt-3 border-t border-[#1f2331] flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-zinc-400 block">Tổng thanh toán:</span>
              <span className="text-2xl font-black font-display text-white">
                {formatVND(finalPrice)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="h-12 px-8 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 disabled:opacity-50 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.4)] transition-all flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <span>Xác nhận mua vé</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
