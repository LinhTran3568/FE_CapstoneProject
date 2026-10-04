import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface Step4SetPriceProps {
  priceCeiling: number;
  /** Giá gốc của MỘT vé (đã chia trung bình khi bán gói). */
  faceValue: number;
  /** Số vé trong gói. 1 = bán đơn lẻ. */
  ticketCount: number;
  markupPercent: number;
  resalePrice: number;
  updatePrice: (val: number) => void;
  priceInputText: string;
  handlePriceInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePriceInputBlur: () => void;
  handleStepPrice: (delta: number) => void;
  handleApplyDiscount: (percent: number) => void;
  onContinue: () => void;
}

export const Step4SetPrice: React.FC<Step4SetPriceProps> = ({
  priceCeiling,
  faceValue,
  ticketCount,
  markupPercent,
  resalePrice,
  updatePrice,
  priceInputText,
  handlePriceInputChange,
  handlePriceInputBlur,
  handleStepPrice,
  handleApplyDiscount,
  onContinue,
}) => {
  const isCombo = ticketCount > 1;
  const totalResalePrice = resalePrice * ticketCount;

  return (
    <div key={4} className="animate-fade-in-up max-w-xl mx-auto space-y-6 pt-2">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-extrabold font-display text-white">
          Set Resale Price
        </h2>
        <p className="text-xs text-[#A3A8B3]">
          Slide or type a price up to the event ceiling ({priceCeiling.toLocaleString('vi-VN')} VND
          {markupPercent > 0 ? `, face value + ${markupPercent}%` : ''}).
        </p>
      </div>

      {/* Price Selector Main Box */}
      <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl text-center hover:border-white/20 transition-all duration-300">
        <span className="text-xs text-[#A3A8B3] uppercase tracking-wider font-display font-semibold">
          {isCombo ? 'PROPOSED RESALE PRICE (PER TICKET)' : 'PROPOSED RESALE PRICE'}
        </span>

        <div className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight flex items-center justify-center gap-2 transition-all duration-300">
          <span className="transition-all duration-300">
            {resalePrice > 0 ? resalePrice.toLocaleString('vi-VN') : '0'}
          </span>
          <span className="text-base font-normal text-[#FF5A36]">VND</span>
        </div>

        {isCombo && (
          <p className="text-xs font-mono text-[#A3A8B3]">
            {resalePrice.toLocaleString('vi-VN')} VND × {ticketCount} tickets ={' '}
            <span className="text-[#FF5A36] font-bold">{totalResalePrice.toLocaleString('vi-VN')} VND</span>
          </p>
        )}

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
            onChange={(e) => updatePrice(Number(e.target.value))}
            aria-valuemin={1000}
            aria-valuemax={priceCeiling}
            aria-valuenow={resalePrice}
            className="w-full h-2 appearance-none rounded-full cursor-pointer bg-white/10 accent-[#FF5A36]"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8F96A3]">
            <span>Min</span>
            <span>Max {priceCeiling.toLocaleString('vi-VN')}</span>
          </div>
        </div>

        {/* Manual Price Input – Compact row with stepper */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left shrink-0">
              <span className="text-[10px] text-[#A3A8B3] font-mono uppercase tracking-wider whitespace-nowrap font-semibold">
                Custom Price (VND)
              </span>
              <span className="text-[9px] text-[#8F96A3] font-mono whitespace-nowrap">
                (Cannot exceed event ceiling)
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
                title="Decrease 10,000 VND"
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
                title={resalePrice >= priceCeiling ? 'Cannot exceed the event ceiling' : 'Increase 10,000 VND'}
              >
                +
              </button>
            </div>
          </div>

          {/* Validation hint */}
          <div className="min-h-[20px] flex items-center justify-end text-[10px] font-mono">
            {resalePrice > priceCeiling && (
              <span className="text-rose-400 font-semibold">
                Cannot exceed the event ceiling ({priceCeiling.toLocaleString('vi-VN')} VND)
              </span>
            )}
            {resalePrice < faceValue && resalePrice > 0 && (
              <span className="text-emerald-400">
                {(faceValue - resalePrice).toLocaleString('vi-VN')} VND ({Math.round((1 - resalePrice / faceValue) * 100)}%) below face value
              </span>
            )}
            {resalePrice === faceValue && (
              <span className="text-[#A3A8B3]">
                At face value ({faceValue.toLocaleString('vi-VN')} VND)
              </span>
            )}
            {resalePrice > faceValue && resalePrice <= priceCeiling && (
              <span className="text-[#A3A8B3]">
                {(resalePrice - faceValue).toLocaleString('vi-VN')} VND above face, within the {markupPercent}% ceiling
              </span>
            )}
          </div>
        </div>

        {/* Quick Discount Presets */}
        <div className="space-y-2">
          <span className="text-[11px] text-[#A3A8B3]">Quick price presets:</span>
          <div className={`grid gap-2 text-xs font-mono ${priceCeiling > faceValue ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-4'}`}>
            <button
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
              onClick={() => handleApplyDiscount(0)}
              className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                resalePrice === faceValue
                  ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                  : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
              }`}
            >
              Face Value
            </button>

            {priceCeiling > faceValue && (
              <button
                onClick={() => updatePrice(priceCeiling)}
                className={`py-2.5 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                  resalePrice === priceCeiling
                    ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-[#FF5A36] font-bold shadow-lg shadow-[#FF5A36]/20'
                    : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/30'
                }`}
              >
                Max Price
              </button>
            )}
          </div>
        </div>

        {/* Platform Fee & Net Payout Breakdown Box */}
        <div className="p-4 sm:p-5 bg-[#080B11]/90 backdrop-blur-sm border border-emerald-500/25 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fee Breakdown</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              3% Seller Fee
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Listed Price:</span>
              <span className="font-semibold text-zinc-200 tabular-nums">
                {resalePrice.toLocaleString('vi-VN')} VND
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-400">
              <span>Seller Service Fee (3%):</span>
              <span className="font-medium text-amber-400 tabular-nums">
                - {Math.max(Math.round(resalePrice * 0.03), 5000).toLocaleString('vi-VN')} VND
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline pt-2.5 border-t border-white/10">
            <div>
              <span className="text-xs font-bold text-emerald-400 block">
                Estimated Seller Payout
              </span>
              <span className="text-[10px] text-zinc-500">
                (Automatically deposited to your bank account after settlement)
              </span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                {Math.max(resalePrice - Math.max(Math.round(resalePrice * 0.03), 5000), 0).toLocaleString('vi-VN')}
              </span>
              <span className="ml-1 text-xs font-bold text-emerald-400">VND</span>
            </div>
          </div>
        </div>

        <button
          onClick={onContinue}
          disabled={resalePrice > priceCeiling || resalePrice <= 0}
          className={`w-full py-4 font-bold font-display uppercase tracking-widest text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            resalePrice > priceCeiling || resalePrice <= 0
              ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed opacity-50'
              : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          }`}
        >
          <span>Continue</span>
        </button>
      </div>
    </div>
  );
};
