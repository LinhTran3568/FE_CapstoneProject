import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Loader2, Ticket, CheckCircle2, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { CardStack } from '../ui/card-stack';

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
  /** Xác thực OTP của MỘT vé. Trả về false nếu vé đó hỏng. */
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [verifyingCode, setVerifyingCode] = useState<string | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const safePage = Math.min(Math.max(page, 0), Math.max(tickets.length - 1, 0));
  const current = tickets[safePage];
  const allLocked = tickets.length > 0 && tickets.every((t) => t.locked);

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

  // Focus slot 0 của vé hiện tại khi chuyển tab / card
  useEffect(() => {
    if (!current || current.locked) return undefined;
    const timer = setTimeout(() => {
      const slot0 = inputRefs.current[`${current.code}-0`];
      slot0?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [safePage, current?.code, current?.locked]);

  const focusSlot = (code: string, slot: number) => {
    inputRefs.current[`${code}-${slot}`]?.focus();
  };

  const handleDigitChange = (code: string, slot: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    const currentCodeDigits = digits[code] ?? emptyDigits();

    if (!cleaned) {
      const next = [...currentCodeDigits];
      next[slot] = '';
      setDigits((prev) => ({ ...prev, [code]: next }));
      return;
    }

    const next = [...currentCodeDigits];
    const incoming = cleaned.slice(0, OTP_LENGTH - slot).split('');
    incoming.forEach((d, i) => {
      next[slot + i] = d;
    });
    setDigits((prev) => ({ ...prev, [code]: next }));

    if (slot + incoming.length < OTP_LENGTH) {
      focusSlot(code, slot + incoming.length);
    }
  };

  const handleKeyDown = (code: string, slot: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentCodeDigits = digits[code] ?? emptyDigits();

    if (e.key === 'Backspace') {
      if (!currentCodeDigits[slot] && slot > 0) {
        const next = [...currentCodeDigits];
        next[slot - 1] = '';
        setDigits((prev) => ({ ...prev, [code]: next }));
        focusSlot(code, slot - 1);
      } else if (currentCodeDigits[slot]) {
        const next = [...currentCodeDigits];
        next[slot] = '';
        setDigits((prev) => ({ ...prev, [code]: next }));
      }
    } else if (e.key === 'ArrowLeft' && slot > 0) {
      focusSlot(code, slot - 1);
    } else if (e.key === 'ArrowRight' && slot < OTP_LENGTH - 1) {
      focusSlot(code, slot + 1);
    } else if (e.key === 'Enter') {
      const currentTarget = tickets.find((t) => t.code === code);
      if (currentTarget && !currentTarget.locked && currentCodeDigits.join('').length === OTP_LENGTH) {
        handleVerifyOneTicket(currentTarget);
      }
    }
  };

  const handlePaste = (code: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = emptyDigits();
    pasted.split('').forEach((d, i) => {
      next[i] = d;
    });
    setDigits((prev) => ({ ...prev, [code]: next }));
    focusSlot(code, Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const handleVerifyOneTicket = async (t: OtpTicket) => {
    if (t.locked) return;

    const ticketDigits = digits[t.code] ?? emptyDigits();
    const otpStr = ticketDigits.join('');
    if (otpStr.length < OTP_LENGTH) {
      setErrors((prev) => ({ ...prev, [t.code]: `Vui lòng nhập đủ 6 chữ số mã OTP cho vé ${t.code}.` }));
      return;
    }

    const tLeft = secondsLeft[t.code] ?? 0;
    if (tLeft <= 0) {
      setErrors((prev) => ({ ...prev, [t.code]: `Mã OTP của vé ${t.code} đã hết hạn. Vui lòng bấm Gửi lại OTP.` }));
      return;
    }

    setErrors((prev) => ({ ...prev, [t.code]: '' }));
    setVerifyingCode(t.code);

    try {
      const ok = await onVerifyTicket({ code: t.code, otp: otpStr });
      if (!ok) return;

      // Nếu còn vé chưa xác thực, tự động chuyển sang vé kế tiếp
      const nextUnlockedIdx = tickets.findIndex((item, i) => i !== safePage && !item.locked);
      if (nextUnlockedIdx !== -1) {
        setPage(nextUnlockedIdx);
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [t.code]: err?.message || 'Mã OTP không chính xác. Vui lòng thử lại!',
      }));
      setDigits((prev) => ({ ...prev, [t.code]: emptyDigits() }));
      setTimeout(() => focusSlot(t.code, 0), 120);
    } finally {
      setVerifyingCode(null);
    }
  };

  const handlePrevCard = () => {
    setPage((p) => (p - 1 + tickets.length) % tickets.length);
  };

  const handleNextCard = () => {
    setPage((p) => (p + 1) % tickets.length);
  };

  if (!current) return null;

  const HEADER_OFFSET = 62;

  return (
    <div className="max-w-[530px] mx-auto space-y-4 pt-1 font-sans text-center">
      {/* Title Header */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F5F5F5] tracking-tight">
          XÁC THỰC VÉ
        </h2>
        <p className="text-xs sm:text-sm text-[#8A909B] max-w-sm mx-auto leading-relaxed">
          Nhập mã OTP 6 số để xác thực quyền sở hữu vé chính chủ từ Ban tổ chức.
        </p>
      </div>

      {/* Ticket Navigation Tabs & Indicators (Khi bán nhiều vé / combo) */}
      {tickets.length > 1 && (
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Nút Prev Card */}
          <button
            type="button"
            onClick={handlePrevCard}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Vé trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Ticket Pills Selector */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center font-mono">
            {tickets.map((t, idx) => {
              const isSelected = idx === safePage;
              const isLocked = t.locked;

              return (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => setPage(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5738]/15 border border-[#FF5738] text-white shadow-sm shadow-[#FF5738]/20'
                      : isLocked
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15'
                      : 'bg-white/[0.03] border border-white/[0.08] text-[#8A909B] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {isLocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Ticket className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#FF5738]' : 'text-[#8A909B]'}`} />
                  )}
                  <span>Vé {idx + 1}</span>
                  <span className="text-[10px] opacity-75 font-normal">({t.code.slice(-4)})</span>
                </button>
              );
            })}
          </div>

          {/* Nút Next Card */}
          <button
            type="button"
            onClick={handleNextCard}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Vé sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CardStack Container: Thẻ OTP dạng So Le (Staggered Cascade) */}
      <div className="pt-1">
        <CardStack
          items={tickets.map((t) => ({ id: t.code, ...t }))}
          activeIndex={safePage}
          onActiveIndexChange={setPage}
          layoutMode="staggered"
          offset={HEADER_OFFSET}
          renderCard={(t, isTop, originalIndex) => {
            const ticketDigits = digits[t.code] ?? emptyDigits();
            const filledCount = ticketDigits.filter((d) => Boolean(d && d.trim())).length;
            const tLeft = secondsLeft[t.code] ?? 0;
            const isExpired = tLeft <= 0 && !t.locked;
            const isFilled = filledCount === OTP_LENGTH;
            const errorMsg = errors[t.code];
            const isCurrentVerifying = isVerifying && verifyingCode === t.code;

            return (
              <div
                className={`w-full rounded-2xl transition-all duration-200 overflow-hidden text-left ${
                  isTop
                    ? 'bg-[#0E1422] border border-white/[0.14] shadow-2xl shadow-black/90 ring-1 ring-white/[0.06]'
                    : 'bg-[#0B0F19] border border-white/[0.08] shadow-md shadow-black/50 hover:border-white/[0.18]'
                }`}
              >
                {/* Header thẻ vé: Luôn luôn hiển thị đầy đủ ngay cả khi thẻ nằm so le phía sau */}
                <div
                  className={`h-[62px] px-4 sm:px-5 flex items-center justify-between transition-colors ${
                    isTop
                      ? 'border-b border-white/[0.08] bg-[#0E1422]'
                      : 'cursor-pointer hover:bg-white/[0.03] bg-[#0B0F19]'
                  }`}
                  onClick={() => {
                    if (!isTop) setPage(originalIndex);
                  }}
                >
                  {/* Cột trái: Mã vé */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        t.locked
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : isTop
                          ? 'bg-[#FF5738]/10 border-[#FF5738]/25 text-[#FF5738]'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/50'
                      }`}
                    >
                      {t.locked ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Ticket className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A909B] block">
                        Vé {originalIndex + 1}/{tickets.length}
                      </span>
                      <span className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
                        {t.code}
                      </span>
                    </div>
                  </div>

                  {/* Cột phải: Trạng thái nhập OTP + Thời gian còn lại */}
                  <div className="flex items-center gap-2 sm:gap-2.5 font-mono text-xs">
                    {/* Badge đã nhập OTP chưa */}
                    {t.locked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực
                      </span>
                    ) : filledCount === OTP_LENGTH ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        Đã nhập 6 số
                      </span>
                    ) : filledCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300">
                        Đang nhập ({filledCount}/6)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-white/[0.04] border border-white/[0.08] text-[#8A909B]">
                        Chưa nhập
                      </span>
                    )}

                    {/* Badge thời gian còn lại */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-white/[0.04] border border-white/[0.08] text-[#8A909B]">
                      <Clock className="w-3.5 h-3.5 text-[#FF5738]" />
                      <span
                        className={
                          t.locked
                            ? 'text-emerald-400 font-semibold'
                            : isExpired
                            ? 'text-rose-400 font-bold'
                            : tLeft <= 60
                            ? 'text-rose-400 font-bold animate-pulse'
                            : 'text-[#FF5738] font-semibold'
                        }
                      >
                        {t.locked ? 'Đã khóa' : isExpired ? 'Hết hạn' : formatTimer(tLeft)}
                      </span>
                    </span>

                    {/* Chỉ báo nhấn để chọn khi thẻ nằm so le phía sau */}
                    {!isTop && (
                      <span className="text-[11px] text-[#FF5738] hover:underline hidden sm:inline-block font-sans font-medium pl-1">
                        Nhập OTP →
                      </span>
                    )}
                  </div>
                </div>

                {/* Thân thẻ vé: Chỉ hiển thị đầy đủ khi thẻ đang active (isTop) */}
                <div className={`p-5 sm:p-6 space-y-4 ${!isTop ? 'pointer-events-none opacity-0 select-none h-0 p-0 overflow-hidden' : ''}`}>
                  {/* 6 OTP Input Slots */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 pt-0.5">
                      {ticketDigits.map((digit, slot) => (
                        <input
                          key={slot}
                          ref={(el) => {
                            inputRefs.current[`${t.code}-${slot}`] = el;
                          }}
                          id={`otp-${t.code}-${slot}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          disabled={t.locked || !isTop}
                          tabIndex={isTop ? 0 : -1}
                          onChange={(e) => handleDigitChange(t.code, slot, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(t.code, slot, e)}
                          onPaste={(e) => handlePaste(t.code, e)}
                          className={`w-[44px] h-[50px] sm:w-[48px] sm:h-[54px] border rounded-xl text-center font-mono font-bold text-xl transition-all duration-150 focus:outline-none disabled:opacity-50 ${
                            t.locked
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : digit
                              ? 'border-[#FF5738] bg-[#FF5738]/5 text-white ring-1 ring-[#FF5738]/30'
                              : 'border-white/[0.08] bg-[#070A0F] text-white focus:border-[#FF5738] focus:ring-1 focus:ring-[#FF5738]/30'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Resend Link & Expiry Indicator */}
                    <div className="flex items-center justify-between text-xs font-mono px-1 text-[#8A909B]">
                      <span>
                        {isExpired ? 'Mã đã hết hạn' : `Hết hạn sau ${formatTimer(tLeft)}`}
                      </span>

                      <button
                        type="button"
                        onClick={async () => {
                          setErrors((prev) => ({ ...prev, [t.code]: '' }));
                          setDigits((prev) => ({ ...prev, [t.code]: emptyDigits() }));
                          await onResend(t.code);
                          setTimeout(() => focusSlot(t.code, 0), 120);
                        }}
                        disabled={resendingCode === t.code || t.locked || !isTop}
                        className="text-[#FF5738] hover:underline font-medium disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        {resendingCode === t.code ? (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Đang gửi lại...
                          </span>
                        ) : (
                          'Gửi lại OTP'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {errorMsg && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-mono text-center">
                      {errorMsg}
                    </div>
                  )}

                  {/* Button hành động của thẻ này */}
                  <div className="pt-0.5">
                    {t.locked ? (
                      <div className="w-full h-[46px] rounded-xl font-mono font-bold text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2 cursor-default">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>ĐÃ KHÓA VÉ CHÍNH CHỦ ✓</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerifyOneTicket(t)}
                        disabled={!isTop || isCurrentVerifying || !isFilled}
                        className={`w-full h-[46px] rounded-xl font-mono font-bold uppercase tracking-wider text-xs transition-all duration-200 flex items-center justify-center gap-2 ${
                          isCurrentVerifying
                            ? 'bg-[#FF5738]/50 text-white cursor-wait'
                            : isFilled
                            ? 'bg-[#FF5738] hover:bg-[#FF7054] text-white shadow-md shadow-[#FF5738]/20 cursor-pointer'
                            : 'bg-white/[0.04] border border-white/[0.08] text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {isCurrentVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>ĐANG XÁC THỰC VÉ...</span>
                          </>
                        ) : (
                          <span>XÁC THỰC VÉ {t.code} →</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Global Status & Step Actions */}
      <div className="space-y-3 pt-1">
        {/* Nút hoàn tất khi tất cả vé đã xác thực */}
        {allLocked && (
          <button
            type="button"
            onClick={onComplete}
            className="w-full h-[48px] rounded-xl font-mono font-bold uppercase tracking-wider text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>TẤT CẢ VÉ ĐÃ XÁC THỰC - TIẾP TỤC →</span>
          </button>
        )}

        {/* Nút hủy phiên xác thực */}
        <div>
          <button
            type="button"
            onClick={onAbandon}
            disabled={isCancelling}
            className="text-xs text-[#8A909B] hover:text-white transition-colors font-mono cursor-pointer disabled:opacity-40"
          >
            {isCancelling ? 'Đang hủy...' : 'Hủy bỏ phiên xác thực'}
          </button>
        </div>
      </div>
    </div>
  );
};