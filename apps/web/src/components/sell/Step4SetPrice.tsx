import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, ArrowLeft, XCircle, Minus, Plus, AlertTriangle } from 'lucide-react';

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
  subStep?: 'pricing' | 'confirm';
  setSubStep?: (sub: 'pricing' | 'confirm') => void;
}

export const Step4SetPrice: React.FC<Step4SetPriceProps> = ({
  tickets,
  activeTicketIndex,
  setActiveTicketIndex,
  onUpdateTicketPrice,
  onContinue,
  onCancel,
  isCancelling = false,
}) => {
  const isCombo = tickets.length > 1;
  const [showFeeTooltip, setShowFeeTooltip] = useState<boolean>(false);

  const getTicketSellerFee = (price: number) => Math.max(Math.round(price * 0.03), 5000);

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



  // =========================================================================
  // MÀN 4.1: THIẾT LẬP GIÁ BÁN TỪNG VÉ (PRICING)
  // =========================================================================
  const currentDiff = faceValue - resalePrice;
  const currentDiscountPercent = faceValue > 0 ? Math.round((currentDiff / faceValue) * 100) : 0;
  const isCurrentDeepDiscount = resalePrice > 0 && currentDiff / faceValue >= 0.5;

  return (
    <div key="step-4-pricing" className="animate-fade-in-up max-w-xl mx-auto space-y-4 pt-1">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
          Thiết lập giá bán
        </h2>
        <p className="text-xs text-[#A3A8B3]">
          {isCombo
            ? `Đặt giá bán cho từng vé trong combo (${tickets.length} vé). Giá mỗi vé không vượt trần quy định.`
            : `Nhập giá bán bạn mong muốn (tối đa ${priceCeiling.toLocaleString('vi-VN')} VND).`}
        </p>
      </div>

      {/* Tab chọn vé khi bán Combo dạng Pills ngang gọn nhẹ */}
      {isCombo && (
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
          {tickets.map((t, idx) => {
            const isSelected = idx === activeTicketIndex;
            const hasPrice = t.resalePrice > 0;
            const isExceeded = t.resalePrice > t.priceCeiling;

            return (
              <button
                key={t.code}
                type="button"
                onClick={() => setActiveTicketIndex(idx)}
                className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF5A36]/15 border-[#FF5A36] ring-1 ring-[#FF5A36]'
                    : 'bg-[#0A0D12] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-white">Vé #{idx + 1}</span>
                  <span className={`text-[10px] font-bold ${isExceeded ? 'text-rose-400' : hasPrice ? 'text-[#FF5A36]' : 'text-zinc-500'}`}>
                    {hasPrice ? `${(t.resalePrice / 1000).toLocaleString('vi-VN')}k` : 'Chưa đặt'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono truncate">{t.code}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Card chỉnh giá của Vé đang chọn: Gõ trực tiếp lên chữ số lớn */}
      <motion.div
        key={`ticket-card-${activeTicketIndex}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-5 sm:p-6 rounded-2xl space-y-4 shadow-xl text-center hover:border-white/20 transition-all duration-300"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="text-left space-y-0.5">
            <span className="text-xs text-white font-medium block">
              {seatZone ? `Đặt giá cho vé ${seatZone} · ${code}` : `Đặt giá cho vé ${code}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#8F96A3] font-mono block">Giá gốc từ ban tổ chức</span>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {faceValue.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        {/* Ô INPUT CHỮ SỐ LỚN KÈM 2 NÚT - VÀ + TINH GỌN HAI BÊN */}
        <div className="py-2 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3.5 max-w-full">
            {/* Nút giảm (-) */}
            <button
              type="button"
              onClick={() => handleStepPrice(-10000)}
              disabled={resalePrice <= 1000}
              aria-label="Giảm 10.000 VND"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
              title="Giảm 10.000 VND"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Khối nhập số lớn ở giữa */}
            <div
              className={`inline-flex items-baseline justify-center border-b-2 transition-all duration-200 px-2 pb-1 max-w-[calc(100%-88px)] cursor-text ${
                resalePrice > priceCeiling
                  ? 'border-rose-500'
                  : 'border-white/20 hover:border-white/40 focus-within:border-[#FF5A36]'
              }`}
            >
              <input
                id="resale-price-large-input"
                type="text"
                inputMode="numeric"
                value={priceInputText}
                onChange={handlePriceInputChange}
                onFocus={(e) => e.target.select()}
                onBlur={handlePriceInputBlur}
                className={`bg-transparent text-right font-extrabold font-display tracking-tight focus:outline-none transition-all duration-150 ${
                  (priceInputText || '').length > 9
                    ? 'text-2xl sm:text-3xl'
                    : (priceInputText || '').length > 6
                    ? 'text-3xl sm:text-5xl'
                    : 'text-4xl sm:text-5xl'
                } ${resalePrice > priceCeiling ? 'text-rose-400' : 'text-white'}`}
                style={{
                  width: `${Math.max((priceInputText || '').length + 0.8, 3.5)}ch`,
                  maxWidth: '100%',
                }}
                placeholder="0"
                autoComplete="off"
              />
              <span className="text-sm sm:text-lg font-normal font-mono text-zinc-500 ml-2 select-none shrink-0">
                VND
              </span>
            </div>

            {/* Nút tăng (+) */}
            <button
              type="button"
              onClick={() => handleStepPrice(10000)}
              disabled={resalePrice >= priceCeiling}
              aria-label="Tăng 10.000 VND"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
              title={resalePrice >= priceCeiling ? 'Đã đạt giá tối đa' : 'Tăng 10.000 VND'}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Validation hint ngay dưới ô số lớn */}
          <div className="mt-2 min-h-[20px] flex flex-col items-center justify-center text-xs font-mono gap-1">
            {resalePrice > priceCeiling ? (
              <span className="text-rose-400 font-semibold">
                Vượt quá giá tối đa ({priceCeiling.toLocaleString('vi-VN')} VND)
              </span>
            ) : resalePrice < faceValue && resalePrice > 0 ? (
              <span className="text-emerald-400 font-medium">
                Rẻ hơn giá gốc {currentDiff.toLocaleString('vi-VN')}đ (khoảng {currentDiscountPercent}%)
              </span>
            ) : resalePrice === faceValue ? (
              <span className="text-zinc-400">
                Bằng đúng giá gốc từ ban tổ chức ({faceValue.toLocaleString('vi-VN')}đ)
              </span>
            ) : resalePrice > faceValue && resalePrice <= priceCeiling ? (
              <span className="text-zinc-400">
                Cao hơn giá gốc {(resalePrice - faceValue).toLocaleString('vi-VN')}đ (trong mức tối đa cho phép)
              </span>
            ) : (
              <span className="text-zinc-500">
                Tối đa: {priceCeiling.toLocaleString('vi-VN')} VND
              </span>
            )}

            {/* Cảnh báo vàng nếu người bán đặt giá giảm sâu hơn 50% */}
            <AnimatePresence>
              {isCurrentDeepDiscount && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-amber-300 text-[11px] font-mono inline-flex items-center gap-1.5 mt-0.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Giá thấp hơn giá gốc {currentDiscountPercent}%, bạn có chắc chắn không?</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Discount Presets: Gợi ý giá nhanh 1 hàng */}
        <div className="space-y-1.5 pt-1">
          <div className={`grid gap-2 text-xs font-mono ${priceCeiling > faceValue ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-4'}`}>
            <button
              type="button"
              onClick={() => handleApplyDiscount(5)}
              className={`py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                resalePrice === Math.round(faceValue * 0.95)
                  ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-sm'
                  : 'bg-[#05070A] border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
              }`}
            >
              Giảm 5%
            </button>

            <button
              type="button"
              onClick={() => handleApplyDiscount(10)}
              className={`py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                resalePrice === Math.round(faceValue * 0.9)
                  ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-sm'
                  : 'bg-[#05070A] border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
              }`}
            >
              Giảm 10%
            </button>

            <button
              type="button"
              onClick={() => handleApplyDiscount(15)}
              className={`py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                resalePrice === Math.round(faceValue * 0.85)
                  ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-sm'
                  : 'bg-[#05070A] border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
              }`}
            >
              Giảm 15%
            </button>

            <button
              type="button"
              onClick={() => handleApplyDiscount(0)}
              className={`py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                resalePrice === faceValue
                  ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-sm'
                  : 'bg-[#05070A] border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
              }`}
            >
              Giá gốc
            </button>

            {priceCeiling > faceValue && (
              <button
                type="button"
                onClick={() => updateCurrentPrice(priceCeiling)}
                className={`py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                  resalePrice === priceCeiling
                    ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-sm'
                    : 'bg-[#05070A] border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
                }`}
              >
                Giá tối đa
              </button>
            )}
          </div>
        </div>

        {/* ĐỐI VỚI VÉ ĐƠN (1 VÉ): Hiển thị chi tiết thanh toán nhỏ gọn ngay tại đây */}
        {!isCombo && (
          <div className="p-3.5 sm:p-4 bg-[#080B11]/90 backdrop-blur-sm border border-emerald-500/20 rounded-xl space-y-2 text-left relative">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bạn sẽ nhận được</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                3% phí dịch vụ
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Giá bán:</span>
                <div>
                  <span className="font-bold text-white tabular-nums">
                    + {resalePrice.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">VND</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-zinc-400 relative">
                <div className="flex items-center gap-1.5">
                  <span>Phí nền tảng (3%):</span>
                  <button
                    type="button"
                    onClick={() => setShowFeeTooltip(!showFeeTooltip)}
                    className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                    title="Thông tin phí nền tảng"
                  >
                    ?
                  </button>
                  <AnimatePresence>
                    {showFeeTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-full mt-1.5 w-72 p-3 bg-[#0E131F] border border-white/20 rounded-xl shadow-2xl text-[11px] text-zinc-200 z-50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-bold text-white pb-1 border-b border-white/10">
                          <span>Phí nền tảng người bán (3%)</span>
                          <button
                            type="button"
                            onClick={() => setShowFeeTooltip(false)}
                            className="text-zinc-400 hover:text-white cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-sans">
                          Phí nền tảng 3% được khấu trừ tự động khi vé bán thành công, dùng để duy trì hệ thống bảo vệ giao dịch và đối soát vé với Ban tổ chức (tối thiểu 5.000đ/vé).
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <span className="text-amber-400 tabular-nums">
                    - {totalSellerFee.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">VND</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-emerald-400 font-mono">
                Bạn nhận về:
              </span>
              <div className="text-right">
                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                  {totalYouReceive.toLocaleString('vi-VN')}
                </span>
                <span className="ml-1 text-xs font-normal text-zinc-500 font-mono">VND</span>
              </div>
            </div>
          </div>
        )}

        {/* Nút điều hướng chuyển vé hoặc Tiếp tục sang Chốt giá / Step 5 */}
        <div className="space-y-2 pt-2">
          {isCombo ? (
            activeTicketIndex < tickets.length - 1 ? (
              <div className="flex items-center gap-3">
                {activeTicketIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTicketIndex(activeTicketIndex - 1)}
                    className="px-4 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer font-mono text-xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Vé #{activeTicketIndex}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTicketIndex(activeTicketIndex + 1)}
                  disabled={!isCurrentTicketValid}
                  className={`flex-1 py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isCurrentTicketValid
                      ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 cursor-pointer'
                  }`}
                >
                  <span>Tiếp tục, đặt giá vé {activeTicketIndex + 2}/{tickets.length}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {activeTicketIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTicketIndex(activeTicketIndex - 1)}
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
                  <span>Tiếp tục: Xem lại &amp; Xuất bản tin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={onContinue}
              disabled={!allTicketsValid}
              className={`w-full py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                !allTicketsValid
                  ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed opacity-50'
                  : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
              }`}
            >
              <span>Tiếp tục: Xem lại &amp; Xuất bản tin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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
                <span>{isCancelling ? 'Đang hủy...' : 'Không bán nữa'}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

