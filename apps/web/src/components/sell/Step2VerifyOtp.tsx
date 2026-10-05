import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Loader2,
  Ticket,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Lock,
  X,
} from 'lucide-react';
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
  /** Hủy / gỡ 1 vé đơn lẻ khỏi danh sách xác thực */
  onRemoveTicket?: (code: string) => Promise<void>;
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
  onRemoveTicket,
  isVerifying,
  resendingCode,
  isCancelling,
}) => {
  const [digits, setDigits] = useState<Record<string, string[]>>({});
  const [now, setNow] = useState(() => Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [verifyingCode, setVerifyingCode] = useState<string | null>(null);
  const [removingCode, setRemovingCode] = useState<string | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Đồng bộ danh sách ô nhập OTP cho từng vé
  useEffect(() => {
    setDigits((prev) => {
      const next: Record<string, string[]> = {};
      for (const t of tickets) {
        next[t.code] = prev[t.code] ?? emptyDigits();
      }
      return next;
    });
  }, [tickets]);

  // Bộ đếm thời gian thực
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

  // Focus ô đầu tiên của vé đang chọn khi chuyển thẻ
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

  if (!current) return null;

  return (
    <div className="max-w-[500px] mx-auto space-y-4 pt-1 font-sans text-center">
      {/* Tiêu đề trang */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Xác thực vé
        </h2>
        <p className="text-xs sm:text-sm text-[#8A909B] max-w-sm mx-auto leading-relaxed">
          Nhập mã OTP 6 số để xác thực quyền sở hữu vé chính chủ từ Ban tổ chức.
        </p>
      </div>

      {/* Thẻ OTP dạng So Le (Staggered Tabs) */}
      <div className="pt-1">
        <CardStack
          items={tickets.map((t) => ({ id: t.code, ...t }))}
          activeIndex={safePage}
          onActiveIndexChange={setPage}
          layoutMode="staggered"
          offset={42}
          containerHeight={`${(tickets.length - 1) * 42 + 245}px`}
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
                    ? t.locked
                      ? 'bg-[#0A0D14] border border-emerald-500/40 shadow-2xl shadow-black/90 ring-1 ring-emerald-500/20'
                      : 'bg-[#0D121B] border border-white/20 shadow-2xl shadow-black/90 ring-1 ring-white/10'
                    : 'bg-[#04060A] border border-white/[0.08] shadow-md shadow-black/60'
                }`}
              >
                {/* Header thẻ: Phân biệt rõ rệt độ sáng/tối giữa thẻ trước và thẻ sau */}
                <div
                  className={`h-[44px] px-4 sm:px-5 flex items-center justify-between border-b ${
                    isTop
                      ? 'border-white/10 bg-[#0D121B]'
                      : 'border-white/[0.06] bg-[#04060A] cursor-pointer hover:bg-white/[0.04]'
                  }`}
                  onClick={() => {
                    if (!isTop) setPage(originalIndex);
                  }}
                >
                  {/* Cột trái: Biểu tượng + Mã vé */}
                  <div className="flex items-center gap-2">
                    {t.locked ? (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isTop ? 'text-emerald-400' : 'text-emerald-500/60'
                        }`}
                      />
                    ) : (
                      <Ticket
                        className={`w-4 h-4 shrink-0 ${
                          isTop ? 'text-[#FF5A36]' : 'text-white/30'
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs ${
                        isTop ? 'text-white/70' : 'text-white/40'
                      }`}
                    >
                      Vé {originalIndex + 1}:
                    </span>
                    <span
                      className={`text-sm tracking-wide ${
                        isTop ? 'font-bold text-white' : 'font-medium text-white/60'
                      }`}
                    >
                      {t.code}
                    </span>
                  </div>

                  {/* Cột phải: Thông tin trạng thái + Nút gỡ riêng vé này */}
                  <div className="flex items-center gap-2">
                    {t.locked ? (
                      <span
                        className={`text-xs font-medium ${
                          isTop ? 'text-emerald-400' : 'text-emerald-500/60'
                        }`}
                      >
                        Đã xác thực
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-mono font-medium ${
                          isTop
                            ? isExpired
                              ? 'text-rose-400'
                              : tLeft <= 60
                              ? 'text-rose-400 animate-pulse'
                              : 'text-[#FF5A36]'
                            : 'text-white/40'
                        }`}
                      >
                        {isExpired ? 'Hết hạn' : formatTimer(tLeft)}
                      </span>
                    )}

                    {/* Nút gỡ vé này (chỉ hiện khi có từ 2 vé trở lên) */}
                    {tickets.length > 1 && onRemoveTicket && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (removingCode || isCancelling) return;
                          setRemovingCode(t.code);
                          try {
                            await onRemoveTicket(t.code);
                          } finally {
                            setRemovingCode(null);
                          }
                        }}
                        disabled={removingCode === t.code || isCancelling}
                        className="p-1 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        title={`Gỡ vé ${t.code} khỏi danh sách bán`}
                      >
                        {removingCode === t.code ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Thân thẻ vé */}
                <div
                  className={`p-4 sm:p-5 space-y-3 bg-[#0A0D14] ${
                    !isTop ? 'pointer-events-none opacity-0 select-none h-0 p-0 overflow-hidden' : ''
                  }`}
                >
                  {/* 6 ô nhập OTP */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
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
                          readOnly={t.locked}
                          tabIndex={isTop && !t.locked ? 0 : -1}
                          onChange={(e) => handleDigitChange(t.code, slot, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(t.code, slot, e)}
                          onPaste={(e) => handlePaste(t.code, e)}
                          className={`w-[42px] h-[48px] sm:w-[46px] sm:h-[50px] border rounded-xl text-center font-mono font-bold text-lg sm:text-xl transition-all duration-150 focus:outline-none ${
                            t.locked
                              ? 'border-white/10 bg-[#05070A] text-emerald-400 cursor-not-allowed select-none opacity-90'
                              : digit
                              ? 'border-[#FF5A36] bg-[#FF5A36]/5 text-white ring-1 ring-[#FF5A36]/30'
                              : 'border-white/10 bg-[#05070A] text-white focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36]/30'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Dòng gửi lại OTP (chỉ hiện khi vé CHƯA xác thực, bỏ hoàn toàn text thuyết minh rác) */}
                    {!t.locked && (
                      <div className="flex items-center justify-between text-xs px-1 text-[#8A909B]">
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
                          className="text-[#FF5A36] hover:underline font-semibold disabled:opacity-40 transition-colors cursor-pointer"
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
                    )}
                  </div>

                  {/* Thông báo lỗi nếu có */}
                  {errorMsg && (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 text-center">
                      {errorMsg}
                    </div>
                  )}

                  {/* Nút hành động */}
                  <div>
                    {t.locked ? (
                      allLocked ? (
                        <button
                          type="button"
                          onClick={onComplete}
                          className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#FF5A36] hover:bg-[#FF7252] shadow-lg shadow-[#FF5A36]/30 transition-all cursor-pointer active:scale-[0.99]"
                        >
                          Tiếp tục bước tiếp theo →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const nextIdx = tickets.findIndex((item) => !item.locked);
                            if (nextIdx !== -1) setPage(nextIdx);
                          }}
                          className="w-full h-10 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                        >
                          Chuyển sang vé chưa xác thực →
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerifyOneTicket(t)}
                        disabled={!isTop || isCurrentVerifying || !isFilled}
                        className={`w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                          isCurrentVerifying
                            ? 'bg-[#FF5A36]/60 text-white cursor-wait'
                            : isFilled
                            ? 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 active:scale-[0.99]'
                            : 'bg-white/[0.04] border border-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {isCurrentVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang xác thực...</span>
                          </>
                        ) : (
                          <span>Xác thực vé {t.code} →</span>
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

      {/* Dấu mũi tên & Paging trực quan rõ ràng, có khoảng đệm thoải mái */}
      {tickets.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          {/* Mũi tên lùi vé trước */}
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={safePage === 0}
            aria-label="Vé trước"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/15 bg-[#0A0D14] hover:bg-white/[0.08] hover:border-white/25 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Cụm Paging: Vé X/Y + Dots rõ ràng, to và dễ nhìn */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#0A0D14] border border-white/15 text-sm font-semibold text-white/90 shadow-sm">
            <span className="tracking-wide">
              Vé {safePage + 1}/{tickets.length}
            </span>
            <div className="flex items-center gap-2 pl-1">
              {tickets.map((t, idx) => {
                const isActive = idx === safePage;
                const isLocked = t.locked;

                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setPage(idx)}
                    className={`transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'w-6 h-2 rounded-full bg-[#FF5A36] shadow-sm shadow-[#FF5A36]/40'
                        : isLocked
                        ? 'w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40'
                        : 'w-2 h-2 rounded-full bg-white/30 hover:bg-white/50'
                    }`}
                    title={`Vé ${idx + 1}: ${t.code}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Mũi tên tiến vé kế tiếp */}
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(tickets.length - 1, prev + 1))}
            disabled={safePage === tickets.length - 1}
            aria-label="Vé kế tiếp"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/15 bg-[#0A0D14] hover:bg-white/[0.08] hover:border-white/25 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* Nút hủy phiên: Đặt thoáng đãng, to rõ ràng hơn */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onAbandon}
          disabled={isCancelling}
          className="text-sm font-medium text-white/50 hover:text-rose-400 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-30 py-1.5 px-3 rounded-lg hover:bg-rose-500/10 hover:border hover:border-rose-500/20"
        >
          <XCircle className="w-4 h-4" />
          <span>{isCancelling ? 'Đang hủy...' : 'Hủy phiên xác thực'}</span>
        </button>
      </div>
    </div>
  );
};