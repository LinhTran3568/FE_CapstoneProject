import React, { useState } from 'react';
import { UserBankAccountDto } from '@ticketshield/types';
import { Ticket, Globe, Lock, Check, AlertCircle, Loader2, X, Layers, Split, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';

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
  eventName = 'Official Concert Event',
  eventVenue = 'Official Event Venue',
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

  // Kiểm tra xem có vé nào bị giảm sâu > 50% không
  const hasDeepDiscount = Boolean(
    tickets && tickets.some((t) => t.resalePrice > 0 && (t.originalPrice - t.resalePrice) / t.originalPrice >= 0.5)
  );

  // Nếu có vé bị giảm sâu > 50%: Tự động bung dropdown; nếu không: mặc định thu gọn
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
                <span>{ticketCount > 1 ? `Mã vé (${ticketCount} vé):` : 'Mã vé:'}</span>
              </div>
              {seatZone && (
                <SeatAdjacencyBadge
                  seats={seatZone}
                  variant="glass"
                  size="xs"
                  showSubtext={true}
                />
              )}
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
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold font-mono rounded-full shrink-0 uppercase">
            VERIFIED
          </span>
        </div>

        {/* 2. BẢNG TÍNH GIÁ & DOANH THU (PRICE BREAKDOWN) - HỖ TRỢ DROPDOWN THÔNG MINH */}
        <div className="space-y-3 pb-4 border-b border-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
              PRICE BREAKDOWN
            </span>
            {hasDeepDiscount && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-semibold animate-pulse">
                <AlertTriangle className="w-3 h-3 text-amber-300" />
                Có vé giảm sâu hơn 50%
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* DÒNG 1: Resale Price (Tổng giá bán) - Hỗ trợ bung/thu */}
            <div className="space-y-1">
              <div
                onClick={() => tickets && tickets.length > 1 && setExpandPriceDetails(!expandPriceDetails)}
                className={`flex justify-between items-center text-gray-300 select-none py-1 rounded transition-colors ${
                  tickets && tickets.length > 1 ? 'cursor-pointer hover:text-white' : ''
                }`}
                title={tickets && tickets.length > 1 ? (expandPriceDetails ? 'Thu gọn danh sách vé' : 'Bung xem chi tiết từng vé') : undefined}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-200">Resale Price (Tổng giá bán)</span>
                  {hasDeepDiscount && (
                    <span className="text-[11px] text-amber-400 font-bold" title="Có vé giảm hơn 50% so với giá gốc">⚠️</span>
                  )}
                  {tickets && tickets.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandPriceDetails(!expandPriceDetails);
                      }}
                      className="p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={expandPriceDetails ? 'Thu gọn' : 'Bung xem chi tiết từng vé'}
                    >
                      {expandPriceDetails ? (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-300" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      )}
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

              {/* CÁC DÒNG VÉ CON VIỀN CAM DỌC - CHÚ THÍCH CỤ THỂ TỪNG VÉ KÈM INLINE WARNING NẾU GIẢM SÂU */}
              {expandPriceDetails && tickets && tickets.length > 1 && (
                <div className="space-y-2.5 pl-3 py-2 border-l-2 border-[#FF5A36] bg-white/[0.015] rounded-r-xl my-1 animate-in fade-in duration-150">
                  {tickets.map((t, idx) => {
                    const diff = t.originalPrice - t.resalePrice;
                    const percent = Math.round((Math.abs(diff) / t.originalPrice) * 100);
                    const isDeepDiscount = t.resalePrice > 0 && diff / t.originalPrice >= 0.5;

                    return (
                      <div key={t.code} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          {/* Trái: Vé #1 · VIP (ATSH-VIP-6578) */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-zinc-400 font-semibold shrink-0">Vé #{idx + 1}</span>
                            {t.seatZone ? (
                              <>
                                <span className="text-zinc-600">·</span>
                                <span className="text-zinc-200 font-medium truncate">{t.seatZone}</span>
                              </>
                            ) : null}
                            <span className="text-zinc-500 font-mono text-[11px] shrink-0">({t.code})</span>

                            {diff > 0 && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                isDeepDiscount
                                  ? 'text-amber-300 bg-amber-500/15 border-amber-500/30 font-mono'
                                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              }`}>
                                {isDeepDiscount ? `⚠️ -${percent}%` : `-${percent}%`}
                              </span>
                            )}
                            {diff < 0 && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                                +{percent}%
                              </span>
                            )}
                          </div>

                          {/* Phải: Giá bán của vé + Nút Sửa */}
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
                                title="Quay lại Bước 4 để chỉnh giá vé này"
                              >
                                Sửa
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Warning thiết kế ngay dưới vé đó */}
                        {isDeepDiscount && (
                          <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1.5 pl-1 py-0.5">
                            <span>⚠️ Có vé giảm hơn 50% so với giá gốc. Vui lòng kiểm tra lại để tránh nhầm lẫn.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DÒNG 2: Seller Fee · 3% - Hỗ trợ bung/thu */}
            <div className="space-y-1">
              <div
                onClick={() => tickets && tickets.length > 1 && setExpandFeeDetails(!expandFeeDetails)}
                className={`relative flex justify-between items-center text-gray-300 select-none py-0.5 rounded transition-colors ${
                  tickets && tickets.length > 1 ? 'cursor-pointer hover:text-white' : ''
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
                  {activeFeeTooltip === 'seller' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-full mt-1.5 w-72 p-3 bg-[#131822] border border-gray-700 rounded-xl shadow-2xl text-[11px] text-gray-200 z-30 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="font-semibold text-white mb-1 font-sans">Phí nền tảng người bán (3%)</div>
                      <div className="leading-relaxed font-sans text-zinc-300">
                        TicketShield khấu trừ tự động 3% từ tổng giá bán khi giao dịch thành công để duy trì dịch vụ bảo đảm an toàn vé và đối soát Ban tổ chức (tối thiểu 5.000đ/vé).
                      </div>
                    </div>
                  )}
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
                      {expandFeeDetails ? (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-300" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      )}
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

              {/* Chi tiết phí từng vé khi bung ra */}
              {expandFeeDetails && tickets && tickets.length > 1 && (
                <div className="space-y-1.5 pl-3 py-1.5 border-l-2 border-amber-500/40 bg-amber-500/[0.03] rounded-r-xl my-1 animate-in fade-in duration-150 text-[11px]">
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
              )}
            </div>

            {/* DÒNG 3: Bạn thực nhận */}
            <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-sm font-bold">
              <span className="text-white">Bạn thực nhận:</span>
              <div className="text-right">
                <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
                  {totalYouReceive.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] font-normal text-zinc-500 ml-1 font-mono">VND</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. THIẾT LẬP TIN ĐĂNG (LISTING SETTINGS) - GOM CHẾ ĐỘ BÁN & PHẠM VI HIỂN THỊ */}
        <div className="bg-[#05070A] border border-white/10 p-4 sm:p-5 rounded-2xl space-y-4 text-left">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
            LISTING SETTINGS
          </span>

          <div className="space-y-4">
            {/* Hàng 1: Chế độ bán gói (chỉ hiện khi combo >= 2 vé) */}
            {ticketCount > 1 && (
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-zinc-300 font-medium">
                  Hình thức bán ({ticketCount} vé):
                </div>
                <div className="p-1 rounded-xl bg-black/40 border border-white/10 flex gap-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setSaleType?.('combo')}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      saleType === 'combo'
                        ? 'bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bán trọn gói combo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType?.('individual')}
                    className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      saleType === 'individual'
                        ? 'bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>Cho phép mua lẻ</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-mono px-0.5">
                  {saleType === 'combo'
                    ? `Người mua bắt buộc mua trọn bộ ${ticketCount} vé trong một giao dịch.`
                    : 'Người mua có thể chọn mua 1 hoặc nhiều vé tùy nhu cầu.'}
                </p>
              </div>
            )}

            {/* Hàng 2: Phạm vi hiển thị (Visibility) */}
            <div className={`space-y-1.5 ${ticketCount > 1 ? 'pt-2 border-t border-white/5' : ''}`}>
              <div className="text-xs font-mono text-zinc-300 font-medium">
                Phạm vi hiển thị:
              </div>
              <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setIsPrivateListing(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !isPrivateListing
                      ? 'bg-white/10 text-white font-bold shadow-sm'
                      : 'text-[#8F96A3] hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Public (Công khai)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivateListing(true)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isPrivateListing
                      ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 font-bold shadow-sm'
                      : 'text-[#8F96A3] hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Private (Riêng tư)</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 px-0.5">
                {!isPrivateListing
                  ? 'Niêm yết công khai trên Marketplace. Bất kỳ ai cũng có thể tìm kiếm và mua vé.'
                  : 'Ẩn khỏi Marketplace. Chỉ người có liên kết bí mật hoặc mã QR mới mua được.'}
              </p>
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
            I certify that I am the authentic owner of {ticketCount > 1 ? 'all ' + ticketCount + ' tickets' : 'this ticket'} and agree to list on TicketShield Marketplace
          </span>
        </label>

        {/* 7. Publish Button (Mở Confirm Modal trước khi xuất bản) */}
        <button
          type="button"
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={isPublishing || !agreedTerms}
          className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ĐANG XUẤT BẢN...</span>
            </>
          ) : (
            <span>
              {ticketCount > 1
                ? saleType === 'combo'
                  ? `XUẤT BẢN GÓI COMBO (${ticketCount} VÉ)`
                  : `XUẤT BẢN BÁN LẺ (${ticketCount} VÉ)`
                : 'XUẤT BẢN TIN ĐĂNG BÁN'}
            </span>
          )}
        </button>
      </div>

      {/* CONFIRM MODAL TRƯỚC KHI XUẤT BẢN LÊN SÀN */}
      {isConfirmModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isPublishing && setIsConfirmModalOpen(false)}
        >
          <div
            className="bg-[#0B0E14] border border-white/15 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-left animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-display text-white">
                  Xác nhận xuất bản tin đăng
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isPrivateListing
                    ? 'Tin đăng bán vé sẽ được kích hoạt ở chế độ liên kết riêng tư.'
                    : 'Tin đăng bán vé sẽ được niêm yết công khai trên sàn TicketShield Marketplace.'}
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
            <div className="p-3.5 bg-[#05070A] border border-white/10 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between items-start gap-2">
                <span className="text-zinc-400">Sự kiện:</span>
                <span className="text-white font-medium text-right truncate max-w-[220px] font-sans">
                  {eventName}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Hình thức bán:</span>
                <span className="text-zinc-200 font-semibold text-right">
                  {ticketCount > 1
                    ? saleType === 'combo'
                      ? `${ticketCount} vé trong combo: Trọn gói (Buộc mua cả cặp)`
                      : `${ticketCount} vé bán lẻ riêng biệt`
                    : '1 vé đơn lẻ'}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Mã vé:</span>
                <span className="text-zinc-300 truncate max-w-[200px]">
                  {ticketCodes.join(', ')}
                </span>
              </div>

              {seatZone && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-zinc-400">Khu vực / Chỗ ngồi:</span>
                  <span className="text-cyan-300 truncate max-w-[200px]">
                    {seatZone}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-white/5">
                <span className="text-zinc-400">Tổng giá niêm yết:</span>
                <span className="text-[#FF5A36] font-bold">
                  {totalResalePrice.toLocaleString('vi-VN')} VND
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Thực nhận (sau phí 3%):</span>
                <span className="text-emerald-400 font-bold">
                  {totalYouReceive.toLocaleString('vi-VN')} VND
                </span>
              </div>

              <div className="flex justify-between items-center gap-2 pt-1.5 border-t border-white/5">
                <span className="text-zinc-400">Tài khoản nhận tiền:</span>
                <span className="text-zinc-200 text-right truncate max-w-[200px]">
                  {bankAccounts.length > 0
                    ? `${bankAccounts[0].bankCode} • ${bankAccounts[0].bankAccountNumber}`
                    : 'Chưa cập nhật (Bổ sung sau)'}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Chế độ hiển thị:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isPrivateListing
                    ? 'text-purple-300 bg-purple-500/10 border border-purple-500/20'
                    : 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                }`}>
                  {isPrivateListing ? 'Riêng tư (Link ẩn)' : 'Công khai trên sàn'}
                </span>
              </div>
            </div>

            {/* 2 Nút thao tác */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isPublishing}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Kiểm tra lại
              </button>

              <button
                type="button"
                onClick={handlePublishListing}
                disabled={isPublishing}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold font-display uppercase tracking-wider transition-all shadow-md shadow-[#FF5A36]/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xuất bản...</span>
                  </>
                ) : (
                  <span>Xác nhận xuất bản</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
