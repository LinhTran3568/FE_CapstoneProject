import React from 'react';
import { Loader2, Lock, X } from 'lucide-react';

export interface Step2VerifyOtpProps {
  otp: string[];
  handleOtpChange: (index: number, val: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleClearOtp: () => void;
  handleResendOtp: () => void;
  isResendingOtp: boolean;
  otpTimeLeft: number;
  formatOtpTimer: (seconds: number) => string;
  handleVerifyOtp: (e: React.FormEvent) => void;
  isVerifyingOtp: boolean;
  handleAbandonSession: () => void;
  isCancellingSession: boolean;
}

export const Step2VerifyOtp: React.FC<Step2VerifyOtpProps> = ({
  otp,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  handleClearOtp,
  handleResendOtp,
  isResendingOtp,
  otpTimeLeft,
  formatOtpTimer,
  handleVerifyOtp,
  isVerifyingOtp,
  handleAbandonSession,
  isCancellingSession,
}) => {
  return (
    <div key={2} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-4">
      <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl hover:border-white/20 transition-all duration-300">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Verify Owner OTP Code
          </h2>
          <p className="text-xs text-[#A3A8B3] leading-relaxed">
            Enter the OTP sent by the Organizer to the ticket owner's email/phone to lock the ticket.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
                Verification OTP (6 Digits)
              </label>
              <div className="flex items-center gap-3">
                {otp.some((d) => d !== '') && (
                  <button
                    type="button"
                    onClick={handleClearOtp}
                    className="text-xs text-[#A3A8B3] hover:text-white hover:underline transition-colors font-mono"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className="text-xs text-[#FF5A36] hover:underline transition-all font-mono flex items-center gap-1"
                >
                  {isResendingOtp ? 'Resending...' : 'Resend OTP'}
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
              <span className="text-[#A3A8B3]">Code expires in:</span>
              <span
                className={`text-sm sm:text-base font-bold font-mono tracking-wider ${
                  otpTimeLeft <= 60 ? 'text-rose-400 animate-pulse' : 'text-[#FF5A36]'
                }`}
              >
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
                <span>Confirming...</span>
              </>
            ) : (
              <span>Confirm & Lock</span>
            )}
          </button>

          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#A3A8B3] flex items-center gap-2 hover:border-emerald-500/30 transition-all duration-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>System verification ensures ticket is authentic and not yet used.</span>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleAbandonSession}
              disabled={isCancellingSession}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 border border-rose-500/30 hover:border-rose-400 rounded-xl text-xs font-mono font-semibold transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
            >
              {isCancellingSession ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cancel</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
