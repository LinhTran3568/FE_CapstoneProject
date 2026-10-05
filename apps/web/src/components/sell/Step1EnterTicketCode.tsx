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
  handleStartVerification: (e: React.FormEvent, overrideCodes?: string[]) => Promise<boolean> | void;
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

  // Ô input thêm vé mới trên trang chính
  const [directInputCode, setDirectInputCode] = useState('');
  const [mainError, setMainError] = useState('');
  const directInputRef = useRef<HTMLInputElement>(null);

  // Sửa trực tiếp NGAY TẠI VỊ TRÍ THẺ VÉ ĐÓ (In-Place Edit)
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');

  // Dialog chọn vé từ ví "Vé của tôi" (My Tickets Modal)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalMode, setWalletModalMode] = useState<'add' | 'replace'>('add');
  const [targetReplaceCode, setTargetReplaceCode] = useState<string | null>(null);
  const [tempSelectedWalletCodes, setTempSelectedWalletCodes] = useState<string[]>([]);
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

  // Xử lý thêm mã vé trực tiếp từ thanh input
  const handleAddDirectCode = () => {
    const clean = directInputCode.trim().toUpperCase();
    if (!clean) return;

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

  // Bắt đầu sửa NGAY TẠI THẺ VÉ ĐÓ
  const handleStartEdit = (code: string) => {
    setEditingCode(code);
    setEditInputText(code);
    setMainError('');
  };

  // Lưu sửa đổi ngay tại vị trí thẻ vé đó
  const handleSaveEdit = (oldCode: string) => {
    const clean = editInputText.trim().toUpperCase();
    if (!clean) {
      handleRemoveTicket(oldCode);
      setEditingCode(null);
      setEditInputText('');
      return;
    }

    if (clean !== oldCode && selectedCodes.includes(clean)) {
      setMainError(`Mã vé ${clean} đã có trong gói bán.`);
      return;
    }

    const nextCodes = selectedCodes.map((c) => (c === oldCode ? clean : c));
    setTicketCode(nextCodes.join(', '));
    setEditingCode(null);
    setEditInputText('');
    setMainError('');
  };

  // Hủy sửa tại chỗ
  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditInputText('');
  };

  // Xóa một vé khỏi gói
  const handleRemoveTicket = (codeToRemove: string) => {
    const nextCodes = selectedCodes.filter((c) => c !== codeToRemove);
    setTicketCode(nextCodes.join(', '));
    if (editingCode === codeToRemove) {
      handleCancelEdit();
    }
  };

  // Xóa toàn bộ vé
  const handleClearAll = () => {
    setTicketCode('');
    handleCancelEdit();
  };

  // Mở Modal "Vé của tôi" để thêm vé
  const handleOpenWalletModalForAdd = () => {
    setWalletModalMode('add');
    setTargetReplaceCode(null);
    setTempSelectedWalletCodes([...selectedCodes]);
    setTicketSearch('');
    setModalNotice('');
    setIsWalletModalOpen(true);
  };

  // Mở Modal "Vé của tôi" để thay thế cho 1 vé đang sửa tại chỗ
  const handleOpenWalletModalForReplace = (codeToReplace: string) => {
    setWalletModalMode('replace');
    setTargetReplaceCode(codeToReplace);
    setTempSelectedWalletCodes([]);
    setTicketSearch('');
    setModalNotice('');
    setIsWalletModalOpen(true);
  };

  // Toggle chọn vé trong Modal "Vé của tôi"
  const handleToggleWalletTicket = (ticket: PurchasedTicketDto) => {
    const code = purchasedPassCode(ticket).toUpperCase();
    if (!code) return;

    // Chế độ thay thế: click 1 phát đổi ngay và đóng Modal
    if (walletModalMode === 'replace') {
      if (!targetReplaceCode) return;
      if (code === targetReplaceCode) {
        setIsWalletModalOpen(false);
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
            `Vé này thuộc sự kiện (${ticket.eventName}), không cùng sự kiện với các vé còn lại.`
          );
          return;
        }
      }
      const nextCodes = selectedCodes.map((c) => (c === targetReplaceCode ? code : c));
      setTicketCode(nextCodes.join(', '));
      setEditingCode(null);
      setEditInputText('');
      setIsWalletModalOpen(false);
      return;
    }

    // Chế độ thêm vé: Checkbox đa chọn
    if (tempSelectedWalletCodes.includes(code)) {
      setTempSelectedWalletCodes(tempSelectedWalletCodes.filter((c) => c !== code));
      setModalNotice('');
    } else {
      if (tempSelectedWalletCodes.length >= MAX_BUNDLE_TICKETS) {
        setModalNotice(`Tối đa ${MAX_BUNDLE_TICKETS} vé trong một lượt đăng bán.`);
        return;
      }
      // Ràng buộc cùng sự kiện
      if (tempSelectedWalletCodes.length > 0) {
        const refTicket = eligibleTickets.find((t) =>
          tempSelectedWalletCodes.includes(purchasedPassCode(t).toUpperCase())
        );
        if (refTicket && refTicket.eventId && ticket.eventId && refTicket.eventId !== ticket.eventId) {
          setModalNotice(`Tất cả các vé trong gói phải thuộc cùng sự kiện (${refTicket.eventName}).`);
          return;
        }
      }
      setTempSelectedWalletCodes([...tempSelectedWalletCodes, code]);
      setModalNotice('');
    }
  };

  const handleConfirmWalletSelection = () => {
    setTicketCode(tempSelectedWalletCodes.join(', '));
    setIsWalletModalOpen(false);
  };

  // Xác định sự kiện tham chiếu để disabled các vé khác sự kiện trong Modal
  const activeEventId = (() => {
    if (walletModalMode === 'replace' && targetReplaceCode) {
      const otherCodes = selectedCodes.filter((c) => c !== targetReplaceCode);
      const ref = eligibleTickets.find((t) => otherCodes.includes(purchasedPassCode(t).toUpperCase()));
      return ref?.eventId || null;
    }
    if (tempSelectedWalletCodes.length > 0) {
      const ref = eligibleTickets.find((t) => tempSelectedWalletCodes.includes(purchasedPassCode(t).toUpperCase()));
      return ref?.eventId || null;
    }
    return null;
  })();

  // Form submit: nếu đang gõ mã mà chưa bấm Thêm -> gửi kèm để xác thực nhưng KHÔNG lưu trước vào bundle!
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCode) {
      handleSaveEdit(editingCode);
      return;
    }

    const pendingCode = directInputCode.trim().toUpperCase();
    const codesToVerify = [...selectedCodes];
    if (pendingCode) {
      if (!codesToVerify.includes(pendingCode)) {
        if (codesToVerify.length >= MAX_BUNDLE_TICKETS) {
          setMainError(`Tối đa ${MAX_BUNDLE_TICKETS} vé trong một lượt đăng bán.`);
          return;
        }
        codesToVerify.push(pendingCode);
      }
    }

    if (codesToVerify.length === 0) {
      setMainError('Vui lòng nhập mã vé trước khi xác thực.');
      return;
    }

    // Gửi danh sách vé cần xác thực mà KHÔNG tự tiện ghi đè state ticketCode trước
    const success = await handleStartVerification(e, codesToVerify);
    if (success) {
      setDirectInputCode('');
      setMainError('');
    }
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

          {/* Danh sách các thẻ vé đã chọn — Hỗ trợ Sửa ngay tại chỗ (In-Place Edit) */}
          {selectedCodes.length > 0 && (
            <div className="space-y-2">
              {selectedCodes.map((code, index) => {
                const isEditingThis = editingCode === code;
                const matched = eligibleTickets.find(
                  (t) => purchasedPassCode(t).toUpperCase() === code
                );

                // =========================================================
                // CHẾ ĐỘ SỬA TRỰC TIẾP TÁI SỬ DỤNG HOÀN TOÀN THANH INPUT CHÍNH (HÌNH 1)
                // =========================================================
                if (isEditingThis) {
                  return (
                    <div
                      key={code}
                      className="flex items-center bg-[#05070A] border border-[#FF5A36] ring-2 ring-[#FF5A36]/20 rounded-2xl h-14 pl-3.5 pr-2 gap-2 transition-colors shadow-inner"
                    >
                      {/* Badge số thứ tự vé */}
                      <div className="w-7 h-7 rounded-lg bg-[#FF5A36]/15 border border-[#FF5A36]/30 text-[#FF5A36] flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                        #{index + 1}
                      </div>

                      {/* Input trong suốt không viền con */}
                      <input
                        type="text"
                        value={editInputText}
                        onChange={(e) => setEditInputText(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEdit(code);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                        placeholder="Nhập mã vé..."
                        className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-mono font-bold text-white placeholder-zinc-500 tracking-wider min-w-0"
                      />

                      {/* Cụm nút Lưu & Hủy */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(code)}
                          className="h-9 px-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-[#FF5A36]/30 cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Lưu (Enter)"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Lưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="h-9 px-3 bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Hủy (Esc)"
                        >
                          Hủy
                        </button>
                      </div>

                      {/* Vạch phân cách */}
                      <div className="h-6 w-px bg-white/10 shrink-0" />

                      {/* Nút "Vé của tôi" (LUÔN LUÔN HIỆN DIỆN ĐỂ CHỌN THAY THẾ) */}
                      <button
                        type="button"
                        onClick={() => handleOpenWalletModalForReplace(code)}
                        className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all cursor-pointer bg-[#151921] hover:bg-[#1C222C] text-zinc-200 hover:text-white border border-white/10"
                        title="Chọn vé từ ví tài khoản để thay thế mã này"
                      >
                        <span className="whitespace-nowrap">
                          Vé của tôi {eligibleTickets.length > 0 ? `(${eligibleTickets.length})` : '(0)'}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                    </div>
                  );
                }

                // =========================================================
                // CHẾ ĐỘ HIỂN THỊ THẺ VÉ BÌNH THƯỜNG (CỐ ĐỊNH H-14 ĐỒNG NHẤT)
                // =========================================================
                return (
                  <div
                    key={code}
                    className="flex items-center justify-between bg-[#0D121B] border border-white/10 hover:border-white/20 rounded-2xl h-14 pl-3.5 pr-2 gap-2 transition-colors shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#FF5A36]/10 border border-[#FF5A36]/25 text-[#FF5A36] flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                        #{index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm sm:text-base text-white tracking-wide shrink-0">
                            {code}
                          </span>
                          {matched ? (
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium shrink-0">
                                Vé ví
                              </span>
                              <span className="text-xs text-zinc-400 truncate hidden sm:inline">
                                · {matched.eventName} ({matched.tierName})
                              </span>
                              {(matched.seatZone || matched.tierName) && (
                                <div className="hidden md:inline-flex">
                                  <SeatAdjacencyBadge
                                    seats={matched.seatZone || matched.tierName}
                                    variant="subtle"
                                    size="xs"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500 truncate hidden sm:inline">
                              · Mã vé nhập thủ công
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(code)}
                        className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="Sửa mã vé này"
                      >
                        <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTicket(code)}
                        className="h-9 w-9 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                        title="Xóa vé này khỏi gói"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Tùy chọn xóa tất cả nếu có nhiều vé */}
              {selectedCodes.length > 1 && !editingCode && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Xóa tất cả {selectedCodes.length} vé
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* THANH NHẬP MÃ VÉ CHÍNH + NÚT "VÉ CỦA TÔI" (LUÔN LUÔN HIỆN DIỆN)          */}
          {/* ========================================================================= */}
          {selectedCodes.length < MAX_BUNDLE_TICKETS && !editingCode && (
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center bg-[#05070A] border border-white/15 focus-within:border-[#FF5A36] focus-within:ring-2 focus-within:ring-[#FF5A36]/20 rounded-2xl h-14 pl-3.5 pr-2 gap-2 transition-colors shadow-inner">
                <Ticket className="w-5 h-5 text-[#FF5A36] shrink-0 pointer-events-none" />
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
                    }
                  }}
                  placeholder={
                    selectedCodes.length === 0
                      ? 'Nhập mã vé (VD: ATSH-VIP-888)...'
                      : `Nhập thêm mã vé thứ ${selectedCodes.length + 1}...`
                  }
                  className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base font-mono font-bold text-white placeholder-zinc-500 tracking-wider min-w-0"
                />

                {/* Nút Thêm vé khi đang gõ */}
                {directInputCode.trim() && (
                  <button
                    type="button"
                    onClick={handleAddDirectCode}
                    className="h-9 px-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-[#FF5A36]/30 cursor-pointer shrink-0 active:scale-95 flex items-center justify-center"
                  >
                    + Thêm
                  </button>
                )}

                {/* Phân cách nhẹ */}
                <div className="h-6 w-px bg-white/10 shrink-0" />

                {/* Nút "Vé của tôi" (LUÔN LUÔN HIỆN DIỆN ĐỂ MỞ VÍ VÉ) */}
                <button
                  type="button"
                  onClick={handleOpenWalletModalForAdd}
                  className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all cursor-pointer bg-[#151921] hover:bg-[#1C222C] text-zinc-200 hover:text-white border border-white/10"
                >
                  <span className="whitespace-nowrap">
                    Vé của tôi {eligibleTickets.length > 0 ? `(${eligibleTickets.length})` : '(0)'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
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
              {(() => {
                const pending = directInputCode.trim().toUpperCase();
                const total = selectedCodes.length + (pending && !selectedCodes.includes(pending) ? 1 : 0);
                return total > 1 ? `Xác thực ${total} vé` : 'Bắt đầu xác thực vé';
              })()}
            </span>
          )}
        </button>
      </form>

      {/* ========================================================================= */}
      {/* MODAL "VÉ CỦA TÔI" (DÙNG ĐỂ CHỌN VÉ CÓ SẴN TRONG TÀI KHOẢN)                */}
      {/* ========================================================================= */}
      {isWalletModalOpen && (
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
                    {walletModalMode === 'add' ? 'Vé trong tài khoản của bạn' : `Đổi vé ${targetReplaceCode}`}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {walletModalMode === 'add'
                      ? `Chọn tối đa ${MAX_BUNDLE_TICKETS} vé để đăng bán combo`
                      : 'Chọn 1 vé từ ví để thay thế'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
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
              {eligibleTickets.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center mx-auto">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Chưa có vé nào trong ví</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Tài khoản của bạn hiện chưa sở hữu vé sự kiện nào trên TicketShield. Bạn có thể nhập mã vé Ban tổ chức cấp ở ô bên ngoài.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWalletModalOpen(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Đã hiểu, quay lại
                  </button>
                </div>
              ) : (
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

                  {/* Danh sách vé */}
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
                            Không tìm thấy vé phù hợp với từ khóa.
                          </div>
                        );
                      }

                      return filtered.map((t) => {
                        const code = purchasedPassCode(t).toUpperCase();
                        const isCurrentTarget = walletModalMode === 'replace' && targetReplaceCode === code;
                        const isOtherSelectedInMain =
                          walletModalMode === 'replace' && selectedCodes.includes(code) && code !== targetReplaceCode;
                        const isCheckedInAdd = walletModalMode === 'add' && tempSelectedWalletCodes.includes(code);

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
                                {isCurrentTarget && <Check className="w-3.5 h-3.5 text-white" />}
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
                              {walletModalMode === 'replace' ? (
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
              )}
            </div>

            {/* Modal Footer (Chỉ cho chế độ Add khi có vé) */}
            {eligibleTickets.length > 0 && walletModalMode === 'add' && (
              <div className="p-4 bg-[#05070A] border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  Đã chọn: <span className="text-[#FF5A36] font-bold font-mono">{tempSelectedWalletCodes.length}</span>/
                  {MAX_BUNDLE_TICKETS} vé
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWalletModalOpen(false)}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWalletSelection}
                    className="px-4 py-2 bg-[#FF5A36] hover:bg-[#FF7252] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5A36]/20 cursor-pointer"
                  >
                    Xác nhận chọn ({tempSelectedWalletCodes.length})
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
