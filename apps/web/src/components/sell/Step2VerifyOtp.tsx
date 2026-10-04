import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Loader2, Ticket, CheckCircle2 } from 'lucide-react';

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

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync digits map per ticket
  useEffect(() => {
    setDigits((prev) => {
      const next: Record<string, string[]> = {};
      for (const t of tickets) {
        next[t.code] = prev[t.code] ?? emptyDigits();
      }
      return next;
    });
  }, [tickets]);

  // Countdown timer tick
  useEffect(() => {
    if (tickets.every((t) => t.locked)) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tickets]);

  const secondsLeft = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tickets) {
      map[t.code] = t.expiresAt
        ? Math.max(0, Math.floor((t.expiresAt - now) / 1000))
        : TICKET_TTL_SECONDS;
    }
    return map;
  }, [tickets, now]);

  const safePage = Math.min(page, Math.max(tickets.length - 1, 0));
  const current = tickets[safePage];
  const currentCode = current?.code ?? '';
  const currentValue = digits[currentCode] ?? emptyDigits();
  const currentLeft = secondsLeft[currentCode] ?? 0;
  const currentExpired = currentLeft <= 0 && !current?.locked;

  const isLastPage = safePage >= tickets.length - 1;
  const allLocked = tickets.length > 0 && tickets.every((t) => t.locked);
  const lockedCount = tickets.filter((t) => t.locked).length;

  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (allLocked && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onCompleteRef.current();
    } else if (!allLocked) {
      hasCompletedRef.current = false;
    }
  }, [allLocked]);

  // Auto focus slot 0 when safePage changes
  useEffect(() => {
    if (!current?.locked) {
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [safePage, current?.locked]);

  const focusSlot = (slot: number) => {
    inputRefs.current[slot]?.focus();
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
    } else if (e.key === 'Enter') {
      if (currentValue.join('').length === OTP_LENGTH && !isVerifying) {
        handleVerifyCurrent();
      }
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

  const handleVerifyCurrent = async () => {
    if (!currentCode) return;

    const otpStr = currentValue.join('');
    if (otpStr.length < OTP_LENGTH) {
      setError(`Vui lòng nhập đủ 6 chữ số mã OTP cho vé ${currentCode}.`);
      return;
    }
    if (currentExpired) {
      setError(`Mã OTP cho vé ${currentCode} đã hết hạn. Vui lòng bấm Gửi lại OTP.`);
      return;
    }

    setError('');
    try {
      const ok = await onVerifyTicket({ code: currentCode, otp: otpStr });
      if (!ok) return;

      if (!isLastPage) {
        setPage((p) => Math.min(p + 1, tickets.length - 1));
        setError('');
      }
    } catch (err: any) {
      setError(err?.message || 'Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      setCurrentDigits(emptyDigits());
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    }
  };

  const handleGoToPage = (index: number) => {
    if (index < 0 || index >= tickets.length) return;
    if (index > safePage + 1 && !tickets[index].locked) return;
    setPage(index);
    setError('');
  };

  const isCurrentFilled = currentValue.join('').length === OTP_LENGTH;
  const isCurrentDone = Boolean(current?.locked);

  if (!current) return null;

  const currentIdxStr = (safePage + 1).toString().padStart(2, '0');
  const totalIdxStr = tickets.length.toString().padStart(2, '0');

  return (
    <div className="max-w-[640px] mx-auto space-y-5 pt-2 font-sans animate-fade-in-up text-center">
      {/* 2. Top Ticket Switcher (Segmented Control) */}
      {tickets.length > 1 && (
        <div className="inline-flex items-center gap-1.5 p-1 bg-[#0D1117] border border-white/[0.08] rounded-xl shadow-md">
          {tickets.map((t, idx) => {
            const isActive = idx === safePage;
            const isDone = t.locked;
            const canSelect = isActive || isDone || idx <= safePage + 1;

            return (
              <button
                key={t.code}
                type="button"
                onClick={() => handleGoToPage(idx)}
                disabled={!canSelect}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-[#FF5738]/10 border border-[#FF5738] text-white font-bold shadow-sm'
                    : isDone
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-[#22C55E]'
                    : 'bg-transparent border border-transparent text-[#8A909B] hover:text-white'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                ) : (
                  <Ticket className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5738]' : 'text-[#8A909B]'}`} />
                )}
                <span>Vé {idx + 1}</span>
                {isDone && <span className="text-[#22C55E] text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Panel Content */}
      <div className="bg-[#0D1117] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
        {/* Top Progress Badge & Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-[#8A909B]">
            <span className={`w-2 h-2 rounded-full ${isCurrentDone ? 'bg-[#22C55E]' : 'bg-[#FF5738]'}`} />
            <span>{currentIdxStr} / {totalIdxStr}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F5F5F5] tracking-tight">
            XÁC THỰC VÉ
          </h2>

          <div className="font-mono text-[#FF5738] text-base font-bold">
            {current.code}
          </div>

          <p className="text-xs sm:text-sm text-[#8A909B] max-w-md mx-auto leading-relaxed">
            Nhập mã OTP 6 số được gửi đến chủ vé để xác thực quyền sở hữu.
          </p>
        </div>

        {/* 4. Ticket Identity Box (Digital Ticket Card) */}
        <div className="bg-[#111722]/90 border border-white/[0.08] rounded-xl p-4 flex items-center justify-between text-left shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FF5738]/10 border border-[#FF5738]/20">
              <Ticket className="w-4 h-4 text-[#FF5738]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#8A909B] uppercase block">
                MÃ VÉ
              </span>
              <span className="font-mono text-base font-bold text-[#F5F5F5]">
                {current.code}
              </span>
            </div>
          </div>

          <div className="text-right font-mono">
            {current.locked ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#22C55E] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã khoá vé
              </span>
            ) : (
              <div>
                <span className="text-[10px] text-[#8A909B] uppercase block">
                  OTP hết hạn sau
                </span>
                <span className={`text-xs font-bold ${currentLeft <= 60 ? 'text-rose-400 animate-pulse' : 'text-[#FF5738]'}`}>
                  {formatTimer(currentLeft)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 5. OTP Input Section */}
        <div className="space-y-3 pt-1">
          <div className="space-y-0.5">
            <h3 className="text-xs font-mono font-bold tracking-widest text-[#8A909B] uppercase">
              NHẬP MÃ OTP
            </h3>
            <p className="text-[11px] text-[#8A909B]">Mã gồm 6 chữ số</p>
          </div>

          {/* 6 Individual Square OTP Input Boxes */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {currentValue.map((digit, slot) => (
              <input
                key={slot}
                ref={(el) => (inputRefs.current[slot] = el)}
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
                className={`w-[50px] h-[54px] border rounded-[10px] text-center font-mono font-bold text-xl transition-all duration-150 focus:outline-none disabled:opacity-50 ${
                  current.locked
                    ? 'border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]'
                    : digit
                    ? 'border-[#FF5738] bg-[#FF5738]/5 text-white ring-1 ring-[#FF5738]/30'
                    : 'border-white/[0.08] bg-[#070A0F] text-white focus:border-[#FF5738] focus:ring-1 focus:ring-[#FF5738]/30'
                }`}
              />
            ))}
          </div>

          {/* 6. Resend & Expiry Info */}
          <div className="flex items-center justify-between text-xs font-mono pt-2 px-1 text-[#8A909B]">
            <span>
              {currentExpired ? 'Hết hạn' : `Hết hạn sau ${formatTimer(currentLeft)}`}
            </span>

            <div className="flex items-center gap-1">
              <span>Chưa nhận được mã?</span>
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  setCurrentDigits(emptyDigits());
                  await onResend(current.code);
                  setTimeout(() => inputRefs.current[0]?.focus(), 120);
                }}
                disabled={resendingCode !== null || current.locked}
                className="text-[#FF5738] hover:underline font-medium disabled:opacity-40 transition-colors cursor-pointer"
              >
                {resendingCode === current.code ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Gửi lại...
                  </span>
                ) : (
                  'Gửi lại OTP'
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-mono text-center">
            {error}
          </div>
        )}

        {/* 7. Primary Action CTA Button */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleVerifyCurrent}
            disabled={isVerifying || !isCurrentFilled || isCurrentDone}
            className={`w-full h-[52px] rounded-xl font-mono font-bold uppercase tracking-wider text-xs transition-all duration-200 flex items-center justify-center gap-2 ${
              isCurrentDone
                ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] cursor-default'
                : isVerifying
                ? 'bg-[#FF5738]/50 text-white cursor-wait'
                : isCurrentFilled
                ? 'bg-[#FF5738] hover:bg-[#FF7054] text-white shadow-md shadow-[#FF5738]/20 cursor-pointer'
                : 'bg-white/[0.04] border border-white/[0.08] text-white/30 cursor-not-allowed'
            }`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG XÁC THỰC...</span>
              </>
            ) : isCurrentDone ? (
              <span>ĐÃ XÁC THỰC VÉ NÀY ✓</span>
            ) : isLastPage ? (
              <span>XÁC THỰC VÀ HOÀN TẤT →</span>
            ) : (
              <span>XÁC THỰC VÀ TIẾP TỤC →</span>
            )}
          </button>

          {/* 8. Next Ticket Status Indicator */}
          <div className="text-xs font-mono text-[#8A909B]">
            {allLocked ? (
              <span className="text-[#22C55E] font-semibold">TẤT CẢ VÉ ĐÃ ĐƯỢC XÁC THỰC</span>
            ) : tickets.length > 1 && !isLastPage ? (
              <span>VÉ {safePage + 2} SẼ ĐƯỢC XÁC THỰC TIẾP THEO</span>
            ) : (
              <span>VÉ {lockedCount} / {tickets.length} ĐÃ XÁC THỰC</span>
            )}
          </div>
        </div>

        {/* 9. Minimal Cancel Action */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onAbandon}
            disabled={isCancelling}
            className="text-xs text-[#8A909B] hover:text-white transition-colors font-mono cursor-pointer disabled:opacity-40"
          >
            {isCancelling ? 'Đang hủy...' : 'Hủy'}
          </button>
        </div>
      </div>
    </div>
  );
};