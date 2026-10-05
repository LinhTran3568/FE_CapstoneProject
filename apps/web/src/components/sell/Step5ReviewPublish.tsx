import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserBankAccountDto } from '@ticketshield/types';
import { Ticket, Globe, Lock, Check, AlertCircle, Loader2, X, Layers, Split, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export interface Step5ReviewPublishProps {
  /** Mã của từng vé thật trong gói (1–3 vé). */
  ticketCodes: string[];
  /** Danh sách vé chi tiết kèm giá bán riêng. */
  tickets?: Array<{
    code: string;
    originalPrice: number;
    resalePrice: number;
    seatZone?: string;
  }>;
  /** Tổng giá gốc của tất cả vé trong gói. */
  faceValue: number;
  /** Giá bán lại áp dụng cho MỖI vé trong gói (fallback). */
  resalePrice: number;
  bankAccounts: UserBankAccountDto[];
  seatZone?: string;
  isPrivateListing: boolean;
  setIsPrivateListing: (val: boolean) => void;
  agreedTerms: boolean;
  setAgreedTerms: (val: boolean) => void;
  handlePublishListing: () => void;
  isPublishing: boolean;
  activeFeeTooltip: 'seller' | 'buyer' | null;
  setActiveFeeTooltip: React.Dispatch<React.SetStateAction<'seller' | 'buyer' | null>>;
  onManageBankAccounts: () => void;
  eventName?: string;
  eventVenue?: string;
  saleType?: 'combo' | 'individual';
  setSaleType?: (type: 'combo' | 'individual') => void;
  onEditTicketPrice?: (index: number) => void;
}

export const Step5ReviewPublish: React.FC<Step5ReviewPublishProps> = ({
  ticketCodes,
  tickets,
  faceValue,
  resalePrice,
  bankAccounts,
  seatZone,
  isPrivateListing,
  setIsPrivateListing,
  agreedTerms,
  setAgreedTerms,
  handlePublishListing,
  isPublishing,
  activeFeeTooltip,
  setActiveFeeTooltip,
  onManageBankAccounts,
  eventName = 'Anh Trai Say Hi - Concert 2024',
  eventVenue = 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
  saleType = 'combo',
  setSaleType,
  onEditTicketPrice,
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const ticketCount = Math.max(tickets?.length || ticketCodes.length, 1);
  const totalResalePrice = tickets && tickets.length > 0
    ? tickets.reduce((sum, t) => sum + (t.resalePrice || 0), 0)
    : resalePrice * ticketCount;
  const totalSellerFee = Math.max(Math.round(totalResalePrice * 0.03), 5000 * ticketCount);
  const totalYouReceive = Math.max(totalResalePrice - totalSellerFee, 0);

  // Kiểm tra xem có vé nào bị giảm sâu >= 70% không
  const hasDeepDiscount = Boolean(
    tickets && tickets.some((t) => t.resalePrice > 0 && (t.originalPrice - t.resalePrice) / t.originalPrice >= 0.7)
  );

  // Nếu có vé bị giảm sâu >= 70%: Tự động bung dropdown; nếu không: mặc định thu gọn
  const [expandPriceDetails, setExpandPriceDetails] = useState<boolean>(hasDeepDiscount);
  const [expandFeeDetails, setExpandFeeDetails] = useState<boolean>(false);

  return (
    <div key={5} className="animate-fade-in-up max-w-[640px] mx-auto space-y-5 pt-2">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold font-display text-white">
          Review &amp; Confirm Listing
        </h2>
        <p className="text-xs text-gray-400">
          Review your ticket details before publishing to TicketShield Marketplace.
        </p>
      </div>

      {/* Main Panel */}
      <div className="bg-[#0B0E14] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-7 space-y-6 text-left">
        {/* 1. Ticket Summary Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white tracking-wide">
              {eventName}
            </h3>
            <div className="flex items-center gap-2.5 flex-wrap text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                <span>{ticketCount > 1 ? `Your tickets (${ticketCount})` : 'Your ticket'}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {ticketCodes.length === 0 && (
                <span className="text-gray-400">ATSH-VIP-8862</span>
              )}
              {ticketCodes.map((code) => (
                <span
                  key={code}
                  className="px-2 py-0.5 bg-white/[0.04] border border-white/10 rounded-md text-[11px] text-gray-200 break-all font-mono"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold font-mono rounded-full shrink-0">
            Verified
          </span>
        </div>

        {/* 2. BẢNG TÍNH GIÁ & DOANH THU (PRICE BREAKDOWN) */}
        <div className="space-y-3 pb-4 border-b border-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
              Your prices
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* DÒNG 1: Resale Price - Hỗ trợ bung/thu */}
            <div>
              <div
                onClick={() => tickets && tickets.length > 1 && setExpandPriceDetails(!expandPriceDetails)}
                className={`flex justify-between items-center text-gray-300 select-none py-1 rounded transition-colors ${tickets && tickets.length > 1 ? 'cursor-pointer hover:text-white' : ''
                  }`}
                title={tickets && tickets.length > 1 ? (expandPriceDetails ? 'Collapse ticket details' : 'Expand ticket details') : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-200">Resale Price</span>
                  {hasDeepDiscount && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  {tickets && tickets.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandPriceDetails(!expandPriceDetails);
                      }}
                      className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={expandPriceDetails ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${
                          expandPriceDetails ? 'rotate-180 text-zinc-200' : 'text-zinc-400'
                        }`}
                      />
                    </button>
                  )}
                </div>
                <div>
                  <span className="font-bold text-white text-sm sm:text-base tabular-nums">
                    {totalResalePrice.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">VND</span>
                </div>
              </div>

              {/* CÁC DÒNG VÉ CON VIỀN CAM DỌC KÈM HIỆU ỨNG ACCORDION */}
              <AnimatePresence initial={false}>
                {expandPriceDetails && tickets && tickets.length > 1 && (
                  <motion.div
                    key="price-details-accordion"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: 0.2, ease: 'easeInOut' },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pb-0.5">
                      <div className="space-y-2.5 pl-3 py-2 border-l-2 border-[#FF5A36] bg-white/[0.015] rounded-r-xl">
                        {tickets.map((t, idx) => {
                          const diff = t.originalPrice - t.resalePrice;
                          const percent = Math.round((Math.abs(diff) / t.originalPrice) * 100);
                          const isDeepDiscount = t.resalePrice > 0 && diff / t.originalPrice >= 0.7;

                          return (
                            <div key={t.code} className="space-y-1">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                {/* Trái: Ticket 1 · ATSH-VIP-6578 · 15% off */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-zinc-300 font-medium shrink-0">Ticket {idx + 1}</span>
                                  <span className="text-zinc-600">·</span>
                                  <span className="text-zinc-400 font-mono text-[11px] shrink-0">{t.code}</span>
                                  {t.seatZone && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className="text-zinc-400 text-[11px] truncate">{t.seatZone}</span>
                                    </>
                                  )}

                                  {diff > 0 && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 flex items-center gap-1 ${isDeepDiscount
                                        ? 'text-amber-300 bg-amber-500/15 border-amber-500/30 font-mono'
                                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                        }`}>
                                        {isDeepDiscount && <AlertTriangle className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                                        <span>{percent >= 100 ? '99.9%' : `${percent}%`} off</span>
                                      </span>
                                    </>
                                  )}
                                  {diff < 0 && (
                                    <>
                                      <span className="text-zinc-600">·</span>
                                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                        +{percent}%
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Phải: Giá bán của vé + Nút Edit */}
                                <div className="flex items-center gap-2.5 shrink-0">
                                  <div className="text-right">
                                    <span className="font-bold text-zinc-100 tabular-nums">
                                      {t.resalePrice.toLocaleString('vi-VN')}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 ml-1">VND</span>
                                  </div>
                                  {onEditTicketPrice && (
                                    <button
                                      type="button"
                                      onClick={() => onEditTicketPrice(idx)}
                                      className="text-[11px] text-[#FF5A36] hover:text-[#FF7252] hover:underline px-1 py-0.5 rounded cursor-pointer font-sans"
                                      title="Edit price for this ticket"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Inline Warning thiết kế ngay dưới vé đó */}
                              {isDeepDiscount && (
                                <div className="text-[11px] text-amber-300/90 font-mono flex items-center gap-1.5 pl-1 py-0.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Ticket {idx + 1} is priced way below face value.</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DÒNG 2: Seller Fee · 3% - Hỗ trợ bung/thu */}
            <div>
              <div
                onClick={() => tickets && tickets.length > 1 && setExpandFeeDetails(!expandFeeDetails)}
                className={`relative flex justify-between items-center text-gray-300 select-none py-0.5 rounded transition-colors ${tickets && tickets.length > 1 ? 'cursor-pointer hover:text-white' : ''
                  }`}
                title={tickets && tickets.length > 1 ? (expandFeeDetails ? 'Thu gọn phí từng vé' : 'Bung xem phí từng vé') : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span>Seller Fee · 3%</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFeeTooltip(activeFeeTooltip === 'seller' ? null : 'seller');
                    }}
                    className="w-4 h-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Thông tin phí nền tảng"
                  >
                    ?
                  </button>
                  <AnimatePresence>
                    {activeFeeTooltip === 'seller' && (
                      <motion.div
                        key="seller-fee-tooltip"
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-full mt-1.5 w-72 p-3 bg-[#131822] border border-gray-700 rounded-xl shadow-2xl text-[11px] text-gray-200 z-30"
                      >
                        <div className="font-semibold text-white mb-1 font-sans">Phí nền tảng người bán (3%)</div>
                        <div className="leading-relaxed font-sans text-zinc-300">
                          TicketShield khấu trừ tự động 3% từ tổng giá bán khi giao dịch thành công để duy trì dịch vụ bảo đảm an toàn vé và đối soát Ban tổ chức (tối thiểu 5.000đ/vé).
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {tickets && tickets.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandFeeDetails(!expandFeeDetails);
                      }}
                      className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={expandFeeDetails ? 'Thu gọn' : 'Bung xem phí từng vé'}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${
                          expandFeeDetails ? 'rotate-180 text-zinc-200' : 'text-zinc-400'
                        }`}
                      />
                    </button>
                  )}
                </div>
                <div>
                  <span className="text-amber-400 font-medium tabular-nums">
                    -{totalSellerFee.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-1">VND</span>
                </div>
              </div>

              {/* Chi tiết phí từng vé khi bung ra có hiệu ứng accordion */}
              <AnimatePresence initial={false}>
                {expandFeeDetails && tickets && tickets.length > 1 && (
                  <motion.div
                    key="fee-details-accordion"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                      opacity: { duration: 0.2, ease: 'easeInOut' },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1.5 pb-0.5">
                      <div className="space-y-1.5 pl-3 py-1.5 border-l-2 border-amber-500/40 bg-amber-500/[0.03] rounded-r-xl text-[11px]">
                        {tickets.map((t, idx) => {
                          const ticketFee = Math.max(Math.round((t.resalePrice || 0) * 0.03), 5000);
                          return (
                            <div key={t.code} className="flex justify-between items-center text-amber-300/80">
                              <span>- Phí Vé #{idx + 1} ({t.code}):</span>
                              <span className="text-amber-400 tabular-nums">
                                -{ticketFee.toLocaleString('vi-VN')} <span className="text-[9px] text-zinc-500">VND</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* DÒNG 3: You'll receive */}
            <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-sm font-bold">
              <span className="text-white">You'll receive</span>
              <div className="text-right">
                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                  {totalYouReceive.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] font-normal text-zinc-500 ml-1 font-mono">VND</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. THIẾT LẬP TIN ĐĂNG (How to sell) */}
        <div className="bg-[#05070A] border border-white/10 p-4 sm:p-5 rounded-2xl space-y-4 text-left">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
            How to sell
          </span>

          <div className="space-y-4">
            {/* Hàng 1: Sell as (chỉ hiện khi combo >= 2 vé) */}
            {ticketCount > 1 && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-zinc-300 font-medium">
                  Sell as
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Bundle: Cam (Orange #FF5A36) */}
                  <button
                    type="button"
                    onClick={() => setSaleType?.('combo')}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${saleType === 'combo'
                      ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white shadow-sm shadow-[#FF5A36]/20'
                      : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${saleType === 'combo' ? 'bg-[#FF5A36] text-white' : 'bg-white/5 text-zinc-400'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white">Bundle</div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {ticketCount > 2 ? `Buyer takes all ${ticketCount} tickets` : 'Buyer takes both tickets'}
                      </div>
                    </div>
                  </button>

                  {/* 2. Separately: Xanh dương (Blue blue-500) */}
                  <button
                    type="button"
                    onClick={() => setSaleType?.('individual')}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${saleType === 'individual'
                      ? 'bg-blue-500/15 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                      }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${saleType === 'individual' ? 'bg-blue-500 text-white' : 'bg-white/5 text-zinc-400'}`}>
                      <Split className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white">Separately</div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {ticketCount > 2 ? 'Buyer can take one or more' : 'Buyer can take one or both'}
                      </div>
                    </div>
                  </button>
                </div>
                <div className="min-h-[20px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={saleType}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="text-[11px] text-zinc-400 px-0.5"
                    >
                      {saleType === 'combo'
                        ? 'Buyer must purchase all tickets together as a bundle.'
                        : 'Buyers can purchase one or multiple tickets separately.'}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Hàng 2: Who can see it */}
            <div className={`space-y-2 ${ticketCount > 1 ? 'pt-3 border-t border-white/5' : ''}`}>
              <div className="text-xs font-mono text-zinc-300 font-medium">
                Who can see it
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* 3. Public: Xanh lá (Emerald Green emerald-500) */}
                <button
                  type="button"
                  onClick={() => setIsPrivateListing(false)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${!isPrivateListing
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${!isPrivateListing ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-white">Public</div>
                    <div className="text-[10px] text-zinc-400 truncate">Shown on the Marketplace</div>
                  </div>
                </button>

                {/* 4. Private: Tím (Purple purple-500) */}
                <button
                  type="button"
                  onClick={() => setIsPrivateListing(true)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center gap-2.5 ${isPrivateListing
                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-sm shadow-purple-500/20'
                    : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isPrivateListing ? 'bg-purple-500 text-white' : 'bg-white/5 text-zinc-400'}`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-white">Private</div>
                    <div className="text-[10px] text-zinc-400 truncate">Only people with your link</div>
                  </div>
                </button>
              </div>
              <div className="min-h-[28px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={isPrivateListing ? 'private' : 'public'}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                    className="text-[11px] text-zinc-400 px-0.5"
                  >
                    {!isPrivateListing
                      ? 'Anyone can find and buy these tickets on the Marketplace.'
                      : 'Only people you share the link with can see and buy these tickets.'}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Terms Checkbox */}
        <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer pt-2 group">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="rounded border-gray-700 bg-black text-[#FF5A36] focus:ring-0 w-4 h-4 cursor-pointer"
          />
          <span className="group-hover:text-white transition-colors">
            {ticketCount > 1
              ? "I own these tickets and I'm allowed to resell them on TicketShield."
              : "I own this ticket and I'm allowed to resell it on TicketShield."}
          </span>
        </label>

        {/* 7. Publish Button */}
        <button
          type="button"
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={isPublishing || !agreedTerms}
          className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <span>Publish</span>
          )}
        </button>
      </div>

      {/* CONFIRM MODAL TRƯỚC KHI XUẤT BẢN LÊN SÀN */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <motion.div
            key="confirm-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isPublishing && setIsConfirmModalOpen(false)}
          >
            <motion.div
              key="confirm-modal-content"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0B0E14] border border-white/15 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-display text-white">
                    Confirm &amp; Publish Listing
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {isPrivateListing
                      ? 'Your ticket listing will be created with a secret link.'
                      : 'Your ticket listing will be published publicly on TicketShield Marketplace.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isPublishing && setIsConfirmModalOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nội dung tóm tắt chi tiết */}
              <div className="p-4 bg-[#05070A] border border-white/10 rounded-xl space-y-3 text-xs font-mono">
                {/* 1. Tên sự kiện */}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-zinc-400 shrink-0">Event:</span>
                  <span className="text-white font-medium text-right truncate max-w-[240px] font-sans">
                    {eventName}
                  </span>
                </div>

                {/* 2. Danh sách vé - Hiển thị đầy đủ từng mã vé, không bị cắt dấu ... */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>{ticketCount > 1 ? `Your tickets (${ticketCount}):` : 'Your ticket:'}</span>
                    {ticketCount > 1 && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        saleType === 'combo'
                          ? 'text-[#FF7252] bg-[#FF5A36]/10 border border-[#FF5A36]/25'
                          : 'text-blue-300 bg-blue-500/10 border border-blue-500/25'
                      }`}>
                        {saleType === 'combo' ? 'Bundle' : 'Separately'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    {tickets && tickets.length > 0 ? (
                      tickets.map((t, idx) => (
                        <div
                          key={t.code}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-zinc-500 text-[10px]">#{idx + 1}</span>
                            <span className="text-white font-semibold font-mono text-[11px] select-all">{t.code}</span>
                            {t.seatZone && (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-400 text-[11px] truncate">{t.seatZone}</span>
                              </>
                            )}
                          </div>
                          <div className="font-bold text-zinc-200 tabular-nums shrink-0 text-xs">
                            {t.resalePrice.toLocaleString('vi-VN')} <span className="text-[9px] text-zinc-500 font-normal">VND</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {ticketCodes.map((code, idx) => (
                          <span
                            key={code}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-200"
                          >
                            #{idx + 1} {code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Giá niêm yết & Bạn thực nhận */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Listing price:</span>
                    <span className="text-[#FF5A36] font-bold text-sm tabular-nums">
                      {totalResalePrice.toLocaleString('vi-VN')} VND
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">You'll receive (after 3% fee):</span>
                    <span className="text-emerald-400 font-bold text-sm tabular-nums">
                      {totalYouReceive.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                </div>

                {/* 4. Hình thức hiển thị & Tài khoản thanh toán */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400">Visibility:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPrivateListing
                        ? 'text-purple-300 bg-purple-500/10 border border-purple-500/25'
                        : 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/25'
                    }`}>
                      {isPrivateListing ? 'Private (Secret link)' : 'Public (Marketplace)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-zinc-400">Payout bank account:</span>
                    <span className="text-zinc-200 text-right truncate max-w-[200px]">
                      {bankAccounts.length > 0
                        ? `${bankAccounts[0].bankCode} • ${bankAccounts[0].bankAccountNumber}`
                        : 'Not set yet (can add later)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 Nút thao tác */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={isPublishing}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  Go back
                </button>

                <button
                  type="button"
                  onClick={handlePublishListing}
                  disabled={isPublishing}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold font-display uppercase tracking-wider transition-all shadow-md shadow-[#FF5A36]/30 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
