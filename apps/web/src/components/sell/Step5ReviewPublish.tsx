import React from 'react';
import { UserBankAccountDto } from '@ticketshield/types';
import { Ticket, Globe, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';

export interface Step5ReviewPublishProps {
  ticketCode: string;
  faceValue: number;
  resalePrice: number;
  bankAccounts: UserBankAccountDto[];
  isPrivateListing: boolean;
  setIsPrivateListing: (val: boolean) => void;
  agreedTerms: boolean;
  setAgreedTerms: (val: boolean) => void;
  handlePublishListing: () => void;
  isPublishing: boolean;
  activeFeeTooltip: 'seller' | 'buyer' | null;
  setActiveFeeTooltip: React.Dispatch<React.SetStateAction<'seller' | 'buyer' | null>>;
  onManageBankAccounts: () => void;
}

export const Step5ReviewPublish: React.FC<Step5ReviewPublishProps> = ({
  ticketCode,
  faceValue,
  resalePrice,
  bankAccounts,
  isPrivateListing,
  setIsPrivateListing,
  agreedTerms,
  setAgreedTerms,
  handlePublishListing,
  isPublishing,
  activeFeeTooltip,
  setActiveFeeTooltip,
  onManageBankAccounts,
}) => {
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
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-wide">
              Anh Trai Say Hi Concert 2026
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Ticket Code: <strong className="text-gray-200">{ticketCode || 'ATSH-VIP-8862'}</strong>
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold font-mono rounded-full shrink-0 uppercase">
            VERIFIED
          </span>
        </div>

        {/* 2. Compact Price Comparison */}
        <div className="grid grid-cols-2 gap-4 text-xs pb-3 border-b border-gray-800/80">
          <div>
            <span className="text-gray-400 font-medium block mb-0.5 uppercase tracking-wider text-[11px]">
              ORIGINAL PRICE
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {faceValue.toLocaleString('vi-VN')} VND
            </span>
          </div>
          <div className="text-right">
            <span className="text-gray-400 font-medium block mb-0.5 uppercase tracking-wider text-[11px]">
              RESALE PRICE
            </span>
            <span className="font-mono font-bold text-[#FF5A36] text-sm">
              {resalePrice.toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>

        {/* 3. Price Breakdown */}
        <div className="space-y-3 pb-3 border-b border-gray-800/80">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            PRICE BREAKDOWN
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-gray-300">
              <span>Resale Price</span>
              <span className="font-mono font-medium text-white">
                {resalePrice.toLocaleString('vi-VN')} VND
              </span>
            </div>

            <div className="relative flex justify-between items-center text-gray-300">
              <div className="flex items-center gap-1.5">
                <span>Seller Fee · 3%</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFeeTooltip(activeFeeTooltip === 'seller' ? null : 'seller');
                  }}
                  className="w-4 h-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                  title="Seller fee info"
                >
                  ?
                </button>
                {activeFeeTooltip === 'seller' && (
                  <div className="absolute left-0 top-full mt-1.5 w-68 p-3 bg-[#131822] border border-gray-700 rounded-xl shadow-2xl text-[11px] text-gray-200 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-semibold text-white mb-1">3% Seller Fee</div>
                    <div>TicketShield deducts 3% from the resale price for transaction processing and order support.</div>
                  </div>
                )}
              </div>
              <span className="font-mono text-gray-400">
                -{Math.max(Math.round(resalePrice * 0.03), 5000).toLocaleString('vi-VN')} VND
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-sm font-bold">
              <span className="text-white">You Receive</span>
              <span className={`font-mono text-base ${resalePrice < 5000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {resalePrice < 5000
                  ? 'Below minimum fee'
                  : `${Math.max(resalePrice - Math.max(Math.round(resalePrice * 0.03), 5000), 0).toLocaleString('vi-VN')} VND`}
              </span>
            </div>
          </div>
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
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 flex items-center justify-between gap-3">
              <span className="text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Chưa có tài khoản nhận tiền</span>
              </span>
              <button
                type="button"
                onClick={onManageBankAccounts}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
              >
                Liên kết ngay
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
            I certify that I am the authentic ticket owner and agree to list on TicketShield Marketplace
          </span>
        </label>

        {/* 7. Publish Button */}
        <button
          onClick={handlePublishListing}
          disabled={isPublishing || !agreedTerms}
          className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>PUBLISHING...</span>
            </>
          ) : (
            <span>PUBLISH LISTING</span>
          )}
        </button>
      </div>
    </div>
  );
};
