import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { resaleApi, VerificationResult } from '@ticketshield/api-client';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Lock,
  Calendar,
  MapPin,
  Ticket,
  QrCode,
  Edit3,
  Check,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const SellTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Auto scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Resale Workflow Verification state
  const [ticketCode, setTicketCode] = useState('ATSH-VIP-888');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);

  // Step 2 OTP Form state
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Step 4 Pricing state
  const [faceValue, setFaceValue] = useState<number>(2500000);
  const [resalePrice, setResalePrice] = useState<number>(2500000);

  // Step 5 Confirmation state
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isPrivateListing, setIsPrivateListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string>('');

  // Step 1: Request OTP for Ticket Verification
  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) {
      showToast('Vui lòng nhập mã định danh vé!', 'warning');
      return;
    }

    try {
      setIsRequestingOtp(true);
      showToast('Đang tra cứu và gửi mã OTP xác thực từ Ban Tổ Chức...', 'info');
      const result = await resaleApi.requestVerificationOtp(ticketCode.trim().toUpperCase());
      setVerificationId(result.verificationId);
      setVerificationResult(result);
      if (result.originalPrice && result.originalPrice > 0) {
        setFaceValue(result.originalPrice);
        setResalePrice(result.originalPrice);
      }
      showToast('Đã gửi mã xác thực OTP! Vui lòng kiểm tra email chủ vé.', 'success');
      setCurrentStep(2);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('TICKET_NOT_ELIGIBLE') || msg.includes('TICKET_NOT_AVAILABLE') || msg.includes('LOCKED')) {
        showToast('Mã vé này hiện đang trong phiên giao dịch khác hoặc chưa sẵn sàng để bán.', 'warning');
      } else if (msg.includes('TICKET_NOT_FOUND')) {
        showToast('Không tìm thấy thông tin vé với mã đã nhập. Vui lòng kiểm tra lại mã vé!', 'error');
      } else {
        showToast('Không thể xác thực mã vé vào lúc này.', 'error');
      }
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!verificationId) {
      showToast('Không tìm thấy phiên xác thực vé!', 'warning');
      return;
    }
    try {
      setIsResendingOtp(true);
      await resaleApi.resendVerificationOtp(verificationId);
      showToast('Đã gửi lại mã OTP thành công!', 'success');
    } catch (err: any) {
      showToast('Không thể gửi lại mã OTP. Vui lòng thử lại sau ít phút!', 'error');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Step 2: Confirm OTP & Lock Ticket
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('').trim();
    if (otpCode.length < 4) {
      showToast('Vui lòng nhập đầy đủ mã xác thực OTP!', 'warning');
      return;
    }

    if (!verificationId) {
      showToast('Phiên xác thực vé không hợp lệ!', 'error');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const result = await resaleApi.confirmVerificationOtp(verificationId, otpCode);
      setVerificationResult(result);
      if (result.originalPrice && result.originalPrice > 0) {
        setFaceValue(result.originalPrice);
        setResalePrice(result.originalPrice);
      }
      showToast('Xác thực OTP & Khóa vé gốc thành công!', 'success');
      setCurrentStep(3);
    } catch (err: any) {
      showToast('Mã xác thực OTP không chính xác hoặc phiên đã hết hạn. Vui lòng thử lại!', 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleApplyDiscount = (percent: number) => {
    if (percent === 0) {
      setResalePrice(faceValue);
    } else {
      setResalePrice(Math.round(faceValue * (1 - percent / 100)));
    }
  };

  // Step 5: Publish Resale Listing
  const handlePublishListing = async () => {
    if (!agreedTerms) {
      showToast('Vui lòng đồng ý với quy định niêm yết vé chính chủ!', 'warning');
      return;
    }

    if (!verificationId) {
      showToast('Thiếu phiên xác thực vé!', 'error');
      return;
    }

    if (resalePrice > faceValue) {
      showToast(`Giá rao bán không được vượt quá giá gốc (${faceValue.toLocaleString('vi-VN')} VNĐ)!`, 'warning');
      return;
    }

    try {
      setIsPublishing(true);
      const result = await resaleApi.publishListing(verificationId, resalePrice, isPrivateListing);
      if (result.listingId) {
        setPublishedListingId(result.listingId);
      }
      showToast('Đã niêm yết vé thành công lên Marketplace TicketShield!', 'success');
      setCurrentStep(6);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('TICKET_ALREADY_LISTED')) {
        showToast('Mã vé này đã được đăng bán trên hệ thống trước đó! Vui lòng vào mục "MY LISTINGS" để kiểm tra.', 'warning');
      } else if (msg.includes('PRICE_EXCEEDS_CEILING')) {
        showToast(`Giá bán lại không được vượt quá giá gốc (${faceValue.toLocaleString('vi-VN')} VNĐ)!`, 'warning');
      } else {
        showToast('Không thể tạo niêm yết vé vào lúc này. Vui lòng thử lại sau!', 'error');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 md:px-12 font-sans antialiased selection:bg-[#FF5A36] selection:text-white overflow-hidden">
      {/* Inline Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes subtleGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.38; transform: scale(1.12); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.6); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes kenburnsSlow {
          0% { transform: scale(1.04) translate(0, 0); filter: brightness(1.15) contrast(1.25); }
          50% { transform: scale(1.14) translate(-12px, -18px); filter: brightness(1.25) contrast(1.35); }
          100% { transform: scale(1.04) translate(0, 0); filter: brightness(1.15) contrast(1.25); }
        }
        @keyframes stageSpotlight {
          0% { transform: rotate(-28deg) translateY(-15%) translateX(-20%); opacity: 0.25; }
          50% { transform: rotate(18deg) translateY(12%) translateX(25%); opacity: 0.55; }
          100% { transform: rotate(-28deg) translateY(-15%) translateX(-20%); opacity: 0.25; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-subtle-glow {
          animation: subtleGlow 7s ease-in-out infinite;
        }
        .animate-pop-in {
          animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-kenburns-slow {
          animation: kenburnsSlow 8s ease-in-out infinite alternate;
        }
        .animate-stage-spotlight {
          animation: stageSpotlight 5s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Background Lights */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Live Concert Stage"
          className="w-full h-full object-cover opacity-70 animate-kenburns-slow transform-gpu origin-center"
        />
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-[#FF5A36]/30 to-transparent blur-3xl animate-stage-spotlight pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/75 via-[#05070A]/55 to-[#05070A]/90" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">

        {/* Step Progress Bar Header */}
        <div className="space-y-4">
          <div className="max-w-2xl mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#FF5A36] to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-sm shadow-[#FF5A36]/50"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-2xl mx-auto px-4">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => {
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              return (
                <React.Fragment key={stepNum}>
                  <button
                    onClick={() => {
                      if (stepNum < currentStep) setCurrentStep(stepNum);
                    }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm font-display transition-all duration-300 active:scale-95 ${
                      isCompleted
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 cursor-pointer hover:scale-110'
                        : isCurrent
                          ? 'bg-[#FF5A36] text-white shadow-xl shadow-[#FF5A36]/50 scale-110 border-2 border-white/30 ring-4 ring-[#FF5A36]/20'
                          : 'bg-[#0A0D12] text-[#A3A8B3] border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-black stroke-[3]" /> : stepNum}
                  </button>

                  {stepNum < 6 && (
                    <div
                      className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${
                        stepNum < currentStep ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-white/10'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Sub-header Navigation Row */}
          <div className="flex items-center justify-between text-xs text-[#A3A8B3] font-mono max-w-2xl mx-auto px-2">
            {currentStep > 1 && currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <span className="font-bold uppercase text-[#FF5A36] tracking-wider transition-all duration-300">
              {currentStep === 1 && 'BƯỚC 1 / 6: NHẬP MÃ VÉ GỐC'}
              {currentStep === 2 && 'BƯỚC 2 / 6: XÁC THỰC MÃ OTP'}
              {currentStep === 3 && 'BƯỚC 3 / 6: THÔNG TIN VÉ ĐÃ KHÓA'}
              {currentStep === 4 && 'BƯỚC 4 / 6: ĐẶT GIÁ RAO BÁN'}
              {currentStep === 5 && 'BƯỚC 5 / 6: XÁC NHẬN NIÊM YẾT'}
              {currentStep === 6 && 'BƯỚC 6 / 6: HOÀN TẤT NIÊM YẾT'}
            </span>
          </div>
        </div>

        {/* STEP 1: NHẬP MÃ VÉ */}
        {currentStep === 1 && (
          <div key={1} className="animate-fade-in-up max-w-xl mx-auto space-y-8 text-center pt-4">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
                Nhập Mã Vé Gốc Cần Bán
              </h1>
              <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-md mx-auto leading-relaxed">
                Mã xác thực vé từ hệ thống Nhà Tổ Chức (BTC) để khởi tạo quy trình Escrow Lock.
              </p>
            </div>

            <form onSubmit={handleNextStep1} className="space-y-6 text-left bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                    Mã Vé Gốc (Ticket Identifier Code)
                  </label>
                  <span className="text-[10px] text-[#A3A8B3] font-mono">Tự động viết hoa</span>
                </div>
                <div className="relative group">
                  <Ticket className="w-5 h-5 text-[#FF5A36] absolute left-4 top-3.5 group-focus-within:scale-110 group-focus-within:text-[#FF7252] transition-all duration-200" />
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: ATSH-VIP-888"
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-12 pr-4 py-3.5 text-base font-mono tracking-wider text-white placeholder-[#A3A8B3]/40 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
                    required
                  />
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-[#8F96A3] tracking-[0.08em] font-display">
                      VÉ CÓ SẴN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        category: 'VIP',
                        code: 'ATSH-VIP-888',
                        price: '2.500.000đ',
                      },
                      {
                        category: 'GENERAL',
                        code: 'ATSH-GA-999',
                        price: '1.200.000đ',
                      },
                    ].map((ticket) => {
                      const isSelected = ticketCode === ticket.code;
                      return (
                        <button
                          key={ticket.code}
                          type="button"
                          onClick={() => setTicketCode(ticket.code)}
                          className={`group relative overflow-hidden rounded-xl p-3.5 text-left transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0A0D12] border border-[#FF5A36] shadow-[0_0_20px_rgba(255,90,54,0.12)] -translate-y-0.5'
                              : 'bg-[#0A0D12] border border-white/[0.08] hover:border-white/20 hover:bg-[#11161F] hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Left digital ticket indicator line */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200 ${
                              isSelected ? 'bg-[#FF5A36]' : 'bg-white/10 group-hover:bg-[#FF5A36]/60'
                            }`}
                          />

                          {/* Subtle perforation notch */}
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#05070A] border-l border-white/[0.08] pointer-events-none" />

                          <div className="pl-1.5 pr-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'text-[#FF5A36] bg-[#FF5A36]/10'
                                    : 'text-[#8F96A3] bg-white/5 group-hover:text-[#F5F5F2]'
                                }`}
                              >
                                {ticket.category}
                              </span>
                              <span className="text-[11px] font-semibold text-[#8F96A3] font-mono group-hover:text-[#F5F5F2]">
                                {ticket.price}
                              </span>
                            </div>

                            <div className="font-mono text-sm font-bold tracking-wider text-[#F5F5F2] flex items-center justify-between">
                              <span>{ticket.code}</span>
                              {isSelected && (
                                <span className="text-[10px] font-sans font-semibold text-[#FF5A36] tracking-normal">
                                  Đã chọn
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp}
                className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo phiên xác thực...</span>
                  </>
                ) : (
                  <span>Tiếp tục: Yêu cầu OTP →</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: XÁC THỰC OTP SỐ ĐIỆN THOẠI / EMAIL */}
        {currentStep === 2 && (
          <div key={2} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-4">
            <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl hover:border-white/20 transition-all duration-300">

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  Xác Thực Mã OTP Chủ Vé
                </h2>
                <p className="text-xs text-[#A3A8B3] leading-relaxed">
                  Nhập mã OTP vừa được Ban Tổ Chức (BTC) gửi về email/số điện thoại chủ vé để thực hiện Khóa vé (Lock).
                </p>
                {verificationId && (
                  <p className="text-[10px] text-cyan-400 font-mono">
                    Session Verification ID: {verificationId}
                  </p>
                )}
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                      Mã OTP Xác Thực (6 chữ số)
                    </label>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResendingOtp}
                      className="text-xs text-[#FF5A36] hover:underline transition-all font-mono flex items-center gap-1"
                    >
                      {isResendingOtp ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-full h-12 bg-[#05070A] border border-white/15 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 focus:scale-105 transition-all duration-200"
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#A3A8B3] mt-2 font-mono">
                    Mã xác thực có hiệu lực trong 5 phút.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác nhận OTP & Khóa vé gRPC...</span>
                    </>
                  ) : (
                    <span>Xác Nhận OTP & Khóa Vé →</span>
                  )}
                </button>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#A3A8B3] flex items-center gap-2 hover:border-emerald-500/30 transition-all duration-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Xác thực gRPC Durable Lock đảm bảo vé chưa đổi chủ / chưa sử dụng.</span>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* STEP 3: THÔNG TIN VÉ ĐÃ XÁC THỰC */}
        {currentStep === 3 && (
          <div key={3} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 pt-2">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Vé Đã Được Xác Thực & Khóa An Toàn
              </h2>
              <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
                Vé của bạn đã được kiểm duyệt chính chủ và sẵn sàng thiết lập giá rao bán.
              </p>
            </div>

            {/* Ticket Card Preview */}
            <div className="group bg-[#0A0D12]/90 backdrop-blur-md border border-[#FF5A36]/30 hover:border-[#FF5A36]/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[#FF5A36]/10 relative">
              <div className="relative h-44 overflow-hidden">
                <img
                  src="/images/landing/featured-1.jpg"
                  alt="Concert Ticket"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/40 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-emerald-400 rounded-full font-mono shadow-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED & LOCKED
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <span className="text-[11px] text-[#FF5A36] font-mono font-bold uppercase tracking-wider">OFFICIAL DIGITAL TICKET PASS</span>
                  <h3 className="text-2xl font-extrabold font-display text-white group-hover:text-[#FF7252] transition-colors duration-200">
                    Anh Trai Say Hi Concert 2026
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-[#05070A] border border-white/10 rounded-2xl space-y-1 hover:border-white/20 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[#A3A8B3]">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>Mã Vé Gốc</span>
                    </div>
                    <p className="font-bold text-white font-mono">{ticketCode}</p>
                  </div>

                  <div className="p-3.5 bg-[#05070A] border border-white/10 rounded-2xl space-y-1 hover:border-white/20 transition-all duration-200">
                    <div className="flex items-center gap-1.5 text-[#A3A8B3]">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Địa Điểm</span>
                    </div>
                    <p className="font-bold text-white">Sân Vận Động Mỹ Đình</p>
                  </div>
                </div>

                {/* Price Ceiling Info */}
                <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#A3A8B3]">Giá Vé Gốc (Face Value)</span>
                    <p className="text-xl font-bold font-display text-white">{faceValue.toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 font-mono">🛡️ Quy định Trần Giá</span>
                    <p className="text-xs text-[#A3A8B3]">Giá bán lại tối đa: <span className="text-white font-bold">{faceValue.toLocaleString('vi-VN')} VNĐ</span></p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(4)}
              className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>Tiếp Tục: Thiết Lập Giá Bán →</span>
            </button>
          </div>
        )}

        {/* STEP 4: ĐẶT GIÁ BÁN LẠI */}
        {currentStep === 4 && (
          <div key={4} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-2">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Thiết Lập Giá Rao Bán
              </h2>
              <p className="text-xs text-[#A3A8B3]">
                Giá bán lại không được vượt quá giá gốc ({faceValue.toLocaleString('vi-VN')} VNĐ) để chống đầu cơ.
              </p>
            </div>

            {/* Price Selector Main Box */}
            <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-center hover:border-white/20 transition-all duration-300">
              <span className="text-xs text-[#A3A8B3] uppercase tracking-wider font-display font-semibold">
                GIÁ RAO BÁN ĐỀ XUẤT
              </span>

              <div className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight flex items-center justify-center gap-2 transition-all duration-300">
                <span className="transition-all duration-300">{resalePrice.toLocaleString('vi-VN')}</span>
                <span className="text-base font-normal text-[#FF5A36]">VNĐ</span>
              </div>

              {/* Quick Discount Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] text-[#A3A8B3]">Tùy chọn giá nhanh:</span>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  <button
                    onClick={() => handleApplyDiscount(5)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      resalePrice === Math.round(faceValue * 0.95)
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                    }`}
                  >
                    -5%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(10)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      resalePrice === Math.round(faceValue * 0.9)
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                    }`}
                  >
                    -10%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(15)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      resalePrice === Math.round(faceValue * 0.85)
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                    }`}
                  >
                    -15%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(0)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      resalePrice === faceValue
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                    }`}
                  >
                    Bằng Giá Gốc
                  </button>
                </div>
              </div>

              {/* Net Payout Box */}
              <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between text-xs hover:border-emerald-500/30 transition-all duration-300">
                <span className="text-[#A3A8B3]">Thực nhận của Reseller:</span>
                <span className="text-xl font-bold font-display text-emerald-400 transition-all duration-300">
                  {resalePrice.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <button
                onClick={() => setCurrentStep(5)}
                className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Tiếp Tục: Kiểm Tra Niêm Yết →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: XÁC NHẬN NIÊM YẾT */}
        {currentStep === 5 && (
          <div key={5} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-2">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Xác Nhận Niêm Yết Vé
              </h2>
              <p className="text-xs text-[#A3A8B3]">
                Kiểm tra lại thông tin trước khi vé được niêm yết công khai lên Marketplace.
              </p>
            </div>

            {/* Final Preview Card */}
            <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 hover:border-white/20 transition-all duration-300">
              <div className="space-y-2">
                <span className="text-[10px] text-[#FF5A36] font-mono uppercase font-bold">VERIFIED DIGITAL TICKET PASS</span>
                <h3 className="text-xl font-bold font-display text-white">Anh Trai Say Hi Concert 2026</h3>
                <p className="text-xs text-[#A3A8B3] flex items-center gap-1.5 font-mono">
                  <Ticket className="w-3.5 h-3.5 text-cyan-400" /> Mã vé: {ticketCode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-[#05070A] border border-white/10 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-[#A3A8B3]">GIÁ GỐC</span>
                  <p className="font-bold text-white font-display text-sm">{faceValue.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#A3A8B3]">GIÁ RAO BÁN</span>
                  <p className="font-bold text-[#FF5A36] font-display text-sm">{resalePrice.toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>

              {/* Private Listing Checkbox */}
              <label className="flex items-center gap-3 text-xs text-[#F5F5F2] cursor-pointer p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={isPrivateListing}
                  onChange={(e) => setIsPrivateListing(e.target.checked)}
                  className="rounded border-white/20 bg-[#05070A] text-[#FF5A36] focus:ring-0 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-white block">Chế độ Vé Riêng Tư (Private Share Link)</span>
                  <span className="text-[11px] text-[#A3A8B3]">Vé sẽ không xuất hiện ở chợ công khai, chỉ ai có link Token 32 ký tự mới xem được.</span>
                </div>
              </label>

              {/* Terms Checkbox */}
              <label className="flex items-center gap-3 text-xs text-[#F5F5F2] cursor-pointer pt-2 group">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-white/20 bg-[#05070A] text-[#FF5A36] focus:ring-0 w-4 h-4"
                />
                <span className="group-hover:text-white transition-colors duration-200">Tôi cam kết là chủ sở hữu vé chính chủ và đồng ý niêm yết lên sàn TicketShield</span>
              </label>

              <button
                onClick={handlePublishListing}
                disabled={isPublishing}
                className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang niêm yết vé lên sàn...</span>
                  </>
                ) : (
                  <span>Niêm Yết Vé Ngay →</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: HOÀN TẤT NIÊM YẾT */}
        {currentStep === 6 && (
          <div key={6} className="animate-fade-in-up max-w-xl mx-auto text-center space-y-6 pt-8">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-pop-in">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Niêm Yết Vé Thành Công!
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-md mx-auto leading-relaxed">
                Vé của bạn đã được niêm yết chính thức lên TicketShield Marketplace với 100% Escrow Protection.
              </p>
            </div>

            <div className="p-6 bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 rounded-3xl space-y-3 text-left max-w-md mx-auto text-xs hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[#A3A8B3]">Trạng thái:</span>
                <span className="text-emerald-400 font-bold font-mono">PUBLICLY LISTED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A3A8B3]">Mã Listing ID:</span>
                <span className="text-white font-mono font-bold truncate max-w-[200px]">{publishedListingId || 'TS-RESALE-88201'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A3A8B3]">Giá rao bán:</span>
                <span className="text-white font-bold">{resalePrice.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/my-listings')}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Quản Lý Danh Sách Bán Vé
              </button>

              <button
                onClick={() => navigate('/marketplace')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                Xem Trên Sàn Marketplace
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellTicketPage;
