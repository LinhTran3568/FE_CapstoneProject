import React, { useState, useRef, useEffect } from 'react';
import { OrganizerDto } from '@ticketshield/api-client';
import { PurchasedTicketDto, UserBankAccountDto } from '@ticketshield/types';
import {
  Building2,
  ChevronDown,
  Check,
  Ticket,
  X,
  Loader2,
  ArrowRight,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  Pencil,
} from 'lucide-react';
import { SeatAdjacencyBadge } from '../ui/SeatAdjacencyBadge';

/** Domain Law: một gói vé chỉ chứa từ 1 đến 3 vé (khớp ResaleListing.MaxBundleTickets ở BE). */
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
  // Dropdown đối tác phát hành vé
  const [isOrganizerDropdownOpen, setIsOrganizerDropdownOpen] = useState(false);
  const organizerDropdownRef = useRef<HTMLDivElement>(null);

  // Parse danh sách mã vé đã chọn trên trang chính (chuỗi phân cách dấu phẩy)
  const selectedCodes = ticketCode
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  // Nhập trực tiếp trên trang chính (khi ví không có vé, hoặc gõ nhanh)
  const [directInputCode, setDirectInputCode] = useState('');
  const [editingCodeOnMain, setEditingCodeOnMain] = useState<string | null>(null);
  const [mainError, setMainError] = useState('');
  const directInputRef = useRef<HTMLInputElement>(null);

  // Dialog chọn vé (Ticket Picker Modal - dành cho trường hợp tài khoản có vé trong ví)
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'add' | 'replace'>('add');
  const [targetReplaceCode, setTargetReplaceCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'manual'>('wallet');

  // Trạng thái tạm thời bên trong Modal
  const [tempSelectedCodes, setTempSelectedCodes] = useState<string[]>([]);
  const [manualModalInputCode, setManualModalInputCode] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [modalNotice, setModalNotice] = useState('');

  // Đóng dropdown đối tác khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (organizerDropdownRef.current && !organizerDropdownRef.current.contains(e.target as Node)) {
        setIsOrganizerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasWalletTickets = eligibleTickets.length > 0;

  // Xử lý thêm mã vé trực tiếp trên trang chính
  const handleAddDirectCode = () => {
    const clean = directInputCode.trim().toUpperCase();
    if (!clean) return;

    if (editingCodeOnMain) {
      if (clean !== editingCodeOnMain && selectedCodes.includes(clean)) {
        setMainError(`Mã vé ${clean} đã có trong gói bán.`);
        return;
      }
      const nextCodes = selectedCodes.map((c) => (c === editingCodeOnMain ? clean : c));
      setTicketCode(nextCodes.join(', '));
      setEditingCodeOnMain(null);
      setDirectInputCode('');
      setMainError('');
      return;
    }

    if (selectedCodes.includes(clean)) {
      setMainError(`Mã vé ${clean} đã có trong gói bán.`);
      return;
    }

    if (selectedCodes.length >= MAX_BUNDLE_TICKETS) {
      setMainError(`Tối đa ${MAX_BUNDLE_TICKETS} vé trong một lượt đăng bán.`);
      return;
    }

    const nextCodes = [...selectedCodes, clean];
    setTicketCode(nextCodes.join(', '));
    setDirectInputCode('');
    setMainError('');
  };

  const handleStartEditDirect = (code: string) => {
    setEditingCodeOnMain(code);
    setDirectInputCode(code);
    setMainError('');
    setTimeout(() => {
      directInputRef.current?.focus();
      directInputRef.current?.select();
    }, 50);
  };

  const handleCancelEditDirect = () => {
    setEditingCodeOnMain(null);
    setDirectInputCode('');
    setMainError('');
  };

  // Xóa một vé khỏi gói
  const handleRemoveTicket = (codeToRemove: string) => {
    const nextCodes = selectedCodes.filter((c) => c !== codeToRemove);
    setTicketCode(nextCodes.join(', '));
    if (editingCodeOnMain === codeToRemove) {
      handleCancelEditDirect();
    }
  };

  // Mở Modal chọn vé (Dành cho tài khoản có vé trong ví)
  const handleOpenAddModal = (defaultTab: 'wallet' | 'manual' = 'wallet') => {
    setPickerMode('add');
    setTargetReplaceCode(null);
    setTempSelectedCodes([...selectedCodes]);
    setActiveTab(defaultTab);
    setManualModalInputCode('');
    setTicketSearch('');
    setModalNotice('');
    setIsPickerModalOpen(true);
  };

  const handleOpenReplaceModal = (codeToReplace: string) => {
    if (!hasWalletTickets) {
      // Nếu không có vé trong ví, sửa trực tiếp trên trang chính
      handleStartEditDirect(codeToReplace);
      return;
    }
    setPickerMode('replace');
    setTargetReplaceCode(codeToReplace);
    setTempSelectedCodes([]);
    setActiveTab('wallet');
    setManualModalInputCode('');
    setTicketSearch('');
    setModalNotice('');
    setIsPickerModalOpen(true);
  };

  // Toggle vé trong Tab "Vé của tôi" (Modal)
  const handleToggleWalletTicket = (ticket: PurchasedTicketDto) => {
    const code = purchasedPassCode(ticket).toUpperCase();
    if (!code) return;

    if (pickerMode === 'replace') {
      if (!targetReplaceCode) return;
      if (code === targetReplaceCode) {
        setIsPickerModalOpen(false);
        return;
      }
      const otherCodes = selectedCodes.filter((c) => c !== targetReplaceCode);
      if (otherCodes.includes(code)) {
        setModalNotice(`Vé ${code} đã có trong gói bán.`);
        return;
      }
      // Ràng buộc cùng sự kiện
      if (otherCodes.length > 0) {
        const refTicket = eligibleTickets.find((t) =>
          otherCodes.includes(purchasedPassCode(t).toUpperCase())
        );
        if (refTicket && refTicket.eventId && ticket.eventId && refTicket.eventId !== ticket.eventId) {
          setModalNotice(
            `Vé này thuộc sự kiện (${ticket.eventName}), không thể ghép cùng sự kiện của các vé còn lại.`
          );
          return;
        }
      }
      const nextCodes = selectedCodes.map((c) => (c === targetReplaceCode ? code : c));
      setTicketCode(nextCodes.join(', '));
      setIsPickerModalOpen(false);
      return;
    }

    // Chế độ thêm vé: Checkbox đa chọn
    if (tempSelectedCodes.includes(code)) {
      setTempSelectedCodes(tempSelectedCodes.filter((c) => c !== code));
      setModalNotice('');
    } else {
      if (tempSelectedCodes.length >= MAX_BUNDLE_TICKETS) {
        setModalNotice(`Tối đa ${MAX_BUNDLE_TICKETS} vé trong một lượt đăng bán.`);
        return;
      }
      // Ràng buộc cùng sự kiện
      if (tempSelectedCodes.length > 0) {
        const refTicket = eligibleTickets.find((t) =>
          tempSelectedCodes.includes(purchasedPassCode(t).toUpperCase())
        );
        if (refTicket && refTicket.eventId && ticket.eventId && refTicket.eventId !== ticket.eventId) {
          setModalNotice(`Tất cả các vé trong gói phải thuộc cùng sự kiện (${refTicket.eventName}).`);
          return;
        }
      }
      setTempSelectedCodes([...tempSelectedCodes, code]);
      setModalNotice('');
    }
  };

  const handleConfirmWalletSelection = () => {
    setTicketCode(tempSelectedCodes.join(', '));
    setIsPickerModalOpen(false);
  };

  const handleConfirmManualModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualModalInputCode.trim().toUpperCase();
    if (!clean) {
      setModalNotice('Vui lòng nhập mã vé.');
      return;
    }

    if (pickerMode === 'replace') {
      if (!targetReplaceCode) return;
      if (clean === targetReplaceCode) {
        setIsPickerModalOpen(false);
        return;
      }
      const otherCodes = selectedCodes.filter((c) => c !== targetReplaceCode);
      if (otherCodes.includes(clean)) {
        setModalNotice(`Mã vé ${clean} đã có trong gói bán.`);
        return;
      }
      const nextCodes = selectedCodes.map((c) => (c === targetReplaceCode ? clean : c));
      setTicketCode(nextCodes.join(', '));
      setIsPickerModalOpen(false);
      return;
    }

    if (selectedCodes.includes(clean)) {
      setModalNotice(`Mã vé ${clean} đã có trong danh sách.`);
      return;
    }
    if (selectedCodes.length >= MAX_BUNDLE_TICKETS) {
      setModalNotice(`Tối đa ${MAX_BUNDLE_TICKETS} vé trong một lượt đăng bán.`);
      return;
    }
    const nextCodes = [...selectedCodes, clean];
    setTicketCode(nextCodes.join(', '));
    setIsPickerModalOpen(false);
  };

  // Xác định sự kiện tham chiếu để disabled các vé khác sự kiện trong Modal
  const activeEventId = (() => {
    if (pickerMode === 'replace' && targetReplaceCode) {
      const otherCodes = selectedCodes.filter((c) => c !== targetReplaceCode);
      const ref = eligibleTickets.find((t) => otherCodes.includes(purchasedPassCode(t).toUpperCase()));
      return ref?.eventId || null;
    }
    if (tempSelectedCodes.length > 0) {
      const ref = eligibleTickets.find((t) => tempSelectedCodes.includes(purchasedPassCode(t).toUpperCase()));
      return ref?.eventId || null;
    }
    return null;
  })();

  // Form submit handler: Nếu người dùng đang gõ mã mà chưa bấm Thêm -> tự động nạp mã và gửi xác thực
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (directInputCode.trim() && !editingCodeOnMain) {
      const clean = directInputCode.trim().toUpperCase();
      if (!selectedCodes.includes(clean) && selectedCodes.length < MAX_BUNDLE_TICKETS) {
        const nextCodes = [...selectedCodes, clean];
        setTicketCode(nextCodes.join(', '));
        setDirectInputCode('');
      }
    }
    handleStartVerification(e);
  };

  return (
    <div key={1} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 text-center pt-4">
      {/* Payout Account Notice */}
      {bankAccounts.length === 0 && !isLoadingBankAccounts && (
        <div className="p-4 sm:p-4.5 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left animate-fade-in-up">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-zinc-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-semibold text-white">Tài khoản nhận tiền (Tùy chọn)</h4>
              <p className="text-[11px] sm:text-xs text-[#A3A8B3] leading-relaxed">
                Bạn có thể liên kết tài khoản ngân hàng ngay hoặc bổ sung sau khi bán thành công.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAddBankAccount}
            className="self-start sm:self-auto px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Liên kết ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleFormSubmit}
        className="space-y-6 text-left bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-all duration-300"
      >
        {/* 1. Nền tảng phát hành vé (Organizer) */}
        <div className="space-y-2">
          <label
            htmlFor="sell-organizer-select"
            className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block"
          >
            Nền tảng phát hành vé
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
                    ? organizers.find((o) => o.id === selectedOrganizerId)?.name || 'Chọn nền tảng phát hành'
                    : 'VieON Entertainment (Mặc định)'}
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
                    <div className="text-[11px] text-[#8B929C]">Mặc định · VieON Ticketing Platform</div>
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

        {/* 2. Danh sách vé đăng bán (Single Source of Truth) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] font-display block">
                Vé đăng bán
              </label>
              <span className="text-[11px] text-zinc-400 mt-0.5 block">
                Bạn có thể đăng bán tối đa 3 vé trong 1 tin combo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                Đã chọn: <span className="text-[#FF5A36] font-bold">{selectedCodes.length}</span>/{MAX_BUNDLE_TICKETS} vé
              </span>
            </div>
          </div>

          {/* Lỗi trên trang chính nếu có */}
          {mainError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{mainError}</span>
              </div>
              <button type="button" onClick={() => setMainError('')} className="text-amber-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRƯỜNG HỢP A: TÀI KHOẢN KHÔNG CÓ VÉ TRONG VÍ (0 VÉ) -> NHẬP TRỰC TIẾP     */}
          {/* ========================================================================= */}
          {!hasWalletTickets ? (
            <div className="space-y-3">
              {/* Danh sách các vé đã nhập (nếu có) */}
              {selectedCodes.length > 0 && (
                <div className="space-y-2">
                  {selectedCodes.map((code, index) => {
                    const isEditingThis = editingCodeOnMain === code;

                    return (
                      <div
                        key={code}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-md ${
                          isEditingThis
                            ? 'bg-[#FF5A36]/10 border-[#FF5A36] ring-2 ring-[#FF5A36]/20'
                            : 'bg-[#0D121B] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/10 border border-[#FF5A36]/25 text-[#FF5A36] flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wide">
                              {code}
                            </span>
                            {isEditingThis && (
                              <span className="text-[10px] text-[#FF5A36] bg-[#FF5A36]/20 px-1.5 py-0.5 rounded font-semibold ml-2">
                                Đang sửa ở dưới
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditDirect(code)}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            title="Sửa mã vé này"
                          >
                            <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTicket(code)}
                            className="p-1.5 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                            title="Xóa vé này khỏi gói"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ô Input nhập mã trực tiếp trên trang chính (Không Modal) */}
              {selectedCodes.length < MAX_BUNDLE_TICKETS && (
                <div className="space-y-1.5">
                  <div
                    className={`flex items-center bg-[#05070A] border ${
                      editingCodeOnMain
                        ? 'border-[#FF5A36] ring-4 ring-[#FF5A36]/20 bg-[#0D121B]'
                        : 'border-white/15 focus-within:border-[#FF5A36] focus-within:ring-4 focus-within:ring-[#FF5A36]/20'
                    } rounded-2xl h-14 pl-4 pr-2 gap-2 transition-all shadow-inner`}
                  >
                    <Ticket className="w-5 h-5 text-[#FF5A36] shrink-0" />
                    <input
                      ref={directInputRef}
                      type="text"
                      value={directInputCode}
                      onChange={(e) => {
                        setDirectInputCode(e.target.value.toUpperCase());
                        setMainError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDirectCode();
                        } else if (e.key === 'Escape' && editingCodeOnMain) {
                          e.preventDefault();
                          handleCancelEditDirect();
                        }
                      }}
                      placeholder={
                        editingCodeOnMain
                          ? `Sửa mã vé ${editingCodeOnMain}...`
                          : selectedCodes.length === 0
                          ? 'Nhập mã vé (VD: ATSH-VIP-888)...'
                          : `Nhập thêm mã vé thứ ${selectedCodes.length + 1}...`
                      }
                      className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-mono font-bold text-white placeholder-zinc-500 tracking-wider min-w-0"
                    />

                    {editingCodeOnMain ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleAddDirectCode}
                          className="px-3 py-1.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-[#FF5A36]/30"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditDirect}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      directInputCode.trim() && (
                        <button
                          type="button"
                          onClick={handleAddDirectCode}
                          className="px-3.5 py-2 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-[#FF5A36]/30 cursor-pointer shrink-0"
                        >
                          + Thêm
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* TRƯỜNG HỢP B: TÀI KHOẢN CÓ VÉ TRONG VÍ -> CHỌN TỪ VÍ HOẶC MODAL           */
            /* ========================================================================= */
            <div className="space-y-3">
              {/* Khi chưa chọn vé nào */}
              {selectedCodes.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-white/15 rounded-2xl bg-white/[0.02] text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF5A36]/10 border border-[#FF5A36]/20 text-[#FF5A36] flex items-center justify-center mx-auto shadow-sm">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Bạn có {eligibleTickets.length} vé trong ví sẵn sàng đăng bán
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Chọn nhanh vé từ tài khoản hoặc nhập mã từ Ban tổ chức
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('wallet')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#FF5A36]/30 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Chọn từ vé của tôi ({eligibleTickets.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('manual')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Nhập mã vé khác
                    </button>
                  </div>
                </div>
              ) : (
                /* Danh sách các thẻ vé đã chọn */
                <div className="space-y-2.5">
                  {selectedCodes.map((code, index) => {
                    const matched = eligibleTickets.find(
                      (t) => purchasedPassCode(t).toUpperCase() === code
                    );

                    return (
                      <div
                        key={code}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#0D121B] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF5A36]/10 border border-[#FF5A36]/25 text-[#FF5A36] flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                            #{index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wide">
                                {code}
                              </span>
                              {matched && (
                                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                                  Vé từ ví
                                </span>
                              )}
                            </div>
                            {matched ? (
                              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 truncate">
                                <span className="font-medium text-zinc-200 truncate">{matched.eventName}</span>
                                <span>·</span>
                                <span>{matched.tierName}</span>
                                {(matched.seatZone || matched.tierName) && (
                                  <SeatAdjacencyBadge
                                    seats={matched.seatZone || matched.tierName}
                                    variant="subtle"
                                    size="xs"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-zinc-400 mt-0.5">Mã vé nhập thủ công</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenReplaceModal(code)}
                            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            title="Đổi vé này sang vé khác"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="hidden sm:inline">Đổi vé</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTicket(code)}
                            className="p-1.5 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                            title="Xóa vé này khỏi gói"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Nút Thêm vé nhỏ gọn dưới danh sách */}
                  {selectedCodes.length < MAX_BUNDLE_TICKETS && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('wallet')}
                      className="w-full py-3 border border-dashed border-white/15 hover:border-[#FF5A36]/60 rounded-2xl bg-white/[0.02] hover:bg-[#FF5A36]/5 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#FF5A36]" />
                      <span>+ Thêm vé thứ {selectedCodes.length + 1} vào gói (Tối đa 3 vé)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Nút Submit bắt đầu xác thực */}
        <button
          type="submit"
          disabled={isRequestingOtp || (selectedCodes.length === 0 && !directInputCode.trim())}
          className={`w-full h-14 font-bold font-display uppercase tracking-widest text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
            (selectedCodes.length === 0 && !directInputCode.trim()) || isRequestingOtp
              ? 'bg-white/[0.07] text-white/50 cursor-not-allowed border border-white/10'
              : 'bg-[#FF5A36] hover:bg-[#FF7252] text-white shadow-lg shadow-[#FF5A36]/30 hover:shadow-xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          }`}
        >
          {isRequestingOtp ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang gửi mã OTP xác thực...</span>
            </>
          ) : (
            <span>
              {selectedCodes.length > 1
                ? `Xác thực ${selectedCodes.length} vé`
                : 'Bắt đầu xác thực vé'}
            </span>
          )}
        </button>
      </form>

      {/* ========================================================================= */}
      {/* DIALOG CHỌN VÉ (Chỉ dùng khi người dùng có vé trong ví)                   */}
      {/* ========================================================================= */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0A0D12] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            {/* Header Dialog */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5A36]/10 border border-[#FF5A36]/20 text-[#FF5A36] flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {pickerMode === 'add' ? 'Thêm vé vào gói bán' : `Đổi vé ${targetReplaceCode}`}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {pickerMode === 'add' ? 'Chọn vé từ ví hoặc nhập mã vé khác' : 'Chọn 1 vé thay thế bên dưới'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="p-3 bg-[#05070A] border-b border-white/10">
              <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('wallet');
                    setModalNotice('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'wallet'
                      ? 'bg-[#FF5A36] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Vé của tôi ({eligibleTickets.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                    setModalNotice('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'manual'
                      ? 'bg-[#FF5A36] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Nhập mã thủ công</span>
                </button>
              </div>
            </div>

            {/* Modal Error Notice */}
            {modalNotice && (
              <div className="mx-4 mt-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{modalNotice}</span>
                </div>
                <button type="button" onClick={() => setModalNotice('')} className="text-amber-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {activeTab === 'wallet' ? (
                <>
                  {/* Search Bar */}
                  <div className="flex items-center gap-2.5 bg-[#05070A] border border-white/10 rounded-xl px-3 h-10 focus-within:border-[#FF5A36]/60 transition-colors">
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Tìm kiếm theo mã vé, tên sự kiện..."
                      className="flex-1 bg-transparent border-0 outline-none text-xs text-white placeholder-zinc-500"
                    />
                    {ticketSearch && (
                      <button
                        type="button"
                        onClick={() => setTicketSearch('')}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Ticket List from Wallet */}
                  <div className="space-y-2 pt-1">
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
                          <div className="py-8 text-center text-xs text-zinc-500">
                            {ticketSearch
                              ? 'Không tìm thấy vé phù hợp.'
                              : 'Bạn chưa có vé nào hợp lệ trong ví.'}
                          </div>
                        );
                      }

                      return filtered.map((t) => {
                        const code = purchasedPassCode(t).toUpperCase();
                        const isCurrentTarget = pickerMode === 'replace' && targetReplaceCode === code;
                        const isOtherSelectedInMain =
                          pickerMode === 'replace' && selectedCodes.includes(code) && code !== targetReplaceCode;
                        const isCheckedInAdd = pickerMode === 'add' && tempSelectedCodes.includes(code);

                        // Ràng buộc cùng sự kiện
                        const isDiffEvent = Boolean(activeEventId && t.eventId && t.eventId !== activeEventId);
                        const isDisabled = isOtherSelectedInMain || isDiffEvent;

                        return (
                          <div
                            key={t.escrowId}
                            onClick={() => {
                              if (isDisabled) return;
                              handleToggleWalletTicket(t);
                            }}
                            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                              isCurrentTarget
                                ? 'bg-[#FF5A36]/15 border-[#FF5A36] text-white ring-1 ring-[#FF5A36]/40 cursor-default'
                                : isCheckedInAdd
                                ? 'bg-[#FF5A36]/15 border-[#FF5A36]/50 text-white cursor-pointer'
                                : isDisabled
                                ? 'opacity-35 bg-white/[0.01] border-transparent cursor-not-allowed text-zinc-500'
                                : 'bg-[#05070A] hover:bg-white/[0.04] border-white/10 hover:border-white/20 text-zinc-200 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                  isCheckedInAdd || isCurrentTarget
                                    ? 'bg-[#FF5A36] text-white'
                                    : isDisabled
                                    ? 'border border-white/10 bg-white/5 text-zinc-600'
                                    : 'border border-white/20 bg-white/5 hover:border-white/40'
                                }`}
                              >
                                {isCheckedInAdd && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                {isCurrentTarget && <RefreshCw className="w-3 h-3 text-white" />}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[#FF5A36]">{code}</span>
                                  {isDiffEvent && (
                                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-sans">
                                      Khác sự kiện
                                    </span>
                                  )}
                                  {isOtherSelectedInMain && (
                                    <span className="text-[10px] text-zinc-400 bg-white/10 px-1.5 py-0.2 rounded font-sans">
                                      Đã trong gói
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-semibold text-white truncate mt-0.5">{t.eventName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-zinc-400 truncate">{t.tierName}</span>
                                  {(t.seatZone || t.tierName) && (
                                    <SeatAdjacencyBadge
                                      seats={t.seatZone || t.tierName}
                                      variant="subtle"
                                      size="xs"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {pickerMode === 'replace' ? (
                                isCurrentTarget ? (
                                  <span className="text-[11px] font-mono text-[#FF5A36] font-bold">Vé đang sửa</span>
                                ) : isOtherSelectedInMain ? (
                                  <span className="text-[11px] font-mono text-zinc-500">Đã chọn</span>
                                ) : isDiffEvent ? (
                                  <span className="text-[11px] font-mono text-zinc-500">Không khớp</span>
                                ) : (
                                  <span className="text-[11px] bg-[#FF5A36] hover:bg-[#FF7252] text-white px-2.5 py-1 rounded-lg font-bold shadow-sm shadow-[#FF5A36]/30 inline-flex items-center gap-1 transition-all">
                                    <span>Đổi vé này</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </span>
                                )
                              ) : (
                                <span className="text-[11px] font-mono text-zinc-400">
                                  {isCheckedInAdd ? 'Đã tick' : 'Chọn'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              ) : (
                /* Tab Nhập mã thủ công */
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={manualModalInputCode}
                      onChange={(e) => {
                        setManualModalInputCode(e.target.value.toUpperCase());
                        setModalNotice('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmManualModal();
                        }
                      }}
                      placeholder="Nhập mã vé (VD: ATSH-VIP-888)..."
                      className="w-full h-12 bg-[#05070A] border border-white/15 focus:border-[#FF5A36] rounded-xl px-4 text-sm font-mono font-bold text-white outline-none tracking-wider placeholder-zinc-500 shadow-inner"
                      autoFocus
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmManualModal}
                    className="w-full h-12 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#FF5A36]/30 cursor-pointer"
                  >
                    {pickerMode === 'replace' ? 'Xác nhận đổi' : 'Thêm mã vé'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer (Chỉ cho Tab Wallet ở chế độ Add) */}
            {activeTab === 'wallet' && pickerMode === 'add' && (
              <div className="p-4 bg-[#05070A] border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  Đã chọn: <span className="text-[#FF5A36] font-bold font-mono">{tempSelectedCodes.length}</span>/
                  {MAX_BUNDLE_TICKETS} vé
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPickerModalOpen(false)}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWalletSelection}
                    className="px-4 py-2 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5A36]/20 cursor-pointer"
                  >
                    Xác nhận thêm ({tempSelectedCodes.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
