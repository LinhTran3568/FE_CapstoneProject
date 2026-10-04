import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Lock, Ticket, X } from 'lucide-react';

export interface OtpTicket {
  /** Mã vé gốc của chính phiên OTP này. */
  code: string;
  /** Mốc hết hạn (epoch ms) của OTP đã gửi cho vé này. */
  expiresAt: number | null;
  /** true khi phiên này đã được BTC khóa vé thành công. */
  locked: boolean;
}

export interface Step2VerifyOtpProps {
  tickets: OtpTicket[];
  /** Xác thực OTP của MỘT vé. Trả về false nếu vé đó hỏng (cả gói sẽ được giải phóng). */
  onVerifyTicket: (entry: { code: string; otp: string }) => Promise<boolean>;
  /** Đã xác thực xong tất cả vé -> chuyển sang bước tiếp theo. */
  onComplete: () => void;
  onResend: (code: string) => Promise<void>;
  onAbandon: () => void;
  isVerifying: boolean;
  resendingCode: string | null;
  isCancelling: boolean;
}

const OTP_LENGTH = 6;
const TICKET_TTL_SECONDS = 300;

const emptyDigits = () => Array<string>(OTP_LENGTH).fill('');

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const maskCode = (code: string) => {
  if (code.length <= 4) return code;
  return `${code.slice(0, 2)}${'•'.repeat(Math.max(4, code.length - 6))}${code.slice(-4)}`;
};

