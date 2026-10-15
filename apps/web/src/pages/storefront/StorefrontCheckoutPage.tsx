import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { getStorefrontEventById } from '../../data/storefrontCatalog';

export const StorefrontCheckoutPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const event = getStorefrontEventById(eventId);

  const stateData = location.state as {
    ticketQuantities?: Record<string, number>;
    grandTotal?: number;
    rawSubtotal?: number;
    fee?: number;
  } | null;

  const rawSubtotal = stateData?.rawSubtotal || 9000000;
  const fee = stateData?.fee || 180000;
  const grandTotal = stateData?.grandTotal || 9180000;

  // Countdown timer state
  const totalDuration = 15 * 60; // 15 mins window
  const [duration, setDuration] = useState(9 * 60 + 42); // 09:42

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct = (duration / totalDuration) * 100;
  const strokeDashoffset = 100 - pct;

  // Selected Payment Method
  const [selectedMethod, setSelectedMethod] = useState<'vietqr' | 'card' | 'wallet'>('vietqr');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}`);
  };

  const handleConfirmed = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsConfirmed(true);
      showToast('Đã xác thực thành công đơn hàng! E-Ticket đã được kích hoạt.');
    }, 1800);
  };

  const handleCancelOrder = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng? Chỗ ngồi sẽ được trả lại cho khách hàng khác.')) {
      navigate('/storefront');
    }
  };

  const bankAccount = '1903 8899 7766 01';
  const transferAmount = grandTotal.toString();
  const transferMemo = 'TS89214 SOOBIN';

  const qrPayload = `00020101021238580010A000000727012600069704220112190388997766010208QRIBFTTA520460115303704540${grandTotal}5802VN6214${transferMemo}6304`;

  return (
    <StorefrontLayout activeTab="kham-pha">
      {/* Top Ambient Glow */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#ff5945]/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute -top-20 right-1/4 w-80 h-80 bg-[#571bc1]/20 rounded-full blur-[110px] pointer-events-none" />

        <div className="max-w-[1360px] mx-auto px-4 lg:px-12 py-8 flex flex-col gap-6">
          {/* ORDER STATUS & EXPIRATION TIMER BANNER */}
          <section className="relative overflow-hidden rounded-2xl bg-[#191b23] shadow-xl p-5 sm:p-6 border border-[#33343d]/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-[#282a32] px-3.5 py-1.5 rounded-xl w-fit">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5945] animate-ping" />
                  <span className="text-[11px] font-bold text-[#ffb4a8] tracking-widest uppercase">
                    KHOÁ VÉ TẠM THỜI
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-[#aa8984]">Mã giao dịch:</span>
                  <span className="font-display text-base font-bold text-white tracking-tight">
                    #ORD-89214
                  </span>
                </div>
                <span className="hidden md:inline text-[#33343d] font-bold">•</span>
                <p className="text-xs text-[#e3beb8] max-w-md">
                  Vé đã được bảo lưu độc quyền cho bạn. Vui lòng hoàn tất thanh toán trước khi phiên khóa vé tự động hủy.
                </p>
              </div>

              {/* Countdown Visual Box */}
              <div className="flex items-center gap-4 bg-[#0c0e16] px-5 py-2.5 rounded-2xl shrink-0 border border-white/5">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-[#aa8984] uppercase tracking-wider font-bold">
                    Thời gian giữ vé
                  </span>
                  <div className="flex items-center gap-1 font-display text-2xl text-[#ffb4a8] font-bold tabular-nums">
                    <span className="material-symbols-outlined text-[24px] text-[#ff5945] animate-pulse">
                      timer
                    </span>
                    <span>{timeFormatted}</span>
                  </div>
                </div>

                <div className="w-10 h-10 relative flex items-center justify-center">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#33343d]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-[#ff5945] transition-all duration-1000 ease-linear"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="100, 100"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Linear Progress Meter */}
            <div className="w-full bg-[#33343d]/40 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-[#ff5945] rounded-full transition-all duration-1000 shadow-[0_0_12px_#ff5945]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </section>

          {/* TWO-COLUMN CHECKOUT MATRIX */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: PAYMENT METHOD & TRANSFER DETAILS (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Method Selection Segment */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ff5945] text-[22px]">
                      account_balance_wallet
                    </span>
                    Phương thức thanh toán
                  </h2>
                  <span className="text-[11px] font-mono text-[#4cd7f6] bg-[#00a0bb]/20 px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                    Cyber-Escrow 256-bit
                  </span>
                </div>

                {/* Tab Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0c0e16] p-1.5 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('vietqr')}
                    className={`flex flex-col items-start p-3 rounded-xl transition-all text-left ${
                      selectedMethod === 'vietqr'
                        ? 'bg-[#1d1f28] text-white shadow-sm ring-1 ring-[#ff5945]'
                        : 'text-[#aa8984] hover:bg-[#1d1f28]/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-[#ffb4a8]">VietQR 247</span>
                      <span className="w-2 h-2 rounded-full bg-[#ff5945] shadow-[0_0_8px_#ff5945]" />
                    </div>
                    <span className="text-[11px] text-[#e3beb8] mt-0.5">Khuyên dùng • Miễn phí</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`flex flex-col items-start p-3 rounded-xl transition-all text-left ${
                      selectedMethod === 'card'
                        ? 'bg-[#1d1f28] text-white shadow-sm ring-1 ring-[#ff5945]'
                        : 'text-[#aa8984] hover:bg-[#1d1f28]/60 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-white">Thẻ Quốc Tế</span>
                    <span className="text-[11px] text-[#aa8984] mt-0.5">Visa / Mastercard / JCB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('wallet')}
                    className={`flex flex-col items-start p-3 rounded-xl transition-all text-left ${
                      selectedMethod === 'wallet'
                        ? 'bg-[#1d1f28] text-white shadow-sm ring-1 ring-[#ff5945]'
                        : 'text-[#aa8984] hover:bg-[#1d1f28]/60 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-white">Ví Điện Tử</span>
                    <span className="text-[11px] text-[#aa8984] mt-0.5">MoMo / ShopeePay</span>
                  </button>
                </div>
              </div>

              {/* Official VietQR Settlement Module */}
              <div className="rounded-2xl bg-[#191b23] border border-[#33343d]/40 shadow-xl p-6 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#ff5945]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* QR Showcase Section */}
                  <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
                    <div className="relative p-4 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center">
                      {/* Logo header inside QR */}
                      <div className="flex items-center justify-between w-full max-w-[190px] mb-2 px-1">
                        <span className="text-xs font-black tracking-tighter text-blue-800">
                          Viet<span className="text-red-600">QR</span>
                        </span>
                        <span className="text-[10px] font-bold tracking-widest text-emerald-800 bg-emerald-50 px-1 rounded">
                          napas247
                        </span>
                      </div>

                      {/* QR Code Canvas with Center Badge */}
                      <div className="relative p-1">
                        <QRCodeCanvas
                          value={qrPayload}
                          size={180}
                          level="H"
                          marginSize={1}
                        />
                        {/* Center Shield Badge */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-[#ff5945] flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white">
                            TS
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-center">
                        <span className="text-[10px] font-bold text-gray-800 tracking-wider">
                          QUÉT BẰNG APP NGÂN HÀNG
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#4cd7f6] text-xs">
                      <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                      <span className="font-medium">Tự động điền số tiền & nội dung</span>
                    </div>
                  </div>

                  {/* Bank Transfer Numerical Dossier */}
                  <div className="flex-1 w-full flex flex-col gap-3">
                    <div>
                      <span className="text-[10px] text-[#aa8984] uppercase tracking-wider font-bold">
                        Tài khoản thụ hưởng ủy quyền
                      </span>
                      <p className="font-display font-bold text-sm sm:text-base text-white leading-tight">
                        CÔNG TY TNHH TICKETSHIELD VIỆT NAM
                      </p>
                      <span className="text-[11px] text-[#4cd7f6] font-semibold tracking-wide flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">security</span>
                        TÀI KHOẢN ESCROW ĐẢM BẢO BỞI TECHCOMBANK
                      </span>
                    </div>

                    {/* Data Field: Bank */}
                    <div className="p-3 rounded-xl bg-[#1d1f28] flex items-center justify-between border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#aa8984]">Ngân hàng</span>
                        <span className="text-xs font-bold text-white">Techcombank (TCB)</span>
                      </div>
                      <span className="text-[10px] text-[#e3beb8] bg-[#282a32] px-2 py-0.5 rounded font-mono">
                        Hội sở chính
                      </span>
                    </div>

                    {/* Data Field: Account Number */}
                    <div className="p-3 rounded-xl bg-[#1d1f28] flex items-center justify-between border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#aa8984]">Số tài khoản</span>
                        <span className="font-mono font-bold text-sm sm:text-base text-white tracking-wider">
                          {bankAccount}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('19038899776601', 'số tài khoản')}
                        className="px-3 py-1.5 rounded-lg bg-[#282a32] hover:bg-[#33343d] text-white text-xs flex items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#ff5945]">content_copy</span>
                        <span>Sao chép</span>
                      </button>
                    </div>

                    {/* Data Field: Amount */}
                    <div className="p-3 rounded-xl bg-[#1d1f28] flex items-center justify-between border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#aa8984]">Số tiền cần chuyển</span>
                        <span className="font-display font-extrabold text-lg text-[#ffb4a8] tracking-tight">
                          {grandTotal.toLocaleString('vi-VN')} <span className="text-xs font-normal text-white">VNĐ</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transferAmount, 'số tiền')}
                        className="px-3 py-1.5 rounded-lg bg-[#282a32] hover:bg-[#33343d] text-white text-xs flex items-center gap-1 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#ff5945]">content_copy</span>
                        <span>Sao chép</span>
                      </button>
                    </div>

                    {/* Data Field: Memo */}
                    <div className="p-3 rounded-xl bg-[#ff5945]/10 border border-[#ff5945]/30 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#ff5945] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Nội dung chuyển khoản (Bắt buộc)
                        </span>
                        <span className="font-mono font-bold text-sm text-[#ffb4a8] tracking-wider mt-0.5">
                          {transferMemo}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transferMemo, 'cú pháp chuyển khoản')}
                        className="px-3 py-1.5 rounded-lg bg-[#ff5945] hover:bg-[#ff7252] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto-Checking Active Radar Strip */}
                <div className="p-4 rounded-xl bg-[#0c0e16] flex items-center justify-between gap-3 border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="w-3 h-3 rounded-full bg-[#4cd7f6]" />
                      <span className="w-3 h-3 rounded-full bg-[#4cd7f6] animate-ping absolute" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-white font-semibold truncate">
                        Hệ thống đang tự động nhận diện thanh toán
                      </span>
                      <span className="text-[11px] text-[#aa8984]">
                        Đồng bộ tự động qua cổng Napas247 mỗi 3 giây...
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[#4cd7f6] text-xs font-mono shrink-0">
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>Realtime</span>
                  </div>
                </div>

                {/* Urgent Support Hotlink */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#aa8984]">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#e3beb8]">headset_mic</span>
                    <span>Hỗ trợ khẩn cấp giao dịch 24/7:</span>
                    <a href="tel:19006868" className="text-white font-bold hover:text-[#ffb4a8] transition-colors">
                      1900 6868
                    </a>
                  </div>
                  <button type="button" className="text-[#4cd7f6] hover:underline flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>Chat với Điều phối viên Escrow</span>
                  </button>
                </div>
              </div>

              {/* Escrow Step Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#191b23] border border-[#33343d]/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#282a32] flex items-center justify-center text-[#ff5945] font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-semibold">Quét mã VietQR</span>
                    <span className="text-[11px] text-[#aa8984]">Mở bất kỳ app ngân hàng để quét tự động</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#191b23] border border-[#33343d]/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#282a32] flex items-center justify-center text-[#ff5945] font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-semibold">Tạm giữ Escrow</span>
                    <span className="text-[11px] text-[#aa8984]">Tiền lưu an toàn, người bán chưa nhận ngay</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#191b23] border border-[#33343d]/30 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#282a32] flex items-center justify-center text-[#4cd7f6] font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-semibold">Nhận mã E-Ticket</span>
                    <span className="text-[11px] text-[#aa8984]">Hệ thống cấp vé & QR bảo mật qua email tức thì</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY & RECIPIENT PROFILE (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Concert Artifact Ticket Container */}
              <div className="rounded-2xl bg-[#191b23] border border-[#33343d]/40 shadow-2xl overflow-hidden flex flex-col">
                {/* Visual Header Stub */}
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src="/images/storefront/checkout-header.jpg"
                    alt={event.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191b23] via-[#191b23]/60 to-transparent" />

                  {/* Floating Tag */}
                  <div className="absolute top-3 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-[#ff5945]" />
                    <span className="text-[10px] text-white tracking-wider uppercase font-bold">
                      Official Concert
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] text-[#ff5945] tracking-widest uppercase font-bold">
                      ARENA TOUR 2025
                    </span>
                    <h3 className="font-display font-bold text-lg text-white leading-tight truncate">
                      {event.title}
                    </h3>
                  </div>
                </div>

                {/* Location & Schedule */}
                <div className="px-4 py-3 bg-[#0c0e16] flex flex-col gap-1 border-y border-[#33343d]/30 text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[18px] text-[#ff5945]">calendar_clock</span>
                    <span className="font-bold">{event.dateDisplay} • {event.timeDisplay}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#aa8984]">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span className="truncate">{event.venueName}</span>
                  </div>
                </div>

                {/* Ticket Seat Breakdown */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Chi tiết vị trí ngồi
                    </span>
                    <span className="text-[10px] font-bold text-[#d0bcff] bg-[#571bc1]/30 px-2.5 py-0.5 rounded uppercase">
                      VIP LOUNGE
                    </span>
                  </div>

                  {/* Seat Card */}
                  <div className="p-3 rounded-xl bg-[#1d1f28] flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#282a32] flex flex-col items-center justify-center font-bold text-white">
                        <span className="text-[9px] text-[#aa8984] leading-none">QTY</span>
                        <span className="font-display text-sm text-[#ffb4a8]">2x</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">Diamond Lounge VIP</span>
                        <span className="text-[11px] text-[#aa8984]">Khu vực A1 • Hàng D • Ghế 14, 15</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-bold text-sm text-white">9.000.000</span>
                      <span className="text-[10px] text-[#aa8984] block">VNĐ</span>
                    </div>
                  </div>

                  {/* Perforation Break */}
                  <div className="relative py-2 flex items-center justify-between overflow-hidden">
                    <div className="w-3 h-6 bg-[#11131b] rounded-r-full -ml-5" />
                    <div className="flex-1 border-t-2 border-dashed border-[#33343d]/60 mx-2" />
                    <div className="w-3 h-6 bg-[#11131b] rounded-l-full -mr-5" />
                  </div>

                  {/* Ledger Pricing */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between items-center text-[#aa8984]">
                      <span>Giá gốc vé (2 vé VIP)</span>
                      <span className="font-medium text-white">{rawSubtotal.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between items-center text-[#aa8984]">
                      <span className="flex items-center gap-1">
                        Phí bảo hiểm Cyber-Escrow & Giữ vé
                        <span className="material-symbols-outlined text-[13px] text-[#4cd7f6]">info</span>
                      </span>
                      <span className="font-medium text-white">{fee.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="flex justify-between items-center text-[#aa8984]">
                      <span>Voucher giảm giá</span>
                      <span className="text-[#4cd7f6] font-medium">-0 VNĐ</span>
                    </div>

                    <div className="pt-2 mt-1 border-t border-white/10 flex justify-between items-baseline">
                      <span className="font-bold text-sm text-white uppercase">TỔNG THANH TOÁN</span>
                      <div className="text-right">
                        <span className="font-display font-extrabold text-2xl text-[#ffb4a8] tracking-tight">
                          {grandTotal.toLocaleString('vi-VN')}
                        </span>
                        <span className="font-bold text-xs text-white ml-1">VNĐ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Information Card */}
                <div className="px-5 py-3.5 bg-[#1d1f28] flex flex-col gap-1.5 border-t border-[#33343d]/30 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#aa8984] uppercase tracking-wider font-bold">
                      Thông tin nhận vé (E-Ticket)
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#aa8984]">alternate_email</span>
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Nguyễn Hải Đăng</span>
                      <span className="text-[11px] text-[#ffb4a8] font-semibold">Tài khoản VIP</span>
                    </div>
                    <div className="flex items-center justify-between text-[#aa8984]">
                      <span>Email:</span>
                      <span className="text-white font-mono">haidang.music@gmail.com</span>
                    </div>
                    <div className="flex items-center justify-between text-[#aa8984]">
                      <span>Số điện thoại:</span>
                      <span className="text-white font-mono">0988 ••• 421</span>
                    </div>
                  </div>
                </div>

                {/* Escrow Assurance */}
                <div className="p-4 bg-[#571bc1]/10 border-t border-[#571bc1]/20 flex items-start gap-2.5 text-xs text-[#e9ddff]">
                  <span className="material-symbols-outlined text-[#d0bcff] text-[20px] shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <p className="leading-snug">
                    <strong className="text-white font-bold">TicketShield Escrow cam kết:</strong> Toàn bộ số tiền được giữ an toàn tại tài khoản ủy thác. Khoản tiền chỉ giải ngân cho người bán sau khi bạn quét mã vé vào cổng SVĐ thành công.
                  </p>
                </div>

                {/* Action Controls Group */}
                <div className="p-5 flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={isVerifying || isConfirmed}
                    onClick={handleConfirmed}
                    className={`w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isConfirmed
                        ? 'bg-emerald-600 shadow-[0_0_24px_rgba(16,185,129,0.4)]'
                        : 'bg-[#ff5945] hover:bg-[#ff7252] shadow-[0_0_24px_rgba(255,89,69,0.35)]'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                        <span>Đang xác thực hệ thống Escrow...</span>
                      </>
                    ) : isConfirmed ? (
                      <>
                        <span className="material-symbols-outlined text-[20px]">task_alt</span>
                        <span>Đã thanh toán thành công!</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        <span>Tôi đã chuyển khoản thành công</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    className="w-full py-2 rounded-xl text-[#aa8984] hover:text-[#ffb4ab] hover:bg-[#1d1f28] text-xs font-semibold transition-all text-center"
                  >
                    Hủy phiên giao dịch đơn hàng này
                  </button>
                </div>
              </div>

              {/* Security Badges Footer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0c0e16] border border-white/5 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">lock</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-bold">Mã hoá SSL 256-Bit</span>
                    <span className="text-[10px] text-[#aa8984]">Chuẩn an ninh PCI-DSS</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0c0e16] border border-white/5 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#ff5945] text-[20px]">shield_with_heart</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-bold">Bồi thường 150%</span>
                    <span className="text-[10px] text-[#aa8984]">Nếu phát sinh sự cố vé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification dynamic node */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#282a32] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-[#33343d] animate-in fade-in slide-in-from-bottom-2 text-xs font-semibold">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </StorefrontLayout>
  );
};
