import React, { useState, useRef, useEffect } from 'react';
import { OrganizerDto } from '@ticketshield/api-client';
import { PurchasedTicketDto, UserBankAccountDto } from '@ticketshield/types';
import { Building2, ChevronDown, Check, Ticket, X, Loader2, ArrowRight, AlertCircle, Pencil } from 'lucide-react';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';

/** Domain Law: một gói vé chỉ chứa từ 2 đến 3 vé (khớp ResaleListing.MaxBundleTickets ở BE). */
const MAX_BUNDLE_TICKETS = 3;

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
  const [eventMismatchError, setEventMismatchError] = useState<string>('');
  const [selectionNotice, setSelectionNotice] = useState<string>('');
  const purchasesDropdownRef = useRef<HTMLDivElement>(null);

  // Parse comma-separated ticket codes into an array of normalized uppercase codes
  const selectedCodes = ticketCode
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

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

  const handleToggleTicket = (t: PurchasedTicketDto) => {
    const code = purchasedPassCode(t).toUpperCase();
    if (!code) return;

    const isAlreadySelected = selectedCodes.includes(code);

    if (isAlreadySelected) {
      const nextCodes = selectedCodes.filter((c) => c !== code);
      setTicketCode(nextCodes.join(', '));
      setEventMismatchError('');
      setSelectionNotice('');
    } else {
      if (selectedCodes.length >= MAX_BUNDLE_TICKETS) {
        setSelectionNotice(`A combo can include at most ${MAX_BUNDLE_TICKETS} tickets. Remove a ticket before adding another.`);
        return;
      }
      // Domain & Business Validation: All tickets in a bundle MUST belong to the same Event (eventId)
      if (selectedCodes.length > 0) {
        const firstSelectedTicket = eligibleTickets.find((item) =>
          selectedCodes.includes(purchasedPassCode(item).toUpperCase())
        );
        if (
          firstSelectedTicket &&
          firstSelectedTicket.eventId &&
          t.eventId &&
          firstSelectedTicket.eventId !== t.eventId
        ) {
          setEventMismatchError(
            `Tất cả các vé trong gói bán phải thuộc cùng 1 sự kiện (${firstSelectedTicket.eventName}).`
          );
          return;
        }
      }
      setEventMismatchError('');
      setSelectionNotice('');
      const nextCodes = [...selectedCodes, code];
      setTicketCode(nextCodes.join(', '));
    }
  };

  const [inputCode, setInputCode] = useState('');

  // Inline edit state cho từng thẻ vé đã chọn
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState<string>('');

  const handleStartEdit = (code: string) => {
    setEditingCode(code);
    setEditInputText(code);
    setSelectionNotice('');
    setEventMismatchError('');
  };

  const handleSaveEdit = (oldCode: string) => {
    const clean = editInputText.trim().toUpperCase();
    if (!clean) {
      // Nếu xóa rỗng, coi như xóa vé đó
      const nextCodes = selectedCodes.filter((c) => c !== oldCode);
      setTicketCode(nextCodes.join(', '));
      setEditingCode(null);
      return;
    }

    if (clean !== oldCode && selectedCodes.includes(clean)) {
      setSelectionNotice(`Mã vé ${clean} đã tồn tại trong danh sách!`);
      return;
    }

    const nextCodes = selectedCodes.map((c) => (c === oldCode ? clean : c));
    setTicketCode(nextCodes.join(', '));
    setEditingCode(null);
    setEditInputText('');
    setSelectionNotice('');
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditInputText('');
  };

  const handleAddManualCode = () => {
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    if (selectedCodes.includes(clean)) {
      setSelectionNotice(`Vé ${clean} đã có trong danh sách.`);
      return;
    }

    if (selectedCodes.length >= MAX_BUNDLE_TICKETS) {
      setSelectionNotice(`Tối đa ${MAX_BUNDLE_TICKETS} vé trong một lượt đăng bán.`);
      return;
    }

    const nextCodes = [...selectedCodes, clean];
    setTicketCode(nextCodes.join(', '));
    setInputCode('');
    setEventMismatchError('');
    setSelectionNotice('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      const clean = inputCode.trim().toUpperCase();
      if (!selectedCodes.includes(clean) && selectedCodes.length < MAX_BUNDLE_TICKETS) {
        const nextCodes = [...selectedCodes, clean];
        setTicketCode(nextCodes.join(', '));
        setInputCode('');
      }
    }
    handleStartVerification(e);
  };

  return (
    <div key={1} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 text-center pt-4">
      {/* Bank Account Optional Notice */}
      {bankAccounts.length === 0 && !isLoadingBankAccounts && (
        <div className="p-4 sm:p-4.5 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left animate-fade-in-up">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-zinc-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-semibold text-white">Payout account (Optional)</h4>
              <p className="text-[11px] sm:text-xs text-[#A3A8B3] leading-relaxed">
                You can link a bank account now or add it after selling to receive payout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddBankAccount}
            className="self-start sm:self-auto px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Link account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6 text-left bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-all duration-300">
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
              className={`w-full h-14 bg-[#05070A] border ${isOrganizerDropdownOpen
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
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOrganizerDropdownOpen ? 'rotate-180 text-[#FF5A36]' : ''
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
                  className={`w-full px-3.5 py-3 rounded-xl text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${!selectedOrganizerId
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
                      className={`w-full px-3.5 py-3 rounded-xl text-left text-sm flex items-center justify-between transition-colors cursor-pointer ${isSelected
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

        {/* 2. Ticket Code Input with Tag/Chip System & 'My Tickets' Multi-Select */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block">
              Mã vé gốc
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/60">
                Đã chọn: {selectedCodes.length}/{MAX_BUNDLE_TICKETS} vé
              </span>
            </div>
          </div>

          {/* Ô nhập mã vé + nút Thêm + nút Vé của tôi */}
          <div className="relative" ref={purchasesDropdownRef}>
            <div
              className={`flex items-center bg-[#05070A] border ${isPurchasesDropdownOpen
                ? 'border-[#FF5A36] ring-4 ring-[#FF5A36]/20'
                : selectedCodes.length > 0
                  ? 'border-[#FF5A36]/40'
                  : 'border-white/15 focus-within:border-[#FF5A36] focus-within:ring-4 focus-within:ring-[#FF5A36]/20'
                } rounded-2xl transition-all duration-200 shadow-inner h-14 pl-4 pr-2 gap-2`}
            >
              <Ticket className="w-4.5 h-4.5 text-[#FF5A36] shrink-0 pointer-events-none" />
              <input
                id="sell-ticket-input"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setEventMismatchError('');
                  setSelectionNotice('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManualCode();
                  }
                }}
                disabled={selectedCodes.length >= MAX_BUNDLE_TICKETS}
                placeholder={
                  selectedCodes.length === 0
                    ? 'Nhập mã vé (VD: ATSH-VIP-888)...'
                    : selectedCodes.length < MAX_BUNDLE_TICKETS
                    ? `Nhập thêm mã vé thứ ${selectedCodes.length + 1}...`
                    : 'Đã chọn đủ 3 vé tối đa'
                }
                className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-mono font-bold tracking-wider text-white placeholder-[#A3A8B3]/35 min-w-0 disabled:opacity-40"
              />

              {/* Nút Thêm vé khi đang gõ */}
              {inputCode.trim() && selectedCodes.length < MAX_BUNDLE_TICKETS && (
                <button
                  type="button"
                  onClick={handleAddManualCode}
                  className="px-3 py-1.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-sm shadow-[#FF5A36]/30 active:scale-95"
                >
                  + Thêm vé
                </button>
              )}

              {/* Phân cách nhẹ */}
              <div className="h-6 w-px bg-white/10 shrink-0" />

              {/* Nút 'Vé của tôi' mở danh sách ví */}
              <button
                type="button"
                onClick={() => {
                  setIsPurchasesDropdownOpen((prev) => !prev);
                  setTicketSearch('');
                  setEventMismatchError('');
                }}
                className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all cursor-pointer ${isPurchasesDropdownOpen || selectedCodes.length > 0
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                  : 'bg-[#151921] hover:bg-[#1C222C] text-zinc-200 border border-white/10'
                  }`}
              >
                <span className="whitespace-nowrap">
                  Vé của tôi {eligibleTickets.length > 0 && `(${eligibleTickets.length})`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isPurchasesDropdownOpen ? 'rotate-180 text-[#FF5A36]' : 'text-zinc-400'
                    }`}
                />
              </button>
            </div>

            {/* Dòng thẻ vé đã chọn độc lập - Cho phép bấm vào để sửa inline trực tiếp */}
            {selectedCodes.length > 0 && (
              <div className="pt-2.5 space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Vé đã chọn ({selectedCodes.length}/{MAX_BUNDLE_TICKETS}) · <span className="text-zinc-500">Bấm vào mã để sửa</span>:
                  </span>
                  {selectedCodes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTicketCode('');
                        setEditingCode(null);
                      }}
                      className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCodes.map((code) => {
                    const matched = eligibleTickets.find(
                      (t) => purchasedPassCode(t).toUpperCase() === code
                    );
                    const isEditing = editingCode === code;

                    if (isEditing) {
                      return (
                        <div
                          key={code}
                          className="inline-flex items-center gap-1.5 p-1 pl-2.5 rounded-xl bg-[#0D121B] border-2 border-[#FF5A36] text-xs shadow-lg shadow-[#FF5A36]/20 animate-in fade-in zoom-in-95"
                        >
                          <Ticket className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                          <input
                            type="text"
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit(code);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                            placeholder="MÃ VÉ..."
                            className="w-36 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-xs font-mono font-bold tracking-wider text-white outline-none focus:border-[#FF5A36]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(code)}
                            className="p-1.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-lg transition-colors cursor-pointer"
                            title="Lưu (Enter)"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Hủy (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={code}
                        className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-[#0D121B] hover:bg-[#121824] border border-white/15 hover:border-white/30 text-xs font-medium text-white shadow-sm transition-all animate-in fade-in zoom-in-95"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                        
                        {/* Bấm vào mã vé để sửa */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(code)}
                          className="font-mono font-bold tracking-wide hover:text-[#FF5A36] transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                          title="Bấm để sửa mã vé này"
                        >
                          <span>{code}</span>
                          <Pencil className="w-3 h-3 text-zinc-500 group-hover:text-[#FF5A36] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {matched && (
                          <span className="text-[11px] text-white/50 border-l border-white/10 pl-2 max-w-[140px] truncate">
                            {matched.tierName || matched.eventName}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const next = selectedCodes.filter((c) => c !== code);
                            setTicketCode(next.join(', '));
                            setSelectionNotice('');
                            setEventMismatchError('');
                            if (editingCode === code) setEditingCode(null);
                          }}
                          className="p-1 text-white/40 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors cursor-pointer ml-0.5"
                          title={`Xóa vé ${code}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dropdown panel: Multi-Select Checklist */}
            {isPurchasesDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0D12] border border-white/15 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                {/* Search bar & quick select controls inside dropdown */}
                <div className="p-2 border-b border-white/[0.06] space-y-2">
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

                {/* Selection limit notice */}
                {selectionNotice && (
                  <div className="mx-2 my-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{selectionNotice}</span>
                    </div>
                    <button type="button" onClick={() => setSelectionNotice('')} className="text-amber-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Event mismatch error banner */}
                {eventMismatchError && (
                  <div className="mx-2 my-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{eventMismatchError}</span>
                    </div>
                    <button type="button" onClick={() => setEventMismatchError('')} className="text-amber-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Ticket checklist */}
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

                    return filtered.map((t) => {
                      const code = purchasedPassCode(t).toUpperCase();
                      const isSelected = selectedCodes.includes(code);

                      return (
                        <div
                          key={t.escrowId}
                          onClick={() => handleToggleTicket(t)}
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${isSelected
                            ? 'bg-[#FF5A36]/15 border-[#FF5A36]/40 text-white'
                            : 'border-transparent hover:bg-white/[0.06] text-zinc-300'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            {/* Visual Checkbox */}
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected
                                ? 'bg-[#FF5A36] text-white shadow-sm'
                                : 'border border-white/20 bg-white/5 hover:border-white/40'
                                }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-[#FF5A36]">{code}</span>
                              </div>
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
                          </div>

                          <span className="text-[11px] font-mono text-[#8B929C] shrink-0">
                            {isSelected ? 'Checked' : 'Select'}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Fixed Action Footer at bottom of dropdown */}
                <div className="p-3 bg-[#080A0E] border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-300">
                    Đã chọn: <span className="text-[#FF5A36] font-bold font-mono">{selectedCodes.length}</span> vé
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCodes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicketCode('');
                          setEventMismatchError('');
                        }}
                        className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsPurchasesDropdownOpen(false)}
                      className="px-4 py-1.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5A36]/20 cursor-pointer"
                    >
                      Xác nhận chọn
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isRequestingOtp || (selectedCodes.length === 0 && !inputCode.trim())}
          className={`w-full h-14 font-bold font-display uppercase tracking-widest text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
            (selectedCodes.length === 0 && !inputCode.trim()) || isRequestingOtp
              ? 'bg-white/[0.07] text-white/50 cursor-not-allowed border border-white/10'
              : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          }`}
        >
          {isRequestingOtp ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang gửi mã OTP...</span>
            </>
          ) : (
            <span>
              {selectedCodes.length > 1
                ? `Xác thực ${selectedCodes.length} vé`
                : 'Xác thực vé'}
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