export const Step2VerifyOtp: React.FC<Step2VerifyOtpProps> = ({
  tickets,
  onVerifyTicket,
  onComplete,
  onResend,
  onAbandon,
  isVerifying,
  resendingCode,
  isCancelling,
}) => {
  const [digits, setDigits] = useState<Record<string, string[]>>({});
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);

  // Đồng bộ ô nhập cho vé mới, KHÔNG reset page (tránh lùi về vé đầu sau mỗi lần verify).
  useEffect(() => {
    setDigits((prev) => {
      const next: Record<string, string[]> = {};
      for (const ticket of tickets) {
        next[ticket.code] = prev[ticket.code] ?? emptyDigits();
      }
      return next;
    });
  }, [tickets]);

  useEffect(() => {
    if (tickets.every((t) => t.locked)) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tickets]);

  const secondsLeft = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ticket of tickets) {
      map[ticket.code] = ticket.expiresAt
        ? Math.max(0, Math.floor((ticket.expiresAt - now) / 1000))
        : TICKET_TTL_SECONDS;
    }
    return map;
  }, [tickets, now]);

  const safePage = Math.min(page, Math.max(tickets.length - 1, 0));
  const current = tickets[safePage];
  const currentCode = current?.code;
  const currentValue = digits[currentCode ?? ''] ?? emptyDigits();
  const currentLeft = secondsLeft[currentCode ?? ''] ?? 0;
  const currentExpired = currentLeft <= 0 && !current?.locked;
  const isLastPage = safePage >= tickets.length - 1;
  const nextTicket = isLastPage ? undefined : tickets[safePage + 1];

  const allLocked = tickets.length > 0 && tickets.every((t) => t.locked);

  useEffect(() => {
    if (allLocked) onComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLocked]);

  const currentFilled = currentValue.join('').length === OTP_LENGTH;
  const currentDone = Boolean(current?.locked);

  const focusSlot = (slot: number) => {
    document.getElementById(`otp-${slot}`)?.focus();
  };

  const setCurrentDigits = (next: string[]) => {
    if (!currentCode) return;
    setDigits((prev) => ({ ...prev, [currentCode]: next }));
  };

  const handleChange = (slot: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...currentValue];
      next[slot] = '';
      setCurrentDigits(next);
      return;
    }

    const next = [...currentValue];
    const incoming = cleaned.slice(0, OTP_LENGTH - slot).split('');
    incoming.forEach((d, i) => {
      next[slot + i] = d;
    });
    setCurrentDigits(next);

    if (slot + incoming.length < OTP_LENGTH) {
      focusSlot(slot + incoming.length);
    }
  };

  const handleKeyDown = (slot: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!currentValue[slot] && slot > 0) {
        const next = [...currentValue];
        next[slot - 1] = '';
        setCurrentDigits(next);
        focusSlot(slot - 1);
      } else if (currentValue[slot]) {
        const next = [...currentValue];
        next[slot] = '';
        setCurrentDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && slot > 0) {
      focusSlot(slot - 1);
    } else if (e.key === 'ArrowRight' && slot < OTP_LENGTH - 1) {
      focusSlot(slot + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = emptyDigits();
    pasted.split('').forEach((d, i) => {
      next[i] = d;
    });
    setCurrentDigits(next);
    focusSlot(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  /** Xác thực vé của trang hiện tại rồi lật sang trang kế tiếp. */
  const handleVerifyCurrent = async () => {
    if (!currentCode) return;

    if (!currentFilled) {
      setError(`Please enter the full ${OTP_LENGTH}-digit OTP for ticket ${currentCode}.`);
      return;
    }
    if (currentExpired) {
      setError(`The OTP for ticket ${currentCode} has expired. Please resend it.`);
      return;
    }

    setError('');
    const ok = await onVerifyTicket({ code: currentCode, otp: currentValue.join('') });
    if (!ok) return;

    if (isLastPage) return; // onComplete() được gọi tự động khi tất cả vé đã khoá
    setPage((p) => Math.min(p + 1, tickets.length - 1));
    setError('');
  };

  const handleGoToPage = (index: number) => {
    if (index < 0 || index >= tickets.length) return;
    // Chỉ được nhảy tới trang đã khoá xong hoặc trang kế tiếp trang hiện tại.
    if (index > safePage + 1) return;
    setPage(index);
    setError('');
  };

  const hasAnyInput = tickets.some((t) => (digits[t.code] ?? emptyDigits()).some((d) => d !== ''));

  if (!current) return null;

  return (
    <div key={2} className="animate-fade-in-up max-w-xl mx-auto space-y-4 pt-4">
      {/* Page indicator: mỗi vé là 1 trang */}
      <div className="flex items-center justify-center gap-2">
        {tickets.map((t, i) => {
          const isActive = i === safePage;
          const isDone = t.locked;
          const canOpen = isActive || isDone || i <= safePage + 1;
          return (
            <button
              key={t.code}
              type="button"
              onClick={() => handleGoToPage(i)}
              disabled={!canOpen}
              aria-label={`Ticket ${i + 1}${isDone ? ' (verified)' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                isActive
                  ? 'w-10 bg-[#FF5A36]'
                  : isDone
                  ? 'w-5 bg-emerald-500/70 hover:bg-emerald-400'
                  : canOpen
                  ? 'w-5 bg-white/20 hover:bg-white/40'
                  : 'w-5 bg-white/10'
              }`}
            />
          );
        })}
      </div>

      <p className="text-center text-[11px] font-mono uppercase tracking-widest text-[#8F96A3]">
        Ticket {safePage + 1} of {tickets.length}
      </p>

      <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl hover:border-white/20 transition-all duration-300">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Verify Owner OTP Code
          </h2>
          <p className="text-xs text-[#A3A8B3] leading-relaxed">
            {tickets.length > 1
              ? 'Enter the OTP of this ticket to unlock it, then continue to the next one.'
              : "Enter the OTP sent by the Organizer to the ticket owner's email/phone to lock the ticket."}
          </p>
        </div>

        <div className="space-y-4">
          {/* Trang hiện tại */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Ticket className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span className="font-mono text-sm text-white truncate">{current.code}</span>
              </div>
              {current.locked ? (
                <span className="text-[11px] font-mono text-emerald-400 shrink-0">Locked</span>
              ) : (
                <span
                  className={`text-xs font-mono font-bold tracking-wider shrink-0 ${
                    currentLeft <= 60 ? 'text-rose-400 animate-pulse' : 'text-[#FF5A36]'
                  }`}
                >
                  {formatTimer(currentLeft)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-6 gap-2">
              {currentValue.map((digit, slot) => (
                <input
                  key={slot}
                  id={`otp-${slot}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  disabled={current.locked}
                  onChange={(e) => handleChange(slot, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(slot, e)}
                  onPaste={handlePaste}
                  className="w-full h-12 bg-[#05070A] border border-white/15 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 focus:scale-105 transition-all duration-200 disabled:opacity-40"
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono ${currentExpired ? 'text-rose-400' : 'text-[#A3A8B3]'}`}>
                {currentExpired ? 'OTP expired' : 'Code expires in'}
              </span>
              <button
                type="button"
                onClick={() => onResend(current.code)}
                disabled={resendingCode !== null || current.locked}
                className="text-xs text-[#FF5A36] hover:underline transition-all font-mono disabled:opacity-50 inline-flex items-center gap-1"
              >
                {resendingCode === current.code ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* Trang kế tiếp: hiện mờ mờ như đang chờ lật */}
          {nextTicket && (
            <button
              type="button"
              onClick={() => handleGoToPage(safePage + 1)}
              disabled={!currentFilled || isVerifying}
              className="w-full text-left space-y-1 rounded-2xl border border-white/5 bg-white/[0.01] px-4 py-3 opacity-30 hover:opacity-60 focus:opacity-60 transition-all duration-300 disabled:cursor-not-allowed disabled:hover:opacity-30"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8F96A3] block">
                Next ticket
              </span>
              <span className="font-mono text-xs text-[#A3A8B3] block truncate">
                {maskCode(nextTicket.code)}
              </span>
            </button>
          )}
        </div>

        {hasAnyInput && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDigits(Object.fromEntries(tickets.map((t) => [t.code, emptyDigits()])))}
              className="text-xs text-[#A3A8B3] hover:text-white hover:underline transition-colors font-mono"
            >
              Clear all
            </button>
          </div>
        )}

        {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

        {/* Điều hướng trang */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleGoToPage(safePage - 1)}
            disabled={safePage === 0 || isVerifying}
            aria-label="Previous ticket"
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] text-[#A3A8B3] hover:text-white hover:border-white/25 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleVerifyCurrent}
            disabled={isVerifying || !currentFilled || currentDone}
            className={`flex-1 h-12 rounded-xl font-bold font-display uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
              currentDone
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default'
                : isVerifying
                ? 'bg-[#FF5A36]/40 text-white cursor-wait'
                : currentFilled
                ? 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                : 'bg-white/[0.04] border border-white/10 text-white/25 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : currentDone ? (
              <span>Verified</span>
            ) : isLastPage ? (
              <span>{`Confirm & Lock ${tickets.length} Tickets`}</span>
            ) : (
              <>
                <span>Verify & Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#A3A8B3] flex items-center gap-2 hover:border-emerald-500/30 transition-all duration-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>System verification ensures ticket is authentic and not yet used.</span>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onAbandon}
            disabled={isCancelling}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 border border-rose-500/30 hover:border-rose-400 rounded-xl text-xs font-mono font-semibold transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
          >
            {isCancelling ? (
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
      </div>
    </div>
  );
};