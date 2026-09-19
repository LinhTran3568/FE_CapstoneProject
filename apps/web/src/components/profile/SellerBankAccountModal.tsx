import React, { useState, useEffect } from 'react';
import { X, Building2, CreditCard, User, ShieldCheck, Check, RefreshCw } from 'lucide-react';
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
  if (!isOpen) return null;

  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [bankCode, setBankCode] = useState('MB');
  const [accountNumber, setAccountNumber] = useState('');
  // Để trống - user phải nhập tên chủ TK đúng theo thẻ ngân hàng, hoặc BE tự tra cứu
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto Lookup state
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [isVerifiedName, setIsVerifiedName] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);

  // Effect to automatically lookup account name when bank or accountNumber changes
  useEffect(() => {
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
          // Chỉ cập nhật tên khi API trả về tên thực từ ngân hàng
          setAccountHolderName(res.accountName);
          setIsVerifiedName(true);
          setLookupFailed(false);
        } else {
          // Lookup thất bại - giữ nguyên tên hiện tại, thông báo nhập thủ công
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
    }, 800);

    return () => clearTimeout(timer);
  }, [bankCode, accountNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAccountNumber = accountNumber.trim();
    const cleanHolderName = accountHolderName.trim().toUpperCase();

    if (!cleanAccountNumber || cleanAccountNumber.length < 6) {
      showToast('Số tài khoản ngân hàng không hợp lệ (tối thiểu 6 chữ số)!', 'warning');
      return;
    }

    if (!cleanHolderName) {
      showToast('Vui lòng nhập tên chủ tài khoản thụ hưởng!', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      showToast('Đang kết nối & lưu thông tin tài khoản ngân hàng...', 'info');

      const result = await bankAccountsApi.addBankAccount({
        bankCode,
        bankAccountNumber: cleanAccountNumber,
        accountHolderName: cleanHolderName,
        isDefault,
      });

      showToast('Đã thêm tài khoản ngân hàng thụ hưởng thành công!', 'success');
      onSuccess(result);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Không thể chèn tài khoản ngân hàng. Vui lòng thử lại!';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode) || VIETNAM_BANKS[0];

  return (
    <div
      id="bank-account-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="bank-account-modal-content"
        className="relative w-full max-w-lg bg-[#0b0e17] border border-[#232738] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d2232] bg-[#111422]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Thêm Tài Khoản Ngân Hàng Thụ Hưởng
              </h2>
              <p className="text-[11px] text-zinc-400">
                Nhận tiền bán vé tự động 24h từ Escrow
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Trust Banner */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-cyan-300">Tự động giải ngân chính chủ</div>
              <div className="text-zinc-300 text-[11px]">
                Tiền thanh toán từ người mua sẽ được TicketShield chuyển trực tiếp vào STK ngân hàng này sau 24h sự kiện hoặc quét mã an toàn.
              </div>
            </div>
          </div>

          {/* Bank Selection Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ngân hàng thụ hưởng *</span>
            </label>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#141826] border border-[#262c40] text-xs text-white focus:outline-none focus:border-[#FF5A36] cursor-pointer"
            >
              {VIETNAM_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code} className="bg-[#0b0e17] text-white">
                  {bank.name} ({bank.code})
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Số tài khoản ngân hàng (STK) *</span>
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
                placeholder="VD: 0938434102"
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#141826] border border-[#262c40] text-sm font-mono font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5A36]"
              />
              {isSearchingName && (
                <div className="absolute right-3 top-3 text-cyan-400 animate-spin">
                  <RefreshCw className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>

          {/* Account Holder Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Tên chủ tài khoản (Viết hoa không dấu) *</span>
              </label>
              {isSearchingName && (
                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Đang tra cứu từ Ngân hàng...
                </span>
              )}
              {!isSearchingName && isVerifiedName && (
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Đã xác thực từ Ngân hàng
                </span>
              )}
              {!isSearchingName && lookupFailed && (
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  ✏️ Vui lòng nhập thủ công
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
                placeholder="Nhập đúng tên chủ TK theo thẻ ngân hàng (VD: NGUYEN VAN A)"
                className={`w-full h-11 px-3.5 rounded-xl bg-[#141826] border ${
                  isVerifiedName ? 'border-emerald-500/50 text-emerald-300' : 'border-[#262c40] text-white'
                } text-xs font-bold uppercase tracking-wide placeholder-zinc-500 focus:outline-none focus:border-[#FF5A36]`}
              />
            </div>
          </div>

          {/* Is Default Checkbox */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="is-default-account"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded bg-[#141826] border-[#262c40] text-[#FF5A36] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="is-default-account" className="text-xs text-zinc-300 font-medium cursor-pointer">
              Đặt làm tài khoản ngân hàng mặc định nhận tiền
            </label>
          </div>

          {/* Account Summary Preview */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1 text-xs font-mono">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Xác nhận thông tin liên kết:</div>
            <div className="text-white font-bold">
              {selectedBank.shortName} • {accountNumber || '0938*******'}
            </div>
            <div className="text-amber-400 font-bold uppercase flex items-center gap-2">
              <span>{accountHolderName || 'TÊN CHỦ TÀI KHOẢN'}</span>
              {isVerifiedName && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-sans uppercase">
                  ✓ Chính chủ Ngân hàng
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#1d2232] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSearchingName}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-95 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Lưu Tài Khoản Ngân Hàng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

