import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { resaleApi, VerificationResult, SellerListingDto } from '@ticketshield/api-client';
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
  Loader2,
  X
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
  const [ticketCode, setTicketCode] = useState('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState<boolean>(false);

  // Danh sách vé gốc của chủ sở hữu từ đối tác BTC
  const userTickets = [
    {
      category: 'VIP',
      code: 'ATSH-VIP-888',
      price: '2.500.000đ',
      rawPrice: 2500000,
      status: 'VALID',
    },
    {
      category: 'GENERAL',
      code: 'ATSH-GA-999',
      price: '1.200.000đ',
      rawPrice: 1200000,
      status: 'VALID',
    },
    {
      category: 'STANDARD',
      code: 'ATSH-USED-001',
      price: '800.000đ',
      rawPrice: 800000,
      status: 'USED', // Đã qua sử dụng tại cổng sự kiện -> Không đủ điều kiện bán
    },
  ];

  const [existingListings, setExistingListings] = useState<SellerListingDto[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);

  // Tải danh sách vé đã đăng bán để loại trừ các vé đã niêm yết
  const fetchExistingListings = useCallback(async () => {
    try {
      setIsLoadingListings(true);
      const data = await resaleApi.getMyListings();
      setExistingListings(data || []);
    } catch (err) {
      console.warn('Could not load existing listings', err);
    } finally {
      setIsLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    fetchExistingListings();
  }, [fetchExistingListings]);

  // CHỈ LỌC CÁC VÉ ĐỦ ĐIỀU KIỆN ĐĂNG BÁN:
  // 1. Phải có trạng thái hợp lệ ('VALID' từ BTC, loại trừ vé 'USED', 'EXPIRED', 'LOCKED')
  // 2. Chưa từng đăng bán trên sàn (không nằm trong existingListings với trạng thái đang bán)
  const eligibleTickets = userTickets.filter((t) => {
    // Loại bỏ vé không hợp lệ (đã dùng / hết hạn / bị khóa)
    if (t.status !== 'VALID') return false;

    // Loại bỏ vé đã được niêm yết rao bán (chưa bị hủy)
    const isAlreadyListed = existingListings.some(
      (listing) =>
        listing.originalTicketCode === t.code &&
        String(listing.listingStatus).toLowerCase() !== 'cancelled'
    );
    if (isAlreadyListed) return false;

    return true;
  });


  // Step 2 OTP Form state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(300);

  // Countdown timer for OTP (5 minutes)
  useEffect(() => {
    if (currentStep !== 2) return;

    setOtpTimeLeft(300);
    const interval = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  const formatOtpTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Step 4 Pricing state
  const [faceValue, setFaceValue] = useState<number>(2500000);
  const [resalePrice, setResalePrice] = useState<number>(2500000);
  const [priceInputText, setPriceInputText] = useState<string>('2.500.000');

  const updatePrice = (val: number) => {
    const clamped = Math.max(0, Math.min(val, faceValue));
    setResalePrice(clamped);
    setPriceInputText(clamped > 0 ? clamped.toLocaleString('vi-VN') : '');
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const oldVal = input.value;
    const oldPos = input.selectionStart || 0;

    // Đếm số chữ số nằm trước con trỏ trước khi format
    const digitsBeforeCursor = oldVal.slice(0, oldPos).replace(/\D/g, '').length;

    const raw = oldVal.replace(/\D/g, '');
    if (raw === '') {
      setPriceInputText('');
      setResalePrice(0);
      return;
    }

    // Giới hạn độ dài tránh tràn số
    if (raw.length > 11) return;

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const formatted = parsed.toLocaleString('vi-VN');
      setResalePrice(parsed);
      setPriceInputText(formatted);

      // Khôi phục vị trí con trỏ chính xác theo số lượng chữ số đã gõ
      requestAnimationFrame(() => {
        let newPos = 0;
        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            count++;
          }
          if (count >= digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
        if (newPos === 0 && formatted.length > 0) newPos = formatted.length;
        input.setSelectionRange(newPos, newPos);
      });
    }
  };

  const handlePriceInputBlur = () => {
    if (!priceInputText || resalePrice === 0) {
      updatePrice(faceValue);
    } else if (resalePrice > faceValue) {
      updatePrice(faceValue);
    }
  };

  const handleStepPrice = (delta: number) => {
    const current = resalePrice || 0;
    updatePrice(current + delta);
  };

  const handleApplyDiscount = (percent: number) => {
    if (percent === 0) {
      updatePrice(faceValue);
    } else {
      updatePrice(Math.round(faceValue * (1 - percent / 100)));
    }
  };

  // Step 5 Confirmation state
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isPrivateListing, setIsPrivateListing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string>('');

  // Step 1: Request OTP for Ticket Verification
  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = ticketCode.trim().toUpperCase();
    if (!normalizedCode) {
      showToast('Vui lòng nhập mã định danh vé!', 'warning');
      return;
    }

    // 1. Kiểm tra nếu vé này đang được đăng bán trên sàn
    const isAlreadyListed = existingListings.some(
      (l) => l.originalTicketCode === normalizedCode &&
        String(l.listingStatus).toLowerCase() !== 'cancelled'
    );
    if (isAlreadyListed) {
      showToast('Vé này hiện đang được đăng bán trên hệ thống! Vui lòng vào mục "My Listings" để quản lý.', 'warning');
      return;
    }

    // 2. Kiểm tra nếu vé thuộc trường hợp không hợp lệ (vé đã sử dụng, hết hạn, bị khóa)
    const knownIneligible = userTickets.find((t) => t.code === normalizedCode && t.status !== 'VALID');
    if (knownIneligible) {
      showToast('Mã vé này không đủ điều kiện đăng bán (vé đã qua sử dụng hoặc không hợp lệ).', 'error');
      return;
    }

    try {
      setIsRequestingOtp(true);
      showToast('Đang tra cứu và gửi mã OTP xác thực từ Ban Tổ Chức...', 'info');
      const result = await resaleApi.requestVerificationOtp(normalizedCode);
      setVerificationId(result.verificationId);
      setVerificationResult(result);
      if (result.originalPrice && result.originalPrice > 0) {
        setFaceValue(result.originalPrice);
        setResalePrice(result.originalPrice);
        setPriceInputText(result.originalPrice.toLocaleString('vi-VN'));
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
      setOtpTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
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
        setPriceInputText(result.originalPrice.toLocaleString('vi-VN'));
      }
      showToast('Xác thực OTP & Khóa vé gốc thành công!', 'success');
      setCurrentStep(3);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || '';
      if (serverMsg.includes('TICKET_LOCKED')) {
        showToast('Vé này hiện đang bị khóa hoặc đã được đăng bán trên hệ thống!', 'error');
      } else if (serverMsg.includes('OTP_INVALID')) {
        showToast('Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!', 'error');
      } else if (serverMsg.includes('OTP_EXPIRED') || serverMsg.includes('VERIFICATION_CLOSED')) {
        showToast('Phiên xác thực đã hết hạn. Vui lòng bấm Gửi lại mã OTP!', 'error');
      } else {
        showToast(serverMsg || 'Mã xác thực OTP không chính xác hoặc phiên đã hết hạn. Vui lòng thử lại!', 'error');
      }
    } finally {
      setIsVerifyingOtp(false);
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
      fetchExistingListings();
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

  const handleClearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    document.getElementById('otp-input-0')?.focus();
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6 - index).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      document.getElementById(`otp-input-${nextIdx}`)?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned[0];
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, delete previous input and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      } else if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const focusIdx = Math.min(digits.length, 5);
    const targetInput = document.getElementById(`otp-input-${focusIdx}`);
    targetInput?.focus();
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
          100% { transform: scale(1.1) translate(-1%, -1%); filter: brightness(1.05) contrast(1.3); }
        }
        @keyframes stageSpotlight {
          0% { transform: rotate(-28deg) translateY(-15%) translateX(-20%); opacity: 0.25; }
          50% { transform: rotate(18deg) translateY(12%) translateX(25%); opacity: 0.55; }
          100% { transform: rotate(-28deg) translateY(-15%) translateX(-20%); opacity: 0.25; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-subtle-glow {
          animation: subtleGlow 7s ease-in-out infinite;
        }
        .animate-pop-in {
          animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-glow {
          animation: subtleGlow 4s ease-in-out infinite;
        }
        .animate-kenburns-slow {
          animation: kenburnsSlow 20s ease-in-out infinite alternate;
        }
        .animate-stage-spotlight {
          animation: stageSpotlight 5s ease-in-out infinite alternate;
        }
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ticketShimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          50%, 100% { transform: translateX(250%) skewX(-20deg); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .animate-scanline {
          animation: scanline 2.2s ease-in-out infinite;
        }
        .animate-ticket-shimmer {
          animation: ticketShimmer 5s ease-in-out infinite;
        }
        .animate-pulse-dot {
          animation: pulseDot 2s ease-in-out infinite;
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

      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

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
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm font-display transition-all duration-300 active:scale-95 ${isCompleted
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
                      className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${stepNum < currentStep ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-white/10'
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
                  <span className="text-[10px] text-[#A3A8B3] font-mono">Tự do gõ mã hoặc chọn bên dưới</span>
                </div>
                <div className="relative group">
                  <Ticket className="w-5 h-5 text-[#FF5A36] absolute left-4 top-3.5 group-focus-within:scale-110 group-focus-within:text-[#FF7252] transition-all duration-200 pointer-events-none" />
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: ATSH-VIP-888"
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-12 pr-11 py-3.5 text-base font-mono tracking-wider text-white placeholder-[#A3A8B3]/40 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 transition-all duration-200"
                    required
                  />
                  {ticketCode && (
                    <button
                      type="button"
                      onClick={() => setTicketCode('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8F96A3] hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
                      title="Xóa mã để nhập lại"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-[#8F96A3] tracking-[0.08em] font-display">
                      VÉ ĐỦ ĐIỀU KIỆN ĐĂNG BÁN
                    </span>
                    {!isLoadingListings && (
                      <span className="text-[10px] text-[#A3A8B3] font-mono">
                        {eligibleTickets.length} vé khả dụng
                      </span>
                    )}
                  </div>

                  {isLoadingListings ? (
                    <div className="py-5 text-center space-y-2 bg-[#05070A] border border-white/10 rounded-xl">
                      <Loader2 className="w-5 h-5 text-[#FF5A36] animate-spin mx-auto" />
                      <p className="text-[11px] text-[#A3A8B3] font-mono">Đang kiểm tra tình trạng vé khả dụng...</p>
                    </div>
                  ) : eligibleTickets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {eligibleTickets.map((ticket) => {
                        const isSelected = ticketCode === ticket.code;
                        return (
                          <button
                            key={ticket.code}
                            type="button"
                            onClick={() => setTicketCode(ticketCode === ticket.code ? '' : ticket.code)}
                            className={`group relative overflow-hidden rounded-xl p-3.5 text-left transition-all duration-200 cursor-pointer ${isSelected
                              ? 'bg-[#0A0D12] border border-[#FF5A36] shadow-[0_0_20px_rgba(255,90,54,0.12)] -translate-y-0.5'
                              : 'bg-[#0A0D12] border border-white/[0.08] hover:border-white/20 hover:bg-[#11161F] hover:-translate-y-0.5'
                              }`}
                          >
                            {/* Left digital ticket indicator line */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200 ${isSelected ? 'bg-[#FF5A36]' : 'bg-white/10 group-hover:bg-[#FF5A36]/60'
                                }`}
                            />

                            {/* Subtle perforation notch */}
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#05070A] border-l border-white/[0.08] pointer-events-none" />

                            <div className="pl-1.5 pr-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${isSelected
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
                  ) : (
                    <div className="p-4 bg-[#05070A] border border-white/10 rounded-xl text-center space-y-1.5">
                      <p className="text-xs text-[#A3A8B3]">
                        Hiện không có vé nào đủ điều kiện đăng bán (tất cả các vé đã được niêm yết trên thị trường hoặc không khả dụng).
                      </p>
                      <Link
                        to="/my-listings"
                        className="text-xs text-[#FF5A36] hover:underline font-mono inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Quản lý danh sách vé đang bán tại My Listings</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequestingOtp || !ticketCode.trim()}
                className={`w-full py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${!ticketCode.trim() || isRequestingOtp
                  ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                  : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                  }`}
              >
                {isRequestingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo phiên xác thực...</span>
                  </>
                ) : (
                  <span>Tiếp tục: Yêu cầu OTP</span>
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
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                      Mã OTP Xác Thực (6 chữ số)
                    </label>
                    <div className="flex items-center gap-3">
                      {otp.some((d) => d !== '') && (
                        <button
                          type="button"
                          onClick={handleClearOtp}
                          className="text-xs text-[#A3A8B3] hover:text-white hover:underline transition-colors font-mono"
                        >
                          Xóa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResendingOtp}
                        className="text-xs text-[#FF5A36] hover:underline transition-all font-mono flex items-center gap-1"
                      >
                        {isResendingOtp ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="w-full h-12 bg-[#05070A] border border-white/15 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 focus:scale-105 transition-all duration-200"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm font-mono mt-3">
                    <span className="text-[#A3A8B3]">
                      Mã xác thực có hiệu lực trong:
                    </span>
                    <span className={`text-sm sm:text-base font-bold font-mono tracking-wider ${otpTimeLeft <= 60 ? 'text-rose-400 animate-pulse' : 'text-[#FF5A36]'}`}>
                      {formatOtpTimer(otpTimeLeft)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpTimeLeft === 0}
                  className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác nhận OTP & Khóa vé...</span>
                    </>
                  ) : (
                    <span>Xác Nhận OTP & Khóa Vé</span>
                  )}
                </button>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#A3A8B3] flex items-center gap-2 hover:border-emerald-500/30 transition-all duration-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Xác thực hệ thống đảm bảo vé chưa đổi chủ / chưa sử dụng.</span>
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
            <div className="group relative bg-[#0A0D12]/90 backdrop-blur-md border border-white/[0.08] hover:border-white/[0.16] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
              {/* Holographic Shimmer Light Sweep */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
                <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-ticket-shimmer" />
              </div>

              {/* Concert image banner */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src="/images/landing/featured-1.jpg"
                  alt="Concert Ticket"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/50 to-transparent" />
              </div>

              {/* Ticket body */}
              <div className="p-6 space-y-5">

                {/* Header row: label + verified status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      OFFICIAL DIGITAL TICKET PASS
                    </span>
                    <h3 className="text-2xl font-extrabold font-display text-white group-hover:text-[#FF7252] transition-colors duration-300 leading-tight">
                      Anh Trai Say Hi Concert 2026
                    </h3>
                  </div>

                  {/* Verified status with pulsing radar ping effect */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A36] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A36] shadow-[0_0_8px_#FF5A36]" />
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] text-[#FF5A36] whitespace-nowrap">
                      VERIFIED · LOCKED
                    </span>
                  </div>
                </div>

                {/* Info row: ticket code + location */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.07] bg-[#05070A] border border-white/[0.07] group-hover:border-white/[0.15] rounded-2xl overflow-hidden transition-colors duration-300">
                  <div className="p-3.5 space-y-1 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      MÃ VÉ GỐC
                    </span>
                    <p className="font-bold text-white font-mono text-sm tracking-wide group-hover:text-[#FF5A36] transition-colors duration-200">
                      {ticketCode}
                    </p>
                  </div>
                  <div className="p-3.5 pl-4 space-y-1 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      ĐỊA ĐIỂM
                    </span>
                    <p className="font-bold text-white text-sm">Sân Vận Động Mỹ Đình</p>
                  </div>
                </div>

                {/* Price cap row */}
                <div className="grid grid-cols-2 divide-x divide-white/[0.07] bg-[#05070A] border border-white/[0.07] group-hover:border-white/[0.15] rounded-2xl overflow-hidden transition-colors duration-300">
                  <div className="p-4 space-y-1.5 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      GIÁ VÉ GỐC
                    </span>
                    <p className="text-lg font-bold font-display text-white">
                      {faceValue.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <div className="p-4 pl-5 space-y-1.5 hover:bg-white/[0.02] transition-colors duration-200">
                    <span className="text-[10px] text-[#8F96A3] font-mono font-bold uppercase tracking-[0.08em] block">
                      GIÁ BÁN LẠI TỐI ĐA
                    </span>
                    <p className="text-lg font-bold font-display text-white">
                      {faceValue.toLocaleString('vi-VN')} VNĐ
                    </p>
                    <span className="text-[10px] text-[#8F96A3] font-mono block leading-tight">
                      Theo quy định TicketShield
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Glowing CTA Button with Shimmer Sheen */}
            <button
              onClick={() => setCurrentStep(4)}
              className="group relative w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-2xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
              <span>Tiếp Tục: Thiết Lập Giá Bán</span>
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
                Giá bán lại không được vượt quá giá vé gốc ({faceValue.toLocaleString('vi-VN')} VNĐ) theo quy định chống đầu cơ.
              </p>
            </div>

            {/* Price Selector Main Box */}
            <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-center hover:border-white/20 transition-all duration-300">
              <span className="text-xs text-[#A3A8B3] uppercase tracking-wider font-display font-semibold">
                GIÁ RAO BÁN ĐỀ XUẤT
              </span>

              <div className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight flex items-center justify-center gap-2 transition-all duration-300">
                <span className="transition-all duration-300">
                  {resalePrice > 0 ? resalePrice.toLocaleString('vi-VN') : '0'}
                </span>
                <span className="text-base font-normal text-[#FF5A36]">VNĐ</span>
              </div>

              {/* Manual Price Input – Compact row with stepper */}
              <div className="space-y-1.5">
                {/* Label + Input row */}
                <div className="flex items-center gap-3">
                  {/* Label */}
                  <div className="flex flex-col text-left shrink-0">
                    <span className="text-[10px] text-[#A3A8B3] font-mono uppercase tracking-wider whitespace-nowrap font-semibold">
                      Nhập giá (VNĐ)
                    </span>
                    <span className="text-[9px] text-[#8F96A3] font-mono whitespace-nowrap">
                      (Không vượt quá giá vé gốc)
                    </span>
                  </div>

                  {/* Stepper row: [ input ] [ − ] [ + ] */}
                  <div className="flex items-center flex-1 gap-2">
                    {/* Input */}
                    <div className="relative flex-1 group/input">
                      <input
                        id="resale-price-input"
                        type="text"
                        inputMode="numeric"
                        value={priceInputText}
                        onChange={handlePriceInputChange}
                        onFocus={(e) => e.target.select()}
                        onBlur={handlePriceInputBlur}
                        className={`w-full bg-[#05070A] border rounded-xl pl-3 pr-14 py-2.5 text-sm font-mono font-bold text-white tracking-wider text-right focus:outline-none transition-all duration-200 ${resalePrice > faceValue
                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                            : 'border-white/15 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 group-hover/input:border-white/25'
                          }`}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#FF5A36] font-bold pointer-events-none">
                        VNĐ
                      </span>
                    </div>

                    {/* Decrease button */}
                    <button
                      type="button"
                      onClick={() => handleStepPrice(-10000)}
                      className="w-10 h-10 shrink-0 rounded-xl bg-[#05070A] border border-white/10 text-white hover:border-[#FF5A36] hover:text-[#FF5A36] hover:bg-[#FF5A36]/10 transition-all duration-150 flex items-center justify-center font-bold text-lg leading-none active:scale-95 cursor-pointer"
                      title="Giảm 10.000 VNĐ"
                    >
                      −
                    </button>

                    {/* Increase button */}
                    <button
                      type="button"
                      onClick={() => handleStepPrice(10000)}
                      className="w-10 h-10 shrink-0 rounded-xl bg-[#05070A] border border-white/10 text-white hover:border-[#FF5A36] hover:text-[#FF5A36] hover:bg-[#FF5A36]/10 transition-all duration-150 flex items-center justify-center font-bold text-lg leading-none active:scale-95 cursor-pointer"
                      title="Tăng 10.000 VNĐ"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Validation hint - FIXED HEIGHT to eliminate vertical jumping */}
                <div className="min-h-[20px] flex items-center justify-end text-[10px] font-mono">
                  {resalePrice > faceValue && (
                    <span className="text-rose-400 font-semibold">
                      ⚠ Không vượt quá giá vé gốc ({faceValue.toLocaleString('vi-VN')} VNĐ)
                    </span>
                  )}
                  {resalePrice < faceValue && resalePrice > 0 && (
                    <span className="text-emerald-400">
                      ✓ Giảm {(faceValue - resalePrice).toLocaleString('vi-VN')} VNĐ ({Math.round((1 - resalePrice / faceValue) * 100)}%) so với giá vé gốc
                    </span>
                  )}
                  {resalePrice === faceValue && (
                    <span className="text-[#A3A8B3]">
                      Bằng 100% giá vé gốc ({faceValue.toLocaleString('vi-VN')} VNĐ)
                    </span>
                  )}
                </div>
              </div>


              {/* Quick Discount Buttons */}

              <div className="space-y-2">
                <span className="text-[11px] text-[#A3A8B3]">Tùy chọn giá nhanh:</span>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  <button
                    onClick={() => handleApplyDiscount(5)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === Math.round(faceValue * 0.95)
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    -5%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(10)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === Math.round(faceValue * 0.9)
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    -10%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(15)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === Math.round(faceValue * 0.85)
                      ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                      : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                      }`}
                  >
                    -15%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(0)}
                    className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${resalePrice === faceValue
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
                <span>Tiếp Tục: Kiểm Tra Niêm Yết</span>
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
                  <span>Niêm Yết Vé Ngay</span>
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
