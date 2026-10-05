import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, XCircle } from 'lucide-react';

export interface TicketPriceItem {
  code: string;
  originalPrice: number;
  markupPercent: number;
  priceCeiling: number;
  resalePrice: number;
  seatZone?: string;
}

export interface Step4SetPriceProps {
  tickets: TicketPriceItem[];
  activeTicketIndex: number;
  setActiveTicketIndex: (index: number) => void;
  onUpdateTicketPrice: (code: string, newPrice: number) => void;
  onContinue: () => void;
  onCancel?: () => void;
  isCancelling?: boolean;
  saleType?: 'combo' | 'individual';
  setSaleType?: (type: 'combo' | 'individual') => void;
}

export const Step4SetPrice: React.FC<Step4SetPriceProps> = ({
  tickets,
  activeTicketIndex,
  setActiveTicketIndex,
  onUpdateTicketPrice,
  onContinue,
  onCancel,
  isCancelling = false,
  saleType = 'combo',
  setSaleType,
}) => {
  const isCombo = tickets.length > 1;
  const currentTicket = tickets[activeTicketIndex] || tickets[0] || {
    code: '',
    originalPrice: 0,
    markupPercent: 0,
    priceCeiling: 0,
    resalePrice: 0,
  };

  const {
    code,
    originalPrice: faceValue,
    markupPercent,
    priceCeiling,
    resalePrice,
    seatZone,
  } = currentTicket;

  const [priceInputText, setPriceInputText] = useState<string>(
    resalePrice > 0 ? resalePrice.toLocaleString('vi-VN') : ''
  );

  useEffect(() => {
    setPriceInputText(resalePrice > 0 ? resalePrice.toLocaleString('vi-VN') : '');
  }, [code, resalePrice]);

  const updateCurrentPrice = (val: number) => {
    const clamped = Math.max(0, Math.min(val, priceCeiling));
    onUpdateTicketPrice(code, clamped);
    setPriceInputText(clamped > 0 ? clamped.toLocaleString('vi-VN') : '');
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const oldVal = input.value;
    const oldPos = input.selectionStart || 0;

    const digitsBeforeCursor = oldVal.slice(0, oldPos).replace(/\D/g, '').length;
    const raw = oldVal.replace(/\D/g, '');

    if (raw === '') {
      setPriceInputText('');
      onUpdateTicketPrice(code, 0);
      return;
    }

    if (raw.length > 11) return;

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const formatted = parsed.toLocaleString('vi-VN');
      onUpdateTicketPrice(code, parsed);
      setPriceInputText(formatted);

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
    if (resalePrice <= 0) {
      updateCurrentPrice(faceValue > 0 ? faceValue : 1000);
    } else if (resalePrice > priceCeiling) {
      updateCurrentPrice(priceCeiling);
    }
  };

  const handleStepPrice = (delta: number) => {
    const next = resalePrice + delta;
    if (next <= 0) {
      updateCurrentPrice(0);
    } else if (delta > 0 && next > priceCeiling) {
      updateCurrentPrice(priceCeiling);
    } else {
      updateCurrentPrice(next);
    }
  };

  const handleApplyDiscount = (percent: number) => {
    if (percent === 0) {
      updateCurrentPrice(faceValue);
    } else {
      const factor = (100 - percent) / 100;
      const discounted = Math.round((faceValue * factor) / 1000) * 1000;
      updateCurrentPrice(discounted);
    }
  };

  const totalComboPrice = tickets.reduce((sum, t) => sum + (t.resalePrice || 0), 0);
  const totalSellerFee = Math.max(Math.round(totalComboPrice * 0.03), 5000 * tickets.length);
  const totalYouReceive = Math.max(totalComboPrice - totalSellerFee, 0);

  const allTicketsValid = tickets.every((t) => t.resalePrice > 0 && t.resalePrice <= t.priceCeiling);
  const isCurrentTicketValid = resalePrice > 0 && resalePrice <= priceCeiling;

  return (
    <div key={4} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-2">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-extrabold font-display text-white">
          Set Resale Price
        </h2>
        <p className="text-xs text-[#A3A8B3]">
          {isCombo
            ? `Chỉnh giá bán cho từng vé trong combo (${tickets.length} vé). Giá từng vé không vượt trần của vé đó.`
            : `Slide or type a price up to the event ceiling (${priceCeiling.toLocaleString('vi-VN')} VND${markupPercent > 0 ? `, face value + ${markupPercent}%` : ''}).`}
        </p>
      </div>

      {/* Lựa chọn hình thức bán: Bán trọn gói Combo vs Bán lẻ từng vé */}
      {isCombo && (
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#0A0D14] border border-white/10 space-y-2.5 text-left">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display">
            <span>Hình thức đăng bán ({tickets.length} vé)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Option 1: Combo trọn gói (Buộc mua theo cặp/gói) */}
            <button
              type="button"
              onClick={() => setSaleType?.('combo')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                saleType === 'combo'
                  ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white ring-1 ring-[#FF5A36]/40'
                  : 'bg-[#05070A] border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white">Bán trọn gói (Buộc mua cả cặp)</span>
                {saleType === 'combo' && (
                  <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                )}
              </div>
              <p className="text-[11px] text-[#8F96A3] leading-relaxed">
                Người mua bắt buộc thanh toán trọn bộ cả {tickets.length} vé cùng lúc. Không có phần tick chọn từng vé.
              </p>
            </button>

            {/* Option 2: Cho phép mua lẻ (Không buộc theo cặp) */}
            <button
              type="button"
              onClick={() => setSaleType?.('individual')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                saleType === 'individual'
                  ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white ring-1 ring-[#FF5A36]/40'
                  : 'bg-[#05070A] border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white">Cho phép mua lẻ (Không buộc theo cặp)</span>
                {saleType === 'individual' && (
                  <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                )}
              </div>
              <p className="text-[11px] text-[#8F96A3] leading-relaxed">
                Vẫn hiển thị chung 1 tin đăng trên sàn. Người mua khi vào xem có thể tick chọn mua từng vé lẻ hoặc tick 'Chọn tất cả'.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Tách trang / Tab chọn vé khi bán Combo */}
      {isCombo && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-[#A3A8B3] px-1">
            <span className="font-semibold text-white">
              Đang chỉnh vé {activeTicketIndex + 1} / {tickets.length}:
            </span>
            <span className="text-[11px] text-[#FF5A36] font-bold">
              {code}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tickets.map((t, idx) => {
              const isSelected = idx === activeTicketIndex;
              const hasPrice = t.resalePrice > 0;
              const isExceeded = t.resalePrice > t.priceCeiling;

              return (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => setActiveTicketIndex(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5A36]/15 border-[#FF5A36] shadow-lg shadow-[#FF5A36]/20 ring-1 ring-[#FF5A36]'
                      : 'bg-[#0A0D12] border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-bold text-white truncate">
                      Vé #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isExceeded
                          ? 'bg-rose-500/20 text-rose-300'
                          : hasPrice
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isExceeded ? 'Vượt trần' : hasPrice ? 'Đã đặt' : 'Chưa đặt'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#8F96A3] truncate mb-1">
                    {t.code}
                  </div>
                  <div className="font-mono text-sm font-extrabold text-[#FF5A36]">
                    {t.resalePrice > 0 ? `${t.resalePrice.toLocaleString('vi-VN')} đ` : 'Chưa đặt'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Card chỉnh giá của Vé đang chọn */}
      <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-center hover:border-white/20 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="text-left space-y-0.5">
            <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-mono font-bold block">
              {isCombo ? `Giá bán vé ${code}` : 'Proposed Resale Price'}
            </span>
            {seatZone && (
              <span className="text-[11px] font-mono text-[#8F96A3] block">
                {seatZone}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#8F96A3] font-mono block">Giá gốc (Face Value)</span>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {faceValue.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        <div className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight flex items-center justify-center gap-2 transition-all duration-300">
          <span className="transition-all duration-300">
            {resalePrice > 0 ? resalePrice.toLocaleString('vi-VN') : '0'}
          </span>
          <span className="text-base font-normal text-[#FF5A36]">VND</span>
        </div>

        {/* Slider */}
        <div className="space-y-2 text-left">
          <label htmlFor="resale-price-slider" className="sr-only">
            Resale price within the event ceiling
          </label>
          <input
            id="resale-price-slider"
            type="range"
            min={1000}
            max={Math.max(priceCeiling, 1000)}
            step={1000}
            value={Math.min(Math.max(Math.round((resalePrice || 1000) / 1000) * 1000, 1000), Math.max(priceCeiling, 1000))}
            onChange={(e) => updateCurrentPrice(Number(e.target.value))}
            aria-valuemin={1000}
            aria-valuemax={priceCeiling}
            aria-valuenow={resalePrice}
            className="w-full h-2 appearance-none rounded-full cursor-pointer bg-white/10 accent-[#FF5A36]"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8F96A3]">
            <span>Min 1.000 đ</span>
            <span>Trần tối đa {priceCeiling.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Manual Price Input */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left shrink-0">
              <span className="text-[10px] text-[#A3A8B3] font-mono uppercase tracking-wider whitespace-nowrap font-semibold">
                Custom Price (VND)
              </span>
              <span className="text-[9px] text-[#8F96A3] font-mono whitespace-nowrap">
                (Tối đa: {priceCeiling.toLocaleString('vi-VN')} đ)
              </span>
            </div>

            <div className="flex items-center flex-1 gap-2">
              <div className="relative flex-1 group/input">
                <input
                  id="resale-price-input"
                  type="text"
                  inputMode="numeric"
                  value={priceInputText}
                  onChange={handlePriceInputChange}
                  onFocus={(e) => e.target.select()}
                  onBlur={handlePriceInputBlur}
                  className={`w-full bg-[#05070A] border rounded-xl pl-3 pr-14 py-2.5 text-sm font-mono font-bold text-white tracking-wider text-right focus:outline-none transition-all duration-200 ${
                    resalePrice > priceCeiling
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30'
                      : 'border-white/15 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/30 group-hover/input:border-white/25'
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#FF5A36] font-bold pointer-events-none">
                  VND
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleStepPrice(-10000)}
                disabled={resalePrice <= 0}
                className={`w-10 h-10 shrink-0 rounded-xl bg-[#05070A] border transition-all duration-150 flex items-center justify-center font-bold text-lg leading-none ${
                  resalePrice <= 0
                    ? 'border-white/5 text-white/20 cursor-not-allowed opacity-40'
                    : 'border-white/10 text-white hover:border-[#FF5A36] hover:text-[#FF5A36] hover:bg-[#FF5A36]/10 active:scale-95 cursor-pointer'
                }`}
                title="Giảm 10.000 VND"
              >
                −
              </button>

              <button
                type="button"
                onClick={() => handleStepPrice(10000)}
                disabled={resalePrice >= priceCeiling}
                className={`w-10 h-10 shrink-0 rounded-xl bg-[#05070A] border transition-all duration-150 flex items-center justify-center font-bold text-lg leading-none ${
                  resalePrice >= priceCeiling
                    ? 'border-white/5 text-white/20 cursor-not-allowed opacity-40'
                    : 'border-white/10 text-white hover:border-[#FF5A36] hover:text-[#FF5A36] hover:bg-[#FF5A36]/10 active:scale-95 cursor-pointer'
                }`}
                title={resalePrice >= priceCeiling ? 'Đã đạt trần giá của sự kiện' : 'Tăng 10.000 VND'}
              >
                +
              </button>
            </div>
          </div>

          {/* Validation hint */}
          <div className="min-h-[20px] flex items-center justify-end text-[10px] font-mono">
            {resalePrice > priceCeiling && (
              <span className="text-rose-400 font-semibold">
                Vượt quá giá trần của vé này ({priceCeiling.toLocaleString('vi-VN')} VND)
              </span>
            )}
            {resalePrice < faceValue && resalePrice > 0 && (
              <span className="text-emerald-400">
                {(faceValue - resalePrice).toLocaleString('vi-VN')} VND ({Math.round((1 - resalePrice / faceValue) * 100)}%) dưới giá gốc
              </span>
            )}
            {resalePrice === faceValue && (
              <span className="text-[#A3A8B3]">
                Bằng đúng giá gốc ({faceValue.toLocaleString('vi-VN')} VND)
              </span>
            )}
            {resalePrice > faceValue && resalePrice <= priceCeiling && (
              <span className="text-[#A3A8B3]">
                {(resalePrice - faceValue).toLocaleString('vi-VN')} VND cao hơn giá gốc (trong trần {markupPercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Quick Discount Presets */}
        <div className="space-y-2">
          <span className="text-[11px] text-[#A3A8B3]">Gợi ý giá nhanh:</span>
          <div className={`grid gap-2 text-xs font-mono ${priceCeiling > faceValue ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-4'}`}>
            <button
              type="button"
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
              type="button"
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
              type="button"
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
              type="button"
              onClick={() => handleApplyDiscount(0)}
              className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                resalePrice === faceValue
                  ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                  : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
              }`}
            >
              Giá gốc
            </button>

            {priceCeiling > faceValue && (
              <button
                type="button"
                onClick={() => updateCurrentPrice(priceCeiling)}
                className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                  resalePrice === priceCeiling
                    ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                    : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                }`}
              >
                Giá trần
              </button>
            )}
          </div>
        </div>

        {/* Tổng kết cả gói / Fee Breakdown Box */}
        <div className="p-4 sm:p-5 bg-[#080B11]/90 backdrop-blur-sm border border-emerald-500/25 rounded-2xl space-y-3 shadow-lg text-left">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isCombo ? 'Tổng kết gói Combo' : 'Chi tiết phí'}</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              3% Phí người bán
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {isCombo ? (
              <>
                <div className="space-y-1.5 pb-2 border-b border-white/5">
                  {tickets.map((t, idx) => (
                    <div key={t.code} className="flex justify-between items-center text-zinc-400 text-[11px]">
                      <span>Vé #{idx + 1} ({t.code}):</span>
                      <span className="font-semibold text-zinc-200 tabular-nums">
                        {t.resalePrice > 0 ? `${t.resalePrice.toLocaleString('vi-VN')} VND` : 'Chưa đặt'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-zinc-300 font-bold">
                  <span>Tổng giá bán cả gói ({tickets.length} vé):</span>
                  <span className="text-[#FF5A36] tabular-nums text-sm">
                    {totalComboPrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Tổng phí dịch vụ (3%):</span>
                  <span className="text-amber-400 tabular-nums">
                    - {totalSellerFee.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Giá niêm yết:</span>
                  <span className="font-semibold text-zinc-200 tabular-nums">
                    {resalePrice.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Phí dịch vụ (3%):</span>
                  <span className="font-medium text-amber-400 tabular-nums">
                    - {Math.max(Math.round(resalePrice * 0.03), 5000).toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-baseline pt-2.5 border-t border-white/10">
            <div>
              <span className="text-xs font-bold text-emerald-400 block font-mono">
                Số tiền bạn thực nhận
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                (Tự động chuyển về STK ngân hàng sau khi kết thúc ký quỹ)
              </span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                {totalYouReceive.toLocaleString('vi-VN')}
              </span>
              <span className="ml-1 text-xs font-bold text-emerald-400">VND</span>
            </div>
          </div>
        </div>

        {/* Nút điều hướng chuyển vé hoặc Tiếp tục sang Step 5 */}
        <div className="space-y-2 pt-2">
          {isCombo && activeTicketIndex < tickets.length - 1 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTicketIndex(activeTicketIndex + 1)}
                disabled={!isCurrentTicketValid}
                className={`w-full py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isCurrentTicketValid
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed opacity-50'
                    : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 cursor-pointer'
                }`}
              >
                <span>Sang chỉnh vé tiếp theo (#{activeTicketIndex + 2})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {isCombo && (
                <button
                  type="button"
                  onClick={() => setActiveTicketIndex(Math.max(0, activeTicketIndex - 1))}
                  className="px-4 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer font-mono text-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Vé #{activeTicketIndex}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onContinue}
                disabled={!allTicketsValid}
                className={`flex-1 py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  !allTicketsValid
                    ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed opacity-50'
                    : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                }`}
              >
                <span>{isCombo ? 'Tiếp tục sang Bước 5' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nút hủy phiên mở khóa vé ở Bước 4 */}
          {onCancel && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isCancelling}
                className="text-xs sm:text-sm font-medium text-white/50 hover:text-rose-400 transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-30 py-1.5 px-3 rounded-lg hover:bg-rose-500/10 hover:border hover:border-rose-500/20"
              >
                <XCircle className="w-4 h-4" />
                <span>{isCancelling ? 'Đang hủy...' : 'Hủy đăng bán & mở khóa vé'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
