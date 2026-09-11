import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Calendar, 
  MapPin, 
  Ticket, 
  QrCode, 
  Edit3, 
  Check, 
  Info,
  AlertCircle
} from 'lucide-react';

export const SellTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 Form state
  const [ticketCode, setTicketCode] = useState('TBX-90412-VN8');

  // Step 2 Form state
  const [phone, setPhone] = useState('0988234567');
  const [otp, setOtp] = useState(['7', '2', '8', '5', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Step 4 Pricing state
  const faceValue = 1500000;
  const [resalePrice, setResalePrice] = useState(1350000);

  // Step 5 Confirmation state
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) {
      showToast('Please enter your ticket identifier code!', 'warning');
      return;
    }
    showToast('Looking up ticket code on system...', 'info');
    setTimeout(() => {
      setCurrentStep(2);
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      showToast('OTP verified successfully!', 'success');
      setCurrentStep(3);
    }, 600);
  };

  const handleApplyDiscount = (percent: number) => {
    if (percent === 0) {
      setResalePrice(faceValue);
    } else {
      setResalePrice(Math.round(faceValue * (1 - percent / 100)));
    }
  };

  const handlePublishListing = () => {
    if (!agreedTerms) {
      showToast('Please agree to original ticket owner listing terms!', 'warning');
      return;
    }
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      showToast('Ticket listed on marketplace successfully!', 'success');
      setCurrentStep(6);
    }, 800);
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
      {/* Full-Screen Concert Background Image with High Contrast & Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Concert Atmosphere"
          className="w-full h-full object-cover opacity-65 filter brightness-110 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/70 via-[#05070A]/50 to-[#05070A]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/30 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#FF5A36]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        {/* Step Progress Bar (6 Steps Header) */}
        <div className="space-y-4">
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
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm font-display transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 cursor-pointer'
                        : isCurrent
                        ? 'bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/40 scale-110 border-2 border-white/20'
                        : 'bg-[#0A0D12] text-[#A3A8B3] border border-white/10'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-black stroke-[3]" /> : stepNum}
                  </button>

                  {stepNum < 6 && (
                    <div
                      className={`flex-1 h-[2px] rounded-full transition-all ${
                        stepNum < currentStep ? 'bg-emerald-500' : 'bg-white/10'
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
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <span className="font-bold uppercase text-[#FF5A36] tracking-wider">
              {currentStep === 1 && 'STEP 1 / 6: ENTER TICKET CODE'}
              {currentStep === 2 && 'STEP 2 / 6: OTP VERIFICATION'}
              {currentStep === 3 && 'STEP 3 / 6: TICKET DETAILS'}
              {currentStep === 4 && 'STEP 4 / 6: SET RESALE PRICE'}
              {currentStep === 5 && 'STEP 5 / 6: CONFIRMATION'}
              {currentStep === 6 && 'STEP 6 / 6: COMPLETED'}
            </span>
          </div>
        </div>

        {/* STEP 1: NHẬP MÃ VÉ */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto space-y-8 text-center pt-4">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
                Enter Your Ticket Identifier
              </h1>
              <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-md mx-auto leading-relaxed">
                Booking code or ticket ID sent in your original purchase confirmation email.
              </p>
            </div>

            <form onSubmit={handleNextStep1} className="space-y-6 text-left bg-[#0A0D12] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                    Ticket Identifier Code
                  </label>
                  <span className="text-[10px] text-[#A3A8B3] font-mono">Auto uppercase</span>
                </div>
                <div className="relative">
                  <Ticket className="w-5 h-5 text-[#FF5A36] absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="EXAMPLE: TBX-90412-VN8"
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-12 pr-4 py-3.5 text-base font-mono tracking-wider text-white placeholder-[#A3A8B3]/40 focus:outline-none focus:border-[#FF5A36]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all"
              >
                Continue
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: XÁC THỰC OTP SỐ ĐIỆN THOẠI */}
        {currentStep === 2 && (
          <div className="max-w-xl mx-auto space-y-6 pt-4">
            <div className="bg-[#0A0D12] border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  Verify Registered Phone Number
                </h2>
                <p className="text-xs text-[#A3A8B3] leading-relaxed">
                  Enter the phone number registered with the original ticket purchase to receive an OTP code.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] mb-2 font-display">
                    Registered Phone Number
                  </label>
                  <div className="flex items-center bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm">
                    <span className="text-[#A3A8B3] font-mono mr-3 pr-3 border-r border-white/10">VN +84</span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-transparent text-white font-mono w-full focus:outline-none"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                      OTP Verification Code (6 digits)
                    </label>
                    <span className="text-xs text-[#FF5A36] cursor-pointer hover:underline font-mono">
                      Resend Code (45s)
                    </span>
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
                        className="w-full h-12 bg-[#05070A] border border-white/15 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-[#FF5A36]"
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#A3A8B3] mt-2 font-mono">
                    Security code sent via SMS to the mobile number above. Valid for 5 minutes.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all flex items-center justify-center gap-2"
                >
                  {isVerifyingOtp ? 'Verifying OTP...' : 'Confirm OTP →'}
                </button>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#A3A8B3] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>2-Factor Authentication against fraud & unauthorized transfer</span>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* STEP 3: THÔNG TIN VÉ ĐÃ XÁC THỰC */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto space-y-6 pt-2">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Your Ticket is Ready for Listing
              </h2>
              <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
                TicketShield Smart Escrow has synced digital ticket details from official organizer.
              </p>
            </div>

            {/* Ticket Card Preview */}
            <div className="bg-[#0A0D12] border border-[#FF5A36]/30 rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Event Image Banner */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src="/images/landing/featured-1.jpg"
                  alt="BLACKPINK Concert"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/40 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-amber-400 rounded-full font-mono">
                    ★ INTERNATIONAL CONCERT
                  </span>
                </div>
              </div>

              {/* Card Main Meta Details */}
              <div className="p-6 space-y-5">
                <div>
                  <span className="text-[11px] text-[#FF5A36] font-mono font-bold uppercase tracking-wider">OFFICIAL DIGITAL TICKET PASS</span>
                  <h3 className="text-2xl font-extrabold font-display text-white">
                    BLACKPINK [BORN PINK] World Tour Finale
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-[#05070A] border border-white/10 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[#A3A8B3]">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>Event Time</span>
                    </div>
                    <p className="font-bold text-white font-mono">19:30, Jul 29, 2025</p>
                    <p className="text-[10px] text-[#A3A8B3]">Doors open at 17:00</p>
                  </div>

                  <div className="p-3.5 bg-[#05070A] border border-white/10 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[#A3A8B3]">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Venue Location</span>
                    </div>
                    <p className="font-bold text-white">My Dinh National Stadium</p>
                    <p className="text-[10px] text-[#A3A8B3]">Hanoi, Vietnam</p>
                  </div>
                </div>

                {/* Seat Position Box */}
                <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#A3A8B3] font-mono">Verified Seat Location</span>
                    <p className="text-base font-bold text-white font-display">
                      <span className="text-[#FF5A36]">VIP Zone A</span> · <span className="text-amber-400 font-bold">Row C</span> · Seat 24
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-mono text-white">
                    ENTRANCE GATE: Gate A1
                  </span>
                </div>

                {/* Owner & Escrow Hash */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#05070A] rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-[#A3A8B3]">TICKET OWNER</span>
                    <p className="text-white font-bold">{user?.fullName || 'Nguyen Thang Long'}</p>
                  </div>
                  <div className="p-3 bg-[#05070A] rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-[#A3A8B3]">ESCROW HASH</span>
                    <p className="text-cyan-400 font-bold truncate">0x7F2a...98B4</p>
                  </div>
                </div>

                {/* Price Ceiling */}
                <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#A3A8B3]">Original Face Value</span>
                    <p className="text-xl font-bold font-display text-white">1,500,000 VND</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 font-mono">🛡️ Price Ceiling Rule</span>
                    <p className="text-xs text-[#A3A8B3]">Max allowed resale (110%): <span className="text-white font-bold">1,650,000 VND</span></p>
                  </div>
                </div>

                {/* Barcode Mock */}
                <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl text-center space-y-2">
                  <div className="h-10 w-64 mx-auto bg-white/10 rounded flex items-center justify-center font-mono text-xs tracking-widest text-slate-400">
                    |||||| | |||| ||| ||||||| ||| ||
                  </div>
                  <p className="text-[10px] font-mono text-[#A3A8B3]">TK-8502-BP-2025-VN</p>
                </div>

              </div>
            </div>

            <button
              onClick={() => setCurrentStep(4)}
              className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue: Set Resale Price →</span>
            </button>
          </div>
        )}

        {/* STEP 4: ĐẶT GIÁ BÁN LẠI */}
        {currentStep === 4 && (
          <div className="max-w-xl mx-auto space-y-6 pt-2">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Set Resale Listing Price
              </h2>
              <p className="text-xs text-[#A3A8B3]">
                Maximum listing price is capped at face value (1,500,000 VND) for community protection.
              </p>
            </div>

            {/* Ticket Mini Summary */}
            <div className="p-4 bg-[#0A0D12] border border-white/10 rounded-2xl flex items-center gap-4 text-xs">
              <img
                src="/images/landing/featured-1.jpg"
                alt="Ticket Thumb"
                className="w-14 h-14 object-cover rounded-xl shrink-0"
              />
              <div className="space-y-0.5 flex-1">
                <h4 className="font-bold text-white truncate">BLACKPINK WORLD TOUR [BORN PINK]</h4>
                <p className="text-[11px] text-[#A3A8B3]">My Dinh Stadium • VIP Zone A, Seat 24</p>
              </div>
              <div className="text-right shrink-0 font-mono">
                <span className="text-[10px] text-[#A3A8B3]">Face Value:</span>
                <p className="font-bold text-white">1,500,000 VND</p>
              </div>
            </div>

            {/* Price Selector Main Box */}
            <div className="bg-[#0A0D12] border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-center">
              <span className="text-xs text-[#A3A8B3] uppercase tracking-wider font-display font-semibold">
                PROPOSED RESALE PRICE
              </span>

              <div className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight flex items-center justify-center gap-2">
                <span>{resalePrice.toLocaleString('en-US')}</span>
                <span className="text-base font-normal text-[#FF5A36]">VND</span>
              </div>

              {/* Quick Discount Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] text-[#A3A8B3]">Quick price options:</span>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  <button
                    onClick={() => handleApplyDiscount(5)}
                    className={`py-2.5 rounded-xl border transition-all ${
                      resalePrice === Math.round(faceValue * 0.95)
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white'
                    }`}
                  >
                    -5%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(10)}
                    className={`py-2.5 rounded-xl border transition-all ${
                      resalePrice === Math.round(faceValue * 0.9)
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white'
                    }`}
                  >
                    -10%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(15)}
                    className={`py-2.5 rounded-xl border transition-all ${
                      resalePrice === Math.round(faceValue * 0.85)
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white'
                    }`}
                  >
                    -15%
                  </button>

                  <button
                    onClick={() => handleApplyDiscount(0)}
                    className={`py-2.5 rounded-xl border transition-all ${
                      resalePrice === faceValue
                        ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold'
                        : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white'
                    }`}
                  >
                    Face Value
                  </button>
                </div>
              </div>

              {/* Net Payout Box */}
              <div className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-[#A3A8B3]">Your Net Payout:</span>
                <span className="text-xl font-bold font-display text-emerald-400">
                  {resalePrice.toLocaleString('en-US')} VND
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero platform fee, payout released right after event
              </p>

              <button
                onClick={() => setCurrentStep(5)}
                className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue: Review Listing →</span>
              </button>

              <div className="pt-2 text-[11px] text-[#A3A8B3] flex items-center justify-center gap-1 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Certified & encrypted payment standard
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: XÁC NHẬN NIÊM YẾT */}
        {currentStep === 5 && (
          <div className="max-w-xl mx-auto space-y-6 pt-2">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Confirm Ticket Listing
              </h2>
              <p className="text-xs text-[#A3A8B3]">
                Quick review before your pass is publicly listed on the marketplace.
              </p>
            </div>

            {/* Final Preview Card */}
            <div className="bg-[#0A0D12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
              
              <div className="relative h-44 rounded-2xl overflow-hidden">
                <img
                  src="/images/landing/featured-1.jpg"
                  alt="Concert"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 rounded-full font-mono">
                  BORN PINK TOUR
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-[#FF5A36] font-mono uppercase font-bold">VERIFIED DIGITAL PASS</span>
                <h3 className="text-xl font-bold font-display text-white">BLACKPINK World Tour Finale</h3>
                <p className="text-xs text-[#A3A8B3] flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> My Dinh National Stadium • Hanoi
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-[#05070A] border border-white/10 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-[#A3A8B3]">SEAT POSITION</span>
                  <p className="font-bold text-white font-display text-sm">VIP Zone A • Seat 24</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#A3A8B3]">LISTING PRICE</span>
                  <p className="font-bold text-white font-display text-sm">{resalePrice.toLocaleString('en-US')} VND</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold">Net payout after sale:</span>
                <span className="text-xl font-bold font-display text-emerald-400">{resalePrice.toLocaleString('en-US')} VND</span>
              </div>

              <label className="flex items-center gap-3 text-xs text-[#F5F5F2] cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-white/20 bg-[#05070A] text-[#FF5A36] focus:ring-0 w-4 h-4"
                />
                <span>I confirm I am the original ticket owner and agree to list this pass</span>
              </label>

              <button
                onClick={handlePublishListing}
                disabled={isPublishing}
                className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all flex items-center justify-center gap-2"
              >
                {isPublishing ? 'Publishing Listing...' : 'Publish Listing Now →'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-[#A3A8B3] hover:text-white underline font-mono"
                >
                  Edit Price
                </button>
              </div>

            </div>
          </div>
        )}

        {/* STEP 6: HOÀN TẤT NIÊM YẾT */}
        {currentStep === 6 && (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-8">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold font-display text-white">
                Ticket Listed Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-[#A3A8B3] max-w-md mx-auto leading-relaxed">
                Your digital ticket has been published to TicketShield Marketplace with 100% Escrow Protection.
              </p>
            </div>

            <div className="p-6 bg-[#0A0D12] border border-white/10 rounded-3xl space-y-3 text-left max-w-md mx-auto text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A3A8B3]">Status:</span>
                <span className="text-emerald-400 font-bold font-mono">PUBLICLY LISTED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A3A8B3]">Listing ID:</span>
                <span className="text-white font-mono font-bold">TS-RESALE-88201</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A3A8B3]">Listing Price:</span>
                <span className="text-white font-bold">{resalePrice.toLocaleString('en-US')} VND</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/my-listings')}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5A36] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30"
              >
                Manage My Listings
              </button>

              <button
                onClick={() => navigate('/marketplace')}
                className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl hover:bg-white/10"
              >
                View On Marketplace
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SellTicketPage;
