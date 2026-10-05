import React, { useState } from 'react';
import { UserBankAccountDto } from '@ticketshield/types';
import { Ticket, Globe, Lock, Check, AlertCircle, Loader2, X, Layers, Split } from 'lucide-react';
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
                <span>
                  {ticketCount > 1
                    ? saleType === 'combo'
                      ? `${ticketCount} Vé trong combo:`
                      : `${ticketCount} Vé bán lẻ riêng biệt:`
                    : 'Ticket Code:'}
                </span>
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
                  className="px-2 py-0.5 bg-white/[0.04] border border-white/10 rounded-md text-[11px] text-gray-200 break-all"
                >
                  {code}
                </span>
              ))}
            </div>

            {/* Sale Type Badge */}
            {ticketCount > 1 && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-gray-400">Hình thức:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                  saleType === 'combo'
                    ? 'bg-[#FF5A36]/15 border-[#FF5A36]/40 text-[#FF5A36]'
                    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                }`}>
                  {saleType === 'combo' ? 'Trọn gói (Buộc mua cả cặp)' : 'Cho phép mua lẻ (Không buộc theo cặp)'}
                </span>
              </div>
            )}
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold font-mono rounded-full shrink-0 uppercase">
            VERIFIED
          </span>
        </div>

        {/* 2. CHỌN CHẾ ĐỘ BÁN (CHO GÓI >= 2 VÉ) */}
        {ticketCount > 1 && (
          <div className="bg-[#05070A] border border-white/10 p-3 sm:p-3.5 rounded-2xl space-y-2 text-left">
            <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
              Chế độ bán gói
            </div>

            {/* Segmented Control 2 nút ngang */}
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
                <span>Bán trọn gói combo ({ticketCount} vé)</span>
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

            <p className="text-xs text-zinc-400 leading-relaxed font-mono px-1">
              {saleType === 'combo'
                ? `Người mua bắt buộc mua trọn bộ ${ticketCount} vé trong một giao dịch.`
                : 'Người mua có thể chọn mua 1 hoặc nhiều vé tùy nhu cầu.'}
            </p>
          </div>
        )}

        {/* 3. BẢNG TÍNH GIÁ & DOANH THU (PRICE BREAKDOWN) VIỀN CAM DỌC MỎNG */}
        <div className="space-y-3 pb-3 border-b border-gray-800/80">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block font-mono">
            PRICE BREAKDOWN
          </span>

          <div className="space-y-2.5 text-xs font-mono">
            {/* DÒNG 1: Resale Price (Tổng giá bán) */}
            <div className="flex justify-between items-center text-gray-300">
              <span className="font-semibold text-zinc-200">Resale Price (Tổng giá bán)</span>
              <div>
                <span className="font-bold text-white text-sm sm:text-base tabular-nums">
                  {totalResalePrice.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-zinc-500 ml-1">VND</span>
              </div>
            </div>

            {/* CÁC DÒNG VÉ CON VIỀN CAM DỌC - CHÚ THÍCH CỤ THỂ TỪNG VÉ */}
            {tickets && tickets.length > 1 && (
              <div className="space-y-2 pl-3 py-1.5 border-l-2 border-[#FF5A36] bg-white/[0.015] rounded-r-xl my-1.5">
                {tickets.map((t, idx) => {
                  const diff = t.originalPrice - t.resalePrice;
                  const percent = Math.round((Math.abs(diff) / t.originalPrice) * 100);
                  const isDeepDiscount = t.resalePrice > 0 && diff / t.originalPrice >= 0.5;

                  return (
                    <div key={t.code} className="flex items-center justify-between gap-2 text-xs">
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
                              ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            -{percent}%
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
                  );
                })}
              </div>
            )}

            {/* DÒNG 2: Seller Fee · 3% */}
            <div className="relative flex justify-between items-center text-gray-300 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span>Seller Fee · 3%</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFeeTooltip(activeFeeTooltip === 'seller' ? null : 'seller');
                  }}
                  className="w-4 h-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                  title="Thông tin phí nền tảng"
                >
                  ?
                </button>
                {activeFeeTooltip === 'seller' && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 p-3 bg-[#131822] border border-gray-700 rounded-xl shadow-2xl text-[11px] text-gray-200 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-semibold text-white mb-1 font-sans">Phí nền tảng người bán (3%)</div>
                    <div className="leading-relaxed font-sans text-zinc-300">
                      TicketShield khấu trừ tự động 3% từ tổng giá bán khi giao dịch thành công để duy trì dịch vụ bảo đảm an toàn vé và đối soát Ban tổ chức.
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className="text-amber-400 font-medium tabular-nums">
                  -{totalSellerFee.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] text-zinc-500 ml-1">VND</span>
              </div>
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

          {/* Cảnh báo vàng nếu có vé giảm sâu > 50% */}
          {tickets && tickets.some((t) => t.resalePrice > 0 && (t.originalPrice - t.resalePrice) / t.originalPrice >= 0.5) && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-300 font-mono mt-2">
              <span className="shrink-0 text-base">⚠️</span>
              <span>Có vé giảm hơn 50% so với giá gốc. Vui lòng kiểm tra lại để tránh nhầm lẫn.</span>
            </div>
          )}
        </div>

        {/* 4. Payout Destination Account */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              PAYOUT DESTINATION
            </span>
            {bankAccounts.length > 0 && (
              <button
                type="button"
                onClick={onManageBankAccounts}
                className="text-xs font-semibold text-[#FF5A36] hover:text-[#FF7252] transition-colors cursor-pointer"
              >
                + Quản lý / Đổi tài khoản
              </button>
            )}
          </div>

          {bankAccounts.length > 0 ? (
            <div className="p-4 rounded-2xl bg-[#05070A] border border-white/10 space-y-1.5 text-xs transition-all hover:border-white/20">
              <div className="text-[9px] text-[#8B929C] uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>Account Review</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Bank Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-bold font-mono text-sm sm:text-base">
                  {bankAccounts[0].bankCode} • {bankAccounts[0].bankAccountNumber}
                </span>
                {bankAccounts[0].isDefault && (
                  <span className="text-[10px] font-mono text-[#8B929C] uppercase">Default</span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FF5A36] truncate">
                {bankAccounts[0].accountHolderName}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Chưa liên kết tài khoản ngân hàng</span>
                </span>
                <p className="text-[11px] text-zinc-500 pl-5.5">
                  Bạn có thể đăng bán vé ngay bây giờ và cập nhật tài khoản sau khi vé được mua.
                </p>
              </div>
              <button
                type="button"
                onClick={onManageBankAccounts}
                className="self-start sm:self-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
              >
                + Thêm tài khoản
              </button>
            </div>
          )}
        </div>

        {/* 5. Visibility Control */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            VISIBILITY
          </span>
          <div className="grid grid-cols-2 p-1 bg-[#05070A] border border-gray-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setIsPrivateListing(false)}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isPrivateListing
                  ? 'bg-white/10 text-white font-bold shadow-sm'
                  : 'text-[#8F96A3] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Public</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrivateListing(true)}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPrivateListing
                  ? 'bg-purple-950/60 border border-purple-500/40 text-purple-200 font-bold shadow-sm'
                  : 'text-[#8F96A3] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Private</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            {!isPrivateListing
              ? 'Listed openly on Marketplace. Anyone can search and buy.'
              : 'Hidden from Marketplace. Accessible only via secret link or QR code.'}
          </p>
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
                <span className="text-zinc-200 font-semibold">
                  {ticketCount} vé ({saleType === 'combo' ? 'Trọn gói combo' : 'Cho phép mua lẻ'})
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
