import React, { useState, useRef, useEffect } from 'react';
import { OrganizerDto } from '@ticketshield/api-client';
import { PurchasedTicketDto, UserBankAccountDto } from '@ticketshield/types';
import { Building2, ChevronDown, Check, Ticket, X, Loader2, ArrowRight } from 'lucide-react';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';

export interface Step1EnterTicketCodeProps {
  ticketCode: string;
  setTicketCode: (code: string) => void;
  selectedOrganizerId: string;
  setSelectedOrganizerId: (id: string) => void;
  organizers: OrganizerDto[];
  isLoadingOrganizers: boolean;
  eligibleTickets: PurchasedTicketDto[];
  purchasedPassCode: (ticket: PurchasedTicketDto) => string;
  handleStartVerification: (e: React.FormEvent) => void;
  isRequestingOtp: boolean;
  bankAccounts: UserBankAccountDto[];
  isLoadingBankAccounts: boolean;
  onAddBankAccount: () => void;
}

export const Step1EnterTicketCode: React.FC<Step1EnterTicketCodeProps> = ({
  ticketCode,
  setTicketCode,
  selectedOrganizerId,
  setSelectedOrganizerId,
  organizers,
  isLoadingOrganizers,
  eligibleTickets,
  purchasedPassCode,
  handleStartVerification,
  isRequestingOtp,
  bankAccounts,
  isLoadingBankAccounts,
  onAddBankAccount,
}) => {
  const [isOrganizerDropdownOpen, setIsOrganizerDropdownOpen] = useState(false);
  const organizerDropdownRef = useRef<HTMLDivElement>(null);

  const [isPurchasesDropdownOpen, setIsPurchasesDropdownOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const purchasesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (organizerDropdownRef.current && !organizerDropdownRef.current.contains(e.target as Node)) {
        setIsOrganizerDropdownOpen(false);
      }
      if (purchasesDropdownRef.current && !purchasesDropdownRef.current.contains(e.target as Node)) {
        setIsPurchasesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div key={1} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 text-center pt-4">
      {/* Bank Account Warning Banner */}
      {bankAccounts.length === 0 && !isLoadingBankAccounts && (
        <div className="p-4 sm:p-4.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left animate-fade-in-up">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-white">Link your payout account</h4>
              <p className="text-xs text-[#A3A8B3] leading-relaxed">
                Receive money automatically once your ticket is verified and sold.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddBankAccount}
            className="self-start sm:self-auto px-4 py-2.5 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-amber-400/20 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Link Bank Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleStartVerification} className="space-y-6 text-left bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-all duration-300">
        {/* 1. Ticketing Platform (Organizer) — Custom CSS Dropdown */}
        <div className="space-y-2">
          <label
            htmlFor="sell-organizer-select"
            className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block"
          >
            Ticketing Platform
          </label>
          <div className="relative" ref={organizerDropdownRef}>
            <button
              id="sell-organizer-select"
              type="button"
              onClick={() => setIsOrganizerDropdownOpen((prev) => !prev)}
              className={`w-full h-14 bg-[#05070A] border ${
                isOrganizerDropdownOpen
                  ? 'border-[#FF5A36] ring-4 ring-[#FF5A36]/20'
                  : 'border-white/15 hover:border-white/25'
              } rounded-2xl pl-4 pr-4 flex items-center justify-between text-left transition-all duration-200 cursor-pointer shadow-inner`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-zinc-400 shrink-0" />
                <span className="text-sm font-semibold text-white">
                  {selectedOrganizerId
                    ? organizers.find((o) => o.id === selectedOrganizerId)?.name || 'Select Ticketing Platform'
                    : 'VieON Entertainment (Default)'}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  isOrganizerDropdownOpen ? 'rotate-180 text-[#FF5A36]' : ''
                }`}
              />
            </button>

            {isOrganizerDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0D12] border border-white/15 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrganizerId('');
                    setIsOrganizerDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-3 rounded-xl text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                    !selectedOrganizerId
                      ? 'bg-[#FF5A36]/15 text-[#FF5A36] font-bold border border-[#FF5A36]/30'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">VieON Entertainment</div>
                    <div className="text-[11px] text-[#8B929C]">Default · VieON Ticketing Platform</div>
                  </div>
                  {!selectedOrganizerId && <Check className="w-4 h-4 text-[#FF5A36] shrink-0" />}
                </button>

                {organizers.map((org) => {
                  const isSelected = selectedOrganizerId === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrganizerId(org.id);
                        setIsOrganizerDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-3 rounded-xl text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF5A36]/15 text-[#FF5A36] font-bold border border-[#FF5A36]/30'
                          : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{org.name}</div>
                        {org.code && <div className="text-[11px] text-[#8B929C] font-mono">{org.code}</div>}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#FF5A36] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Ticket Code Input with Embedded 'From Wallet' Dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block">
              Original Ticket Code
            </label>
            {eligibleTickets.length > 0 && (
              <span className="text-xs font-mono text-[#8F96A3]">
                {eligibleTickets.length} {eligibleTickets.length === 1 ? 'ticket' : 'tickets'} in wallet
              </span>
            )}
          </div>

          <div className="relative" ref={purchasesDropdownRef}>
            <div
              className={`flex items-center bg-[#05070A] border ${
                isPurchasesDropdownOpen
                  ? 'border-[#FF5A36] ring-4 ring-[#FF5A36]/20'
                  : ticketCode
                    ? 'border-[#FF5A36]/50'
                    : 'border-white/15 focus-within:border-[#FF5A36] focus-within:ring-4 focus-within:ring-[#FF5A36]/20'
              } rounded-2xl transition-all duration-200 shadow-inner h-14 pl-4 pr-2 gap-2`}
            >
              <Ticket className="w-4.5 h-4.5 text-[#FF5A36] shrink-0 pointer-events-none" />
              <input
                id="sell-ticket-input"
                type="text"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                placeholder="e.g. ATSH-VIP-888"
                className="flex-1 bg-transparent border-0 outline-none text-base font-mono font-bold tracking-widest text-white placeholder-[#A3A8B3]/30 min-w-0"
                required
              />

              {ticketCode && (
                <button
                  type="button"
                  onClick={() => setTicketCode('')}
                  className="p-1.5 text-[#8F96A3] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Clear code"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Subtle vertical separator */}
              <div className="h-6 w-px bg-white/10 shrink-0" />

              {/* 'My Tickets' button inside input (Clean, without confusing count badge) */}
              <button
                type="button"
                onClick={() => {
                  setIsPurchasesDropdownOpen((prev) => !prev);
                  setTicketSearch('');
                }}
                className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isPurchasesDropdownOpen
                    ? 'bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/30'
                    : 'bg-[#151921] hover:bg-[#1C222C] text-zinc-200 border border-white/10'
                }`}
              >
                <span className="whitespace-nowrap">My Tickets</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isPurchasesDropdownOpen ? 'rotate-180' : 'text-zinc-400'
                  }`}
                />
              </button>
            </div>

            {/* Dropdown panel: Centered and full width matching the input / organizer dropdown */}
            {isPurchasesDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0D12] border border-white/15 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                {/* Search bar inside dropdown */}
                <div className="p-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5 bg-[#05070A] border border-white/10 rounded-xl px-3 h-9 focus-within:border-[#FF5A36]/50 transition-colors">
                    <svg className="w-3.5 h-3.5 text-[#8B929C] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Search your tickets..."
                      className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder-[#8B929C] font-mono"
                      autoFocus
                    />
                    {ticketSearch && (
                      <button
                        type="button"
                        onClick={() => setTicketSearch('')}
                        className="text-[#8B929C] hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ticket list */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                  {(() => {
                    const filtered = eligibleTickets.filter((t) => {
                      if (!ticketSearch.trim()) return true;
                      const q = ticketSearch.toLowerCase();
                      return (
                        purchasedPassCode(t).toLowerCase().includes(q) ||
                        t.eventName.toLowerCase().includes(q) ||
                        (t.tierName || '').toLowerCase().includes(q)
                      );
                    });
                    if (filtered.length === 0) {
                      return (
                        <div className="py-6 text-center">
                          <p className="text-xs text-[#8B929C]">
                            {ticketSearch ? 'No tickets match your search.' : 'No eligible tickets on this account.'}
                          </p>
                        </div>
                      );
                    }
                    // =========================================================================================
                    // [AI AGENT INSTRUCTION - MULTI-TICKET BUNDLE RESALE SELECTION]
                    // Khi đồng đội / Agent tiếp quản phát triển tính năng BÁN GÓI/COMBO VÉ (Bundle Resale):
                    // 1. UI MULTI-SELECT TỐI ƯU TRÊN MY TICKETS:
                    //    - Chuyển cơ chế từ chọn 1 vé đơn lẻ (single-click đóng dropdown) sang Multi-Select Checkbox.
                    //    - Khi click vé: Toggle thêm/bớt mã vé trong danh sách `selectedTicketCodes: string[]`
                    //      thay vì set 1 chuỗi `ticketCode` rồi tự ý đóng dropdown `setIsPurchasesDropdownOpen(false)`.
                    //    - Bổ sung ô Checkbox trực quan ở mỗi dòng vé.
                    //    - Bổ sung thanh Action Footer cố định ở đáy dropdown: "Đã chọn: X vé" + Nút "[Xác nhận chọn]".
                    //    - Render danh sách vé đã chọn dạng tags/chips có nút (x) để người dùng quản lý thuận tiện.
                    // 2. DOMAIN & BUSINESS VALIDATION:
                    //    - Ràng buộc: Tất cả vé trong 1 gói resale bắt buộc phải cùng 1 Event (`eventId`).
                    // 3. ZERO-TOLERANCE ARCHITECTURAL STANDARDS (KỶ LUẬT ĐỒ ÁN CAPSTONE BẮT BUỘC):
                    //    - FE: Đóng gói toàn bộ danh sách vé trong bundle vào 1 MediatR Command Payload duy nhất.
                    //    - BE: CẤM Loop-Commit & Patching. Toàn bộ N vé trong gói bắt buộc phải được bọc trong
                    //      1 Database Transaction nguyên tử duy nhất (ACID), chèn sẵn `bundle_id` ngay từ đầu,
                    //      triệt tiêu 100% nguy cơ phát sinh vé mồ côi nếu transaction bị gián đoạn giữa chừng.
                    // =========================================================================================
                    return filtered.map((t) => {
                      const code = purchasedPassCode(t).toUpperCase();
                      const isSelected = code === ticketCode;
                      return (
                        <button
                          key={t.escrowId}
                          type="button"
                          onClick={() => {
                            // NOTE FOR BUNDLE: Replace single-value assign with toggle in selectedTicketCodes array
                            setTicketCode(isSelected ? '' : code);
                            setIsPurchasesDropdownOpen(false);
                            setTicketSearch('');
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#FF5A36]/15 border border-[#FF5A36]/30'
                              : 'hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-mono font-bold text-xs text-[#FF5A36]">{code}</div>
                            <div className="text-xs font-semibold text-white truncate">{t.eventName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-[#8B929C] truncate">{t.tierName}</span>
                              {(t.seatZone || t.tierName) && (
                                <SeatAdjacencyBadge
                                  seats={t.seatZone || t.tierName}
                                  variant="subtle"
                                  size="xs"
                                  showSubtext={true}
                                />
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#FF5A36] shrink-0" />}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isRequestingOtp || !ticketCode.trim()}
          className={`w-full h-14 font-bold font-display uppercase tracking-widest text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
            !ticketCode.trim() || isRequestingOtp
              ? 'bg-white/[0.07] text-white/50 cursor-not-allowed border border-white/10'
              : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          }`}
        >
          {isRequestingOtp ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Ticket</span>
          )}
        </button>
      </form>
    </div>
  );
};
