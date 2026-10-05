import React, { useState, useRef, useEffect } from 'react';
import { OrganizerDto } from '@ticketshield/api-client';
import { PurchasedTicketDto, UserBankAccountDto } from '@ticketshield/types';
import { Building2, ChevronDown, Check, Ticket, X, Loader2, ArrowRight, AlertCircle, Pencil, Plus } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

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

    // KHI ĐANG Ở CHẾ ĐỘ SỬA VÉ (REPLACE MODE): Đổi trực tiếp vé đang sửa thành vé mới
    if (editingCode) {
      if (code === editingCode) {
        // Click vào chính nó -> hủy chế độ sửa
        handleCancelEdit();
        setIsPurchasesDropdownOpen(false);
        return;
      }

      // Không cho phép chọn vé trùng với các vé còn lại trong gói
      const otherCodes = selectedCodes.filter((c) => c !== editingCode);
      if (otherCodes.includes(code)) {
        setSelectionNotice(`Vé ${code} đã có trong gói bán!`);
        return;
      }

      // Domain Law: Kiểm tra cùng sự kiện (eventId) với các vé còn lại trong gói
      if (otherCodes.length > 0) {
        const remainingTickets = eligibleTickets.filter((item) =>
          otherCodes.includes(purchasedPassCode(item).toUpperCase())
        );
        const diffEvent = remainingTickets.find(
          (item) => item.eventId && t.eventId && item.eventId !== t.eventId
        );
        if (diffEvent) {
          setEventMismatchError(
            `Vé này thuộc sự kiện (${t.eventName}), không cùng sự kiện với các vé còn lại trong gói (${diffEvent.eventName}).`
          );
          return;
        }
      }

      // Thay thế vé tức thì (Instant In-Place Replacement)
      const nextCodes = selectedCodes.map((c) => (c === editingCode ? code : c));
      setTicketCode(nextCodes.join(', '));
      setEditingCode(null);
      setInputCode('');
      setSelectionNotice('');
      setEventMismatchError('');
      setIsPurchasesDropdownOpen(false);
      return;
    }

    // CHẾ ĐỘ BÌNH THƯỜNG (CHECKLIST TOGGLE)
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
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const handleStartEdit = (code: string) => {
    setEditingCode(code);
    setInputCode(code);
    setSelectionNotice('');
    setEventMismatchError('');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleSaveEdit = () => {
    if (!editingCode) return;
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      // Nếu xóa rỗng, coi như xóa vé đó khỏi danh sách
      const nextCodes = selectedCodes.filter((c) => c !== editingCode);
      setTicketCode(nextCodes.join(', '));
      setEditingCode(null);
      setInputCode('');
      return;
    }

    if (clean !== editingCode && selectedCodes.includes(clean)) {
      setSelectionNotice(`Mã vé ${clean} đã tồn tại trong danh sách!`);
      return;
    }

    const nextCodes = selectedCodes.map((c) => (c === editingCode ? clean : c));
    setTicketCode(nextCodes.join(', '));
    setEditingCode(null);
    setInputCode('');
    setSelectionNotice('');
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setInputCode('');
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
    if (editingCode) {
      handleSaveEdit();
      return;
    }
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

          {/* Ô nhập mã vé DUY NHẤT trên toàn màn hình */}
          <div className="relative" ref={purchasesDropdownRef}>
            <div
              className={`flex items-center bg-[#05070A] border ${isPurchasesDropdownOpen
                ? 'border-[#FF5A36] ring-4 ring-[#FF5A36]/20'
                : editingCode
                  ? 'border-[#FF5A36] ring-4 ring-[#FF5A36]/25 bg-[#0D121B]'
                  : selectedCodes.length > 0
                    ? 'border-[#FF5A36]/40'
                    : 'border-white/15 focus-within:border-[#FF5A36] focus-within:ring-4 focus-within:ring-[#FF5A36]/20'
                } rounded-2xl transition-all duration-200 shadow-inner h-14 pl-4 pr-2 gap-2`}
            >
              <Ticket className="w-4.5 h-4.5 text-[#FF5A36] shrink-0 pointer-events-none" />
              <input
                ref={inputRef}
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
                    if (editingCode) {
                      handleSaveEdit();
                    } else if (inputCode.trim()) {
                      handleAddManualCode();
                    } else if (selectedCodes.length > 0) {
                      handleStartVerification(e);
                    }
                  } else if (e.key === 'Escape' && editingCode) {
                    e.preventDefault();
                    handleCancelEdit();
                  }
                }}
                disabled={selectedCodes.length >= MAX_BUNDLE_TICKETS && !editingCode}
                placeholder={
                  editingCode
                    ? `Đang sửa vé ${editingCode} (Enter để lưu, Esc để hủy)...`
                    : selectedCodes.length === 0
                    ? 'Nhập mã vé (VD: ATSH-VIP-888)...'
                    : selectedCodes.length < MAX_BUNDLE_TICKETS
                    ? `Nhập thêm mã vé thứ ${selectedCodes.length + 1}...`
                    : 'Đã chọn đủ 3 vé tối đa'
                }
                className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-mono font-bold tracking-wider text-white placeholder-[#A3A8B3]/35 min-w-0 disabled:opacity-40"
              />

              {/* Nút thao tác khi đang sửa mã vé trên ô input chính */}
              {editingCode && (
                <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-[#FF5A36]/30 active:scale-95"
                    title="Lưu thay đổi (Enter)"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Lưu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    title="Hủy sửa (Esc)"
                  >
                    Hủy
                  </button>
                </div>
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
                className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  editingCode
                    ? 'bg-[#FF5A36]/20 border-2 border-[#FF5A36] text-[#FF5A36] shadow-sm shadow-[#FF5A36]/30'
                    : isPurchasesDropdownOpen || selectedCodes.length > 0
                    ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                    : 'bg-[#151921] hover:bg-[#1C222C] text-zinc-200 border border-white/10'
                }`}
              >
                <span className="whitespace-nowrap">
                  {editingCode ? 'Đổi từ vé của tôi' : `Vé của tôi ${eligibleTickets.length > 0 ? `(${eligibleTickets.length})` : ''}`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isPurchasesDropdownOpen ? 'rotate-180 text-[#FF5A36]' : editingCode ? 'text-[#FF5A36]' : 'text-zinc-400'
                  }`}
                />
              </button>
            </div>

            {/* Dòng thêm vé & danh sách vé trong gói — Luôn hiển thị từ đầu */}
            <div className="pt-2">
              {selectedCodes.length === 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs">
                  <div className="flex items-center gap-2.5 text-zinc-400 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#FF5A36]/10 flex items-center justify-center shrink-0">
                      <Ticket className="w-3.5 h-3.5 text-[#FF5A36]" />
                    </div>
                    <span className="text-zinc-300 truncate">
                      Bán gói combo (2 - 3 vé)? Nhập mã vé ở trên rồi bấm thêm vào gói.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputCode.trim()) {
                        handleAddManualCode();
                      } else {
                        inputRef.current?.focus();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-auto ${
                      inputCode.trim()
                        ? 'bg-[#FF5A36] text-white hover:bg-[#FF7252] shadow-sm shadow-[#FF5A36]/30 active:scale-95'
                        : 'bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm vé vào gói</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-white">Vé trong gói ({selectedCodes.length}/{MAX_BUNDLE_TICKETS})</span>
                      <span className="text-[11px] text-zinc-500 hidden sm:inline">· Bấm mã vé để sửa ở ô trên</span>
                    </div>
                    {selectedCodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicketCode('');
                          setEditingCode(null);
                          setInputCode('');
                          setSelectionNotice('');
                          setEventMismatchError('');
                        }}
                        className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedCodes.map((code) => {
                      const matched = eligibleTickets.find(
                        (t) => purchasedPassCode(t).toUpperCase() === code
                      );
                      const isBeingEdited = editingCode === code;

                      return (
                        <div
                          key={code}
                          className={`group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            isBeingEdited
                              ? 'bg-[#FF5A36]/15 border-2 border-[#FF5A36] text-[#FF5A36] shadow-sm shadow-[#FF5A36]/20'
                              : 'bg-[#0D121B] hover:bg-[#121824] border border-white/15 hover:border-white/30 text-white shadow-sm'
                          }`}
                        >
                          <Ticket className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />

                          <button
                            type="button"
                            onClick={() => handleStartEdit(code)}
                            className="font-mono font-bold tracking-wide hover:text-[#FF5A36] transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                            title="Bấm để sửa mã vé này ở ô nhập trên"
                          >
                            <span>{code}</span>
                            <Pencil className="w-3 h-3 text-zinc-500 group-hover:text-[#FF5A36] transition-colors" />
                          </button>

                          {isBeingEdited && (
                            <div className="flex items-center gap-1.5 animate-in fade-in">
                              <span className="text-[10px] bg-[#FF5A36]/25 text-[#FF5A36] px-1.5 py-0.5 rounded font-sans font-semibold">
                                Đang sửa ở trên
                              </span>
                              {eligibleTickets.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsPurchasesDropdownOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FF5A36] hover:bg-[#FF7252] text-white text-[11px] font-bold transition-all shadow-sm shadow-[#FF5A36]/30 active:scale-95 cursor-pointer"
                                  title="Mở danh sách vé đã mua để đổi"
                                >
                                  <span>Đổi từ ví vé</span>
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {matched && !isBeingEdited && (
                            <span className="text-[11px] text-white/50 border-l border-white/10 pl-2 max-w-[130px] truncate">
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
                              if (editingCode === code) {
                                setEditingCode(null);
                                setInputCode('');
                              }
                            }}
                            className="p-1 text-white/40 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors cursor-pointer ml-0.5"
                            title={`Xóa vé ${code}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Nút thêm vé kế tiếp vào gói nếu chưa đủ 3 vé */}
                    {selectedCodes.length < MAX_BUNDLE_TICKETS && (
                      <button
                        type="button"
                        onClick={() => {
                          if (inputCode.trim() && !editingCode) {
                            handleAddManualCode();
                          } else {
                            inputRef.current?.focus();
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          inputCode.trim() && !editingCode
                            ? 'bg-[#FF5A36] text-white hover:bg-[#FF7252] shadow-sm shadow-[#FF5A36]/30 active:scale-95'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-dashed border-white/20 hover:border-white/40'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm vé thứ {selectedCodes.length + 1}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Selection Notice / Error Banners */}
              {selectionNotice && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{selectionNotice}</span>
                  </div>
                  <button type="button" onClick={() => setSelectionNotice('')} className="text-amber-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {eventMismatchError && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">{eventMismatchError}</span>
                  </div>
                  <button type="button" onClick={() => setEventMismatchError('')} className="text-amber-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown panel: Multi-Select Checklist / Quick Replace */}
            {isPurchasesDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0D12] border border-white/15 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
                {/* Header banner khi đang ở chế độ thay thế vé */}
                {editingCode && (
                  <div className="p-3 bg-[#FF5A36]/15 border-b border-[#FF5A36]/30 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#FF5A36] animate-ping" />
                      <span className="text-xs text-white truncate font-medium">
                        Đang đổi vé <span className="font-mono font-bold text-[#FF5A36]">{editingCode}</span>: Nhấp vé bên dưới để thay thế ngay
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelEdit()}
                      className="px-2.5 py-1 text-[11px] bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 font-semibold"
                    >
                      Hủy đổi
                    </button>
                  </div>
                )}

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
                      const isCurrentEditing = editingCode === code;
                      const isOtherSelected = isSelected && !isCurrentEditing;

                      return (
                        <div
                          key={t.escrowId}
                          onClick={() => {
                            if (isOtherSelected) return;
                            handleToggleTicket(t);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                            isCurrentEditing
                              ? 'bg-[#FF5A36]/20 border-[#FF5A36] text-white ring-1 ring-[#FF5A36]/30 cursor-pointer'
                              : isOtherSelected
                              ? 'opacity-35 bg-white/[0.02] border-transparent cursor-not-allowed text-zinc-500'
                              : editingCode
                              ? 'hover:bg-[#FF5A36]/10 hover:border-[#FF5A36]/40 border-transparent cursor-pointer text-zinc-200'
                              : isSelected
                              ? 'bg-[#FF5A36]/15 border-[#FF5A36]/40 text-white cursor-pointer'
                              : 'border-transparent hover:bg-white/[0.06] text-zinc-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            {/* Visual Indicator */}
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                isCurrentEditing
                                  ? 'bg-[#FF5A36] text-white'
                                  : isOtherSelected
                                  ? 'border border-white/10 bg-white/5 text-zinc-600'
                                  : editingCode
                                  ? 'border border-[#FF5A36]/40 bg-[#FF5A36]/5'
                                  : isSelected
                                  ? 'bg-[#FF5A36] text-white shadow-sm'
                                  : 'border border-white/20 bg-white/5 hover:border-white/40'
                              }`}
                            >
                              {isCurrentEditing ? (
                                <Pencil className="w-3 h-3 text-white" />
                              ) : isOtherSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[2] text-zinc-500" />
                              ) : editingCode ? (
                                <ArrowRight className="w-3 h-3 text-[#FF5A36]" />
                              ) : isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : null}
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

                          <div className="flex items-center gap-1.5 shrink-0">
                            {editingCode ? (
                              isCurrentEditing ? (
                                <span className="text-[11px] font-mono text-[#FF5A36] font-bold">Đang sửa</span>
                              ) : isOtherSelected ? (
                                <span className="text-[11px] font-mono text-zinc-500">Đã trong gói</span>
                              ) : (
                                <span className="text-[11px] font-mono text-white bg-[#FF5A36] hover:bg-[#FF7252] px-2.5 py-1 rounded-lg font-bold shadow-sm shadow-[#FF5A36]/30 transition-all flex items-center gap-1">
                                  <span>Đổi vé này</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] font-mono text-[#8B929C]">
                                {isSelected ? 'Checked' : 'Select'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Fixed Action Footer at bottom of dropdown */}
                {editingCode ? (
                  <div className="p-3 bg-[#080A0E] border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="text-xs text-zinc-400">
                      Bấm <span className="text-white font-semibold">Đổi vé này</span> để thay thế cho <span className="font-mono text-[#FF5A36] font-bold">{editingCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPurchasesDropdownOpen(false);
                        handleCancelEdit();
                      }}
                      className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Hủy đổi
                    </button>
                  </div>
                ) : (
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
                )}
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

