import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowRight, ArrowLeft, XCircle, Minus, Plus, AlertTriangle } from 'lucide-react';
import { useResaleFeeConfig } from '../../hooks/useResaleFeeConfig';

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
  const { sellerFeePercent, minSellerFee, calcSellerFee } = useResaleFeeConfig();

  const getTicketSellerFee = (price: number) => calcSellerFee(price).sellerFee;

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
    resalePrice > 0 ? resalePrice.toLocaleString('en-US') : ''
  );

  useEffect(() => {
    setPriceInputText(resalePrice > 0 ? resalePrice.toLocaleString('en-US') : '');
  }, [code, resalePrice]);

  const updateCurrentPrice = (val: number) => {
    const raw = Math.max(0, val);
    onUpdateTicketPrice(code, raw);
    setPriceInputText(raw > 0 ? raw.toLocaleString('en-US') : '');
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
      const formatted = parsed.toLocaleString('en-US');
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
    // Không tự động ép giá về giá trần hoặc giá gốc khi blur ra ngoài.
    // Nếu giá <= 0 hoặc vượt trần (> priceCeiling), giữ nguyên để hiển thị cảnh báo đỏ và vô hiệu hóa nút Tiếp tục.
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
  const totalSellerFee = tickets.reduce((sum, t) => sum + getTicketSellerFee(t.resalePrice || 0), 0);
  const totalYouReceive = Math.max(totalComboPrice - totalSellerFee, 0);

  const isMinFeeApplied = isCombo
    ? tickets.some((t) => calcSellerFee(t.resalePrice || 0).isMinimumApplied)
    : (resalePrice > 0 && calcSellerFee(resalePrice).isMinimumApplied);

  const allTicketsValid = tickets.every((t) => t.resalePrice > 0 && t.resalePrice <= t.priceCeiling);
  const isCurrentTicketValid = resalePrice > 0 && resalePrice <= priceCeiling;



  // =========================================================================
  // MÀN 4.1: THIẾT LẬP GIÁ BÁN TỪNG VÉ (PRICING)
  // =========================================================================
  const currentDiff = faceValue - resalePrice;
  const currentDiscountPercent = faceValue > 0 ? Math.round((currentDiff / faceValue) * 100) : 0;
  const isCurrentDeepDiscount = resalePrice > 0 && currentDiff / faceValue >= 0.7;

  return (
    <div key="step-4-pricing" className="animate-fade-in-up max-w-xl mx-auto space-y-4 pt-1">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
          Set Resale Price
        </h2>
        <p className="text-xs text-[#A3A8B3]">
          {isCombo
            ? `Set the resale price for each ticket in the combo (${tickets.length} tickets). Prices cannot exceed the organizer price cap.`
            : `Enter your desired resale price (maximum ${priceCeiling.toLocaleString('en-US')} ₫).`}
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
                  <span className="font-bold text-white">Ticket #{idx + 1}</span>
                  <span className={`text-[10px] font-bold ${isExceeded ? 'text-rose-400' : hasPrice ? 'text-[#FF5A36]' : 'text-zinc-500'}`}>
                    {isExceeded ? 'Exceeds cap' : hasPrice ? `${(t.resalePrice / 1000).toLocaleString('en-US')}k` : 'Not set'}
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
              {seatZone ? `Set price for ${seatZone} · ${code}` : `Set price for ${code}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#8F96A3] font-mono block">Organizer Face Value</span>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {faceValue.toLocaleString('en-US')} ₫
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
              aria-label="Decrease 10,000 ₫"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
              title="Decrease 10,000 ₫"
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
                ₫
              </span>
            </div>

            {/* Nút tăng (+) */}
            <button
              type="button"
              onClick={() => handleStepPrice(10000)}
              disabled={resalePrice >= priceCeiling}
              aria-label="Increase 10,000 ₫"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-sm"
              title={resalePrice >= priceCeiling ? 'Maximum cap reached' : 'Increase 10,000 ₫'}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Validation hint ngay dưới ô số lớn */}
          <div className="mt-2 min-h-[20px] flex flex-col items-center justify-center text-xs font-mono gap-1">
            {resalePrice > priceCeiling ? (
              <span className="text-rose-400 font-semibold">
                Exceeds maximum price cap ({priceCeiling.toLocaleString('en-US')} ₫)
              </span>
            ) : resalePrice < faceValue && resalePrice > 0 ? (
              <span className="text-emerald-400 font-medium">
                {currentDiscountPercent}% below face value (-{currentDiff.toLocaleString('en-US')} ₫)
              </span>
            ) : resalePrice === faceValue ? (
              <span className="text-zinc-400">
                Equal to organizer face value ({faceValue.toLocaleString('en-US')} ₫)
              </span>
            ) : resalePrice > faceValue && resalePrice <= priceCeiling ? (
              <span className="text-zinc-400">
                +{(resalePrice - faceValue).toLocaleString('en-US')} ₫ above face value (within allowed cap)
              </span>
            ) : (
              <span className="text-zinc-500">
                Max cap: {priceCeiling.toLocaleString('en-US')} ₫
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
                  <span>Price is {currentDiscountPercent}% below face value. Are you sure?</span>
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
              5% Off
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
              10% Off
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
              15% Off
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
              Face Value
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
                Max Cap
              </button>
            )}
          </div>
        </div>

        {/* ĐỐI VỚI VÉ ĐƠN (1 VÉ): Hiển thị chi tiết thanh toán nhỏ gọn ngay tại đây */}
        {!isCombo && (
          <div className="p-3.5 sm:p-4 bg-[#080B11]/90 backdrop-blur-sm border border-emerald-500/20 rounded-xl space-y-2 text-left relative">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>You'll Receive</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {isMinFeeApplied ? `Min platform fee (${minSellerFee.toLocaleString('en-US')} ₫)` : `${sellerFeePercent}% seller fee`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Listing Price:</span>
                <div>
                  <span className="font-bold text-white tabular-nums">
                    + {resalePrice.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">₫</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-zinc-400 relative">
                <div className="flex items-center gap-1.5">
                  <span>Platform fee {isMinFeeApplied ? '(Minimum)' : `(${sellerFeePercent}%)`}:</span>
                  <button
                    type="button"
                    onClick={() => setShowFeeTooltip(!showFeeTooltip)}
                    className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                    title="Platform fee details"
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
                          <span>Seller Platform Fee ({sellerFeePercent}%)</span>
                          <button
                            type="button"
                            onClick={() => setShowFeeTooltip(false)}
                            className="text-zinc-400 hover:text-white cursor-pointer text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-zinc-300 leading-relaxed font-sans">
                          A {sellerFeePercent}% platform fee is automatically deducted upon successful sale to support secure transfers and organizer reconciliation (minimum {minSellerFee.toLocaleString('en-US')} ₫/ticket).
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <span className="text-amber-400 tabular-nums">
                    - {totalSellerFee.toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">₫</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-emerald-400 font-mono">
                Net Payout:
              </span>
              <div className="text-right">
                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                  {totalYouReceive.toLocaleString('en-US')}
                </span>
                <span className="ml-1 text-xs font-normal text-zinc-500 font-mono">₫</span>
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
                    <span>Ticket #{activeTicketIndex}</span>
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
                  <span>Next: Set price for Ticket {activeTicketIndex + 2}/{tickets.length}</span>
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
                    <span>Ticket #{activeTicketIndex}</span>
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
                  <span>Continue: Review &amp; Publish</span>
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
              <span>Continue: Review &amp; Publish</span>
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
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Listing'}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

