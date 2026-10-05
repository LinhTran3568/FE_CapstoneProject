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

  // Dialog chọn vé (Ticket Picker Modal)
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'add' | 'replace'>('add');
  const [targetReplaceCode, setTargetReplaceCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'manual'>('wallet');

  // Trạng thái tạm thời bên trong Modal
  const [tempSelectedCodes, setTempSelectedCodes] = useState<string[]>([]);
  const [manualInputCode, setManualInputCode] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [modalNotice, setModalNotice] = useState('');

  // Parse danh sách mã vé đã chọn trên trang chính (chuỗi phân cách dấu phẩy)
  const selectedCodes = ticketCode
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

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

  // Mở Modal để Thêm vé
  const handleOpenAddModal = () => {
    setPickerMode('add');
    setTargetReplaceCode(null);
    setTempSelectedCodes([...selectedCodes]);
    setActiveTab(eligibleTickets.length > 0 ? 'wallet' : 'manual');
    setManualInputCode('');
    setTicketSearch('');
    setModalNotice('');
    setIsPickerModalOpen(true);
  };

  // Mở Modal để Đổi vé
  const handleOpenReplaceModal = (codeToReplace: string) => {
    setPickerMode('replace');
    setTargetReplaceCode(codeToReplace);
    setTempSelectedCodes([]);
    setActiveTab(eligibleTickets.length > 0 ? 'wallet' : 'manual');
    setManualInputCode('');
    setTicketSearch('');
    setModalNotice('');
    setIsPickerModalOpen(true);
  };

  // Xóa một vé khỏi gói
  const handleRemoveTicket = (codeToRemove: string) => {
    const nextCodes = selectedCodes.filter((c) => c !== codeToRemove);
    setTicketCode(nextCodes.join(', '));
  };

  // Xóa toàn bộ vé
  const handleClearAll = () => {
    setTicketCode('');
  };

  // Toggle vé trong Tab "Vé của tôi"
  const handleToggleWalletTicket = (ticket: PurchasedTicketDto) => {
    const code = purchasedPassCode(ticket).toUpperCase();
    if (!code) return;

    // CHẾ ĐỘ ĐỔI VÉ (REPLACE MODE): Click 1 vé mới -> Thay thế trực tiếp và đóng Dialog ngay
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
      // Ràng buộc cùng sự kiện với các vé còn lại trong gói
      if (otherCodes.length > 0) {
        const refTicket = eligibleTickets.find((t) =>
          otherCodes.includes(purchasedPassCode(t).toUpperCase())
        );
        if (refTicket && refTicket.eventId && ticket.eventId && refTicket.eventId !== ticket.eventId) {
          setModalNotice(
            `Vé này thuộc sự kiện (${ticket.eventName}), không thể ghép cùng sự kiện của các vé còn lại (${refTicket.eventName}).`
          );
          return;
        }
      }
      const nextCodes = selectedCodes.map((c) => (c === targetReplaceCode ? code : c));
      setTicketCode(nextCodes.join(', '));
      setIsPickerModalOpen(false);
      return;
    }

    // CHẾ ĐỘ THÊM VÉ (ADD MODE): Checkbox đa chọn
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

  // Xác nhận lưu danh sách vé từ Tab "Vé của tôi" (chế độ Thêm)
  const handleConfirmWalletSelection = () => {
    setTicketCode(tempSelectedCodes.join(', '));
    setIsPickerModalOpen(false);
  };

  // Xác nhận thêm/đổi vé từ Tab "Nhập mã thủ công"
  const handleConfirmManualCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualInputCode.trim().toUpperCase();
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

    // Chế độ thêm vé:
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

  // Xác định sự kiện tham chiếu của các vé đã chọn để lọc disabled các vé khác sự kiện
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

  return (
    <div key={1} className="animate-fade-in-up max-w-2xl mx-auto space-y-6 text-center pt-4">
      {/* Payout Account Notice (Nếu chưa liên kết ngân hàng) */}
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
        onSubmit={handleStartVerification}
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

          {/* Khi chưa có vé nào: Empty state slot */}
          {selectedCodes.length === 0 ? (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="w-full py-8 border-2 border-dashed border-white/15 hover:border-[#FF5A36]/60 rounded-2xl bg-white/[0.02] hover:bg-[#FF5A36]/5 transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-[#FF5A36]/20 border border-white/10 group-hover:border-[#FF5A36]/40 flex items-center justify-center text-zinc-400 group-hover:text-[#FF5A36] transition-all shadow-sm">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white group-hover:text-[#FF5A36] transition-colors">
                  + Chọn vé đăng bán
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Chọn từ vé đã mua trong tài khoản hoặc nhập mã từ Ban tổ chức
                </div>
              </div>
            </button>
          ) : (
            <div className="space-y-2.5">
              {/* Danh sách các thẻ vé đã chọn */}
              {selectedCodes.map((code, index) => {
                const matched = eligibleTickets.find((t) => purchasedPassCode(t).toUpperCase() === code);

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
                          <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wide">{code}</span>
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
                              <SeatAdjacencyBadge seats={matched.seatZone || matched.tierName} variant="subtle" size="xs" />
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

              {/* Nút Thêm vé kế tiếp vào gói nếu chưa đủ 3 vé */}
              {selectedCodes.length < MAX_BUNDLE_TICKETS && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="w-full py-3.5 border border-dashed border-white/15 hover:border-[#FF5A36]/60 rounded-2xl bg-white/[0.02] hover:bg-[#FF5A36]/5 text-zinc-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FF5A36]" />
                  <span>+ Thêm vé thứ {selectedCodes.length + 1} vào gói (Tối đa 3 vé)</span>
                </button>
              )}

              {/* Tùy chọn xóa tất cả nếu chọn nhiều vé */}
              {selectedCodes.length > 1 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Xóa tất cả {selectedCodes.length} vé
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Nút Submit bắt đầu xác thực */}
        <button
          type="submit"
          disabled={isRequestingOtp || selectedCodes.length === 0}
          className={`w-full h-14 font-bold font-display uppercase tracking-widest text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
            selectedCodes.length === 0 || isRequestingOtp
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
              {selectedCodes.length > 1 ? `Xác thực ${selectedCodes.length} vé` : 'Bắt đầu xác thực vé'}
            </span>
          )}
        </button>
      </form>

      {/* ========================================================================= */}
      {/* DIALOG CHUYÊN DỤNG CHỌN VÉ (TICKET PICKER MODAL - 2 TABS)                 */}
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
                    {pickerMode === 'add'
                      ? `Đang chọn: ${tempSelectedCodes.length}/${MAX_BUNDLE_TICKETS} vé`
                      : 'Chọn 1 vé thay thế bên dưới'}
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
                              ? 'Không tìm thấy vé phù hợp với từ khóa.'
                              : 'Bạn chưa có vé nào hợp lệ trong ví tài khoản.'}
                          </div>
                        );
                      }

                      return filtered.map((t) => {
                        const code = purchasedPassCode(t).toUpperCase();
                        const isCurrentTarget = pickerMode === 'replace' && targetReplaceCode === code;
                        const isOtherSelectedInMain =
                          pickerMode === 'replace' && selectedCodes.includes(code) && code !== targetReplaceCode;
                        const isCheckedInAdd = pickerMode === 'add' && tempSelectedCodes.includes(code);

                        // Kiểm tra ràng buộc cùng sự kiện (Domain Law)
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
                              {/* Indicator Checkbox hoặc Icon đổi */}
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
                                    <SeatAdjacencyBadge seats={t.seatZone || t.tierName} variant="subtle" size="xs" />
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
                    <label className="text-xs font-semibold text-zinc-300">
                      Nhập mã vé từ Ban tổ chức (VieON)
                    </label>
                    <input
                      type="text"
                      value={manualInputCode}
                      onChange={(e) => {
                        setManualInputCode(e.target.value.toUpperCase());
                        setModalNotice('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmManualCode();
                        }
                      }}
                      placeholder="VD: ATSH-VIP-888..."
                      className="w-full h-12 bg-[#05070A] border border-white/15 focus:border-[#FF5A36] rounded-xl px-4 text-sm font-mono font-bold text-white outline-none tracking-wider placeholder-zinc-500 shadow-inner"
                      autoFocus
                    />
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Mã vé sẽ được chuyển qua hệ thống Ban tổ chức để xác minh tính chính chủ và gửi mã OTP qua SĐT của bạn ở bước kế tiếp.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmManualCode}
                    className="w-full h-12 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#FF5A36]/30 cursor-pointer"
                  >
                    {pickerMode === 'replace' ? 'Xác nhận đổi mã vé' : 'Thêm mã vé này'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer (Chỉ cho Tab Wallet ở chế độ Add) */}
            {activeTab === 'wallet' && pickerMode === 'add' && (
              <div className="p-4 bg-[#05070A] border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  Đã chọn: <span className="text-[#FF5A36] font-bold font-mono">{tempSelectedCodes.length}</span>/{MAX_BUNDLE_TICKETS} vé
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
                    Xác nhận thêm
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
