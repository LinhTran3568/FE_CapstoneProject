import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, CreditCard, User, Check, RefreshCw, ChevronDown } from 'lucide-react';
import { bankAccountsApi, VIETNAM_BANKS } from '@ticketshield/api-client';
import { UserBankAccountDto } from '@ticketshield/types';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

interface SellerBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAccount: UserBankAccountDto) => void;
}

export const SellerBankAccountModal: React.FC<SellerBankAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [bankCode, setBankCode] = useState('MB');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form step state: 'input' | 'confirm'
  const [modalStep, setModalStep] = useState<'input' | 'confirm'>('input');

  // Bank selection dropdown state
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open to eliminate background double scrollbar
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Click outside to close bank dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    };
    if (isBankDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBankDropdownOpen]);

  // Auto Lookup state
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [isVerifiedName, setIsVerifiedName] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);

  // Effect to automatically lookup account name when bank or accountNumber changes
  useEffect(() => {
    if (!isOpen) return;
    const cleanAcc = accountNumber.trim().replace(/\D/g, '');
    if (cleanAcc.length < 6) {
      setIsVerifiedName(false);
      setLookupFailed(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingName(true);
      setLookupFailed(false);
      try {
        const res = await bankAccountsApi.lookupAccountHolderName(
          bankCode,
          cleanAcc,
        );
        if (res.success && res.accountName) {
          setAccountHolderName(res.accountName);
          setIsVerifiedName(true);
          setLookupFailed(false);
        } else {
          setIsVerifiedName(false);
          setLookupFailed(true);
        }
      } catch (e) {
        console.warn('Could not auto-lookup bank account name', e);
        setIsVerifiedName(false);
        setLookupFailed(true);
      } finally {
        setIsSearchingName(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [bankCode, accountNumber, isOpen]);

  // Reset form state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setAccountNumber('');
      setAccountHolderName('');
      setBankCode('MB');
      setIsDefault(true);
      setIsVerifiedName(false);
      setLookupFailed(false);
      setModalStep('input');
    }
  }, [isOpen]);

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccountNumber = accountNumber.trim();
    const cleanHolderName = accountHolderName.trim().toUpperCase();

    if (!cleanAccountNumber || cleanAccountNumber.length < 6) {
      showToast('Số tài khoản không hợp lệ (tối thiểu 6 chữ số)!', 'warning');
      return;
    }

    if (!cleanHolderName) {
      showToast('Vui lòng nhập tên chủ tài khoản thụ hưởng!', 'warning');
      return;
    }

    setModalStep('confirm');
  };

  const handleConfirmSave = async () => {
    const cleanAccountNumber = accountNumber.trim();
    const cleanHolderName = accountHolderName.trim().toUpperCase();

    try {
      setIsSubmitting(true);
      showToast('Đang kết nối & lưu tài khoản ngân hàng...', 'info');

      const result = await bankAccountsApi.addBankAccount({
        bankCode,
        bankAccountNumber: cleanAccountNumber,
        accountHolderName: cleanHolderName,
        isDefault,
      });

      showToast('Đã liên kết tài khoản ngân hàng thành công!', 'success');
      onSuccess(result);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Không thể lưu tài khoản ngân hàng. Vui lòng thử lại!';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode) || VIETNAM_BANKS[0];

  // Guard: Không render nếu modal chưa mở
  if (!isOpen) return null;

  return createPortal(
    <div
      id="bank-account-modal-backdrop"
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="bank-account-modal-content"
        className="relative w-full max-w-md bg-[#0A0D12] border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-white animate-fade-in-up flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5A36]/10 border border-[#FF5A36]/20 flex items-center justify-center text-[#FF5A36] shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                {modalStep === 'input' ? 'Thêm Tài Khoản Payout' : 'Xác Nhận Lại Tài Khoản'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8B929C] hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* BƯỚC 1: NHẬP LIỆU (KHÔNG HIỂN THỊ REVIEW REALTIME Ở DƯỚI) */}
          {modalStep === 'input' && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Bank Selection Custom Dropdown */}
              <div className="space-y-1.5 relative" ref={bankDropdownRef}>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A3A8B3] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Ngân hàng thụ hưởng *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsBankDropdownOpen((prev) => !prev)}
                  className={`w-full h-11 px-3.5 rounded-xl bg-[#05070A] border ${
                    isBankDropdownOpen ? 'border-[#FF5A36] ring-2 ring-[#FF5A36]/20' : 'border-white/15 hover:border-white/25'
                  } text-xs sm:text-sm text-white flex items-center justify-between transition-all cursor-pointer text-left`}
                >
                  <span className="truncate font-medium">
                    {selectedBank.name} ({selectedBank.code})
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#8B929C] transition-transform duration-200 shrink-0 ${
                    isBankDropdownOpen ? 'rotate-180 text-[#FF5A36]' : ''
                  }`} />
                </button>

                {isBankDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0A0D12] border border-white/15 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 max-h-52 overflow-y-auto space-y-0.5">
                    {VIETNAM_BANKS.map((bank) => {
                      const isSelected = bank.code === bankCode;
                      return (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => {
                            setBankCode(bank.code);
                            setIsBankDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#FF5A36]/15 text-[#FF5A36] font-bold'
                              : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{bank.name} ({bank.code})</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5A36] shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A3A8B3] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Số tài khoản ngân hàng *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="ví dụ: 0938434102"
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#05070A] border border-white/15 text-xs sm:text-sm font-mono font-bold text-white placeholder-white/20 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 transition-all"
                  />
                  {isSearchingName && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FF5A36] animate-spin">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#A3A8B3] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>Tên chủ tài khoản *</span>
                  </label>
                  {isSearchingName && (
                    <span className="text-[10px] text-[#FF5A36] font-mono flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Đang tra cứu...
                    </span>
                  )}
                  {!isSearchingName && isVerifiedName && (
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Bank Verified
                    </span>
                  )}
                  {!isSearchingName && lookupFailed && (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                      ✏️ Nhập thủ công
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    onChange={(e) => {
                      setAccountHolderName(e.target.value.toUpperCase());
                      setIsVerifiedName(false);
                    }}
                    placeholder="NGUYEN VAN A"
                    className={`w-full h-11 px-3.5 rounded-xl bg-[#05070A] border ${
                      isVerifiedName ? 'border-emerald-500/40 text-emerald-300' : 'border-white/15 text-white'
                    } text-xs font-bold uppercase tracking-wider placeholder-white/20 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 transition-all`}
                  />
                </div>
              </div>

              {/* Is Default Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="is-default-account-modal"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#05070A] border border-white/20 text-[#FF5A36] accent-[#FF5A36] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is-default-account-modal" className="text-xs text-[#A3A8B3] hover:text-white transition-colors cursor-pointer select-none">
                  Đặt làm tài khoản nhận tiền mặc định
                </label>
              </div>

              {/* Form Actions for Step 1 */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#A3A8B3] hover:text-white transition-all border border-white/10 cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={accountNumber.length < 6 || !accountHolderName.trim() || isSearchingName}
                  className="px-5 py-2 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(255,90,54,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục</span>
                </button>
              </div>
            </form>
          )}

          {/* BƯỚC 2: Ô XÁC NHẬN LẠI (ACCOUNT REVIEW - CHỈ XUẤT HIỆN KHI ĐÃ NHẬP XONG) */}
          {modalStep === 'confirm' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 rounded-2xl bg-[#05070A] border-2 border-[#FF5A36]/40 space-y-3">
                <div className="text-[10px] text-[#FF5A36] uppercase tracking-wider font-bold flex items-center justify-between">
                  <span>Ô XÁC NHẬN LẠI THÔNG TIN</span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Bank Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#8B929C] uppercase font-mono block">Ngân hàng</span>
                    <span className="text-white font-bold">{selectedBank.name} ({selectedBank.code})</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#8B929C] uppercase font-mono block">Số tài khoản</span>
                    <span className="font-mono text-base font-extrabold text-white tracking-wider">{accountNumber}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#8B929C] uppercase font-mono block">Chủ tài khoản thụ hưởng</span>
                    <span className="text-sm font-black uppercase text-[#FF5A36] tracking-wider block">{accountHolderName}</span>
                  </div>

                  {isDefault && (
                    <div className="pt-1 text-[11px] text-emerald-400 font-medium">
                      ✓ Đặt làm tài khoản nhận tiền mặc định
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions for Step 2 */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalStep('input')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#A3A8B3] hover:text-white transition-all border border-white/10 cursor-pointer"
                >
                  Sửa lại
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(255,90,54,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Xác nhận &amp; Lưu</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};


