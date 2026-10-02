import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, 
  CreditCard, 
  User, 
  Check, 
  RefreshCw, 
  ChevronDown, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Plus,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { bankAccountsApi, VIETNAM_BANKS } from '@ticketshield/api-client';
import { UserBankAccountDto } from '@ticketshield/types';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';

export const PayoutAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  // Danh sách tài khoản đã liên kết
  const [bankAccounts, setBankAccounts] = useState<UserBankAccountDto[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  // Form State: step 1 = nhập liệu, step 2 = xác nhận lại
  const [formStep, setFormStep] = useState<'input' | 'confirm'>('input');
  const [bankCode, setBankCode] = useState<string>('MB');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto-lookup trạng thái
  const [isSearchingName, setIsSearchingName] = useState<boolean>(false);
  const [isVerifiedName, setIsVerifiedName] = useState<boolean>(false);
  const [lookupFailed, setLookupFailed] = useState<boolean>(false);

  // Dropdown ngân hàng
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState<boolean>(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Load danh sách tài khoản
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoadingList(true);
      const res = await bankAccountsApi.getMyBankAccounts();
      setBankAccounts(res || []);
    } catch (err) {
      console.warn('Could not load bank accounts', err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Đóng dropdown khi click ra ngoài
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

  // Tự động tra cứu tên chủ tài khoản từ Core Banking
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
        const res = await bankAccountsApi.lookupAccountHolderName(bankCode, cleanAcc);
        if (res.success && res.accountName) {
          setAccountHolderName(res.accountName);
          setIsVerifiedName(true);
          setLookupFailed(false);
        } else {
          setIsVerifiedName(false);
          setLookupFailed(true);
        }
      } catch {
        setIsVerifiedName(false);
        setLookupFailed(true);
      } finally {
        setIsSearchingName(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [bankCode, accountNumber]);

  const selectedBank = VIETNAM_BANKS.find((b) => b.code === bankCode) || VIETNAM_BANKS[0];

  const getBankNameByCode = (code: string) => {
    const b = VIETNAM_BANKS.find((item) => item.code.toUpperCase() === code.toUpperCase());
    return b ? b.name : code;
  };

  // Bước 1 -> Bước 2: Chuyển sang ô xác nhận lại
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAcc = accountNumber.trim().replace(/\D/g, '');
    const cleanName = accountHolderName.trim().toUpperCase();

    if (!cleanAcc || cleanAcc.length < 6) {
      showToast('Invalid account number (minimum 6 digits required)!', 'warning');
      return;
    }

    if (!cleanName) {
      showToast('Please enter the beneficiary account holder name!', 'warning');
      return;
    }

    setAccountNumber(cleanAcc);
    setAccountHolderName(cleanName);
    setFormStep('confirm');
  };

  // Bước 2: Xác nhận và Lưu tài khoản
  const handleConfirmSave = async () => {
    try {
      setIsSubmitting(true);
      showToast('Connecting and saving bank account...', 'info');

      const result = await bankAccountsApi.addBankAccount({
        bankCode,
        bankAccountNumber: accountNumber,
        accountHolderName: accountHolderName,
        isDefault,
      });

      showToast('Bank account linked successfully!', 'success');
      
      // Cập nhật danh sách tài khoản
      setBankAccounts((prev) => {
        const updated = prev.map((a) => ({
          ...a,
          isDefault: result.isDefault ? false : a.isDefault,
        }));
        return [result, ...updated];
      });

      // Reset form
      setAccountNumber('');
      setAccountHolderName('');
      setBankCode('MB');
      setIsDefault(true);
      setIsVerifiedName(false);
      setLookupFailed(false);
      setFormStep('input');

      // Nếu có returnUrl, gợi ý hoặc cho phép quay lại
      if (returnUrl) {
        showToast('Account ready! You can now return to continue.', 'success');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to link bank account. Please try again!';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-24 pb-20 px-4 sm:px-6 md:px-12 selection:bg-[#FF5A36] selection:text-white font-sans antialiased overflow-hidden">
      {/* Background Concert Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Concert Background"
          className="w-full h-full object-cover opacity-20 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/95 via-[#05070A]/90 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Top Navigation & Return CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {returnUrl ? (
              <button
                type="button"
                onClick={() => navigate(returnUrl)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#A3A8B3] hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#FF5A36]" />
                <span>Back to previous page</span>
              </button>
            ) : (
              <Link
                to="/profile"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#A3A8B3] hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#FF5A36]" />
                <span>Back to Profile</span>
              </Link>
            )}
          </div>

          {returnUrl && bankAccounts.length > 0 && (
            <button
              type="button"
              onClick={() => navigate(returnUrl)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>Account linked • Continue Selling</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Page Header Banner */}
        <div className="bg-gradient-to-r from-[#0A0D12] via-[#0F141C] to-[#0A0D12] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5A36] to-amber-500 text-white flex items-center justify-center shadow-xl shadow-[#FF5A36]/25 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight">
                Payout Accounts
              </h1>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Linked Accounts List (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      <span>Linked Accounts</span>
                    </h2>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-400 border border-white/10">
                      {bankAccounts.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3A8B3]">Beneficiary accounts for payout settlements</p>
                </div>
                <button
                  type="button"
                  onClick={fetchAccounts}
                  disabled={isLoadingList}
                  className="p-2 text-[#8B929C] hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-[#FF5A36]' : ''}`} />
                </button>
              </div>

              {isLoadingList ? (
                <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF5A36]" />
                  <span>Loading bank accounts...</span>
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="p-8 text-center bg-[#05070A] border border-dashed border-white/15 rounded-2xl space-y-3">
                  <CreditCard className="w-10 h-10 text-zinc-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">No payout account linked</h3>
                    <p className="text-xs text-[#A3A8B3]">
                      Add your beneficiary bank account using the form on the right to receive automatic payouts.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        account.isDefault
                          ? 'bg-gradient-to-r from-emerald-950/40 via-[#05070A] to-[#05070A] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                          : 'bg-[#05070A] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                            {account.bankCode}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {getBankNameByCode(account.bankCode)}
                          </span>
                        </div>
                        {account.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold font-mono uppercase shrink-0">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-base sm:text-lg font-extrabold text-white tracking-widest mb-1">
                        {account.bankAccountNumber}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-amber-400 uppercase tracking-wider truncate">
                          {account.accountHolderName}
                        </div>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <Check className="w-3 h-3 stroke-[3]" /> Bank Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}


            </div>
          </div>

          {/* RIGHT COLUMN: Add Bank Account Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
              
              {/* Form Step Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#FF5A36]" />
                    <span>{formStep === 'input' ? 'Add Bank Account' : 'Confirm Account Details'}</span>
                  </h2>
                  <p className="text-xs text-[#A3A8B3]">
                    {formStep === 'input' 
                      ? 'Step 1: Enter beneficiary account number and bank' 
                      : 'Step 2: Review account details before saving'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    formStep === 'input' ? 'bg-[#FF5A36] text-white' : 'bg-emerald-500 text-black'
                  }`}>
                    {formStep === 'confirm' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                  </span>
                  <div className={`w-8 h-0.5 ${formStep === 'confirm' ? 'bg-emerald-500' : 'bg-white/20'}`} />
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                    formStep === 'confirm' ? 'bg-[#FF5A36] text-white' : 'bg-white/10 text-[#8B929C]'
                  }`}>
                    2
                  </span>
                </div>
              </div>

              {/* STEP 1: FORM INPUT */}
              {formStep === 'input' && (
                <form onSubmit={handleProceedToConfirm} className="space-y-5">
                  {/* Beneficiary Bank Select */}
                  <div className="space-y-1.5 relative" ref={bankDropdownRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>Beneficiary Bank *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBankDropdownOpen((prev) => !prev)}
                      className={`w-full h-12 px-4 rounded-xl bg-[#05070A] border ${
                        isBankDropdownOpen ? 'border-[#FF5A36] ring-2 ring-[#FF5A36]/20' : 'border-white/15 hover:border-white/25'
                      } text-sm text-white flex items-center justify-between transition-all cursor-pointer text-left`}
                    >
                      <span className="truncate font-medium">
                        {selectedBank.name} ({selectedBank.code})
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#8B929C] transition-transform duration-200 shrink-0 ${
                        isBankDropdownOpen ? 'rotate-180 text-[#FF5A36]' : ''
                      }`} />
                    </button>

                    {isBankDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0A0D12] border border-white/15 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
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
                              className={`w-full px-3.5 py-2.5 rounded-lg text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FF5A36]/15 text-[#FF5A36] font-bold'
                                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{bank.name} ({bank.code})</span>
                              {isSelected && <Check className="w-4 h-4 text-[#FF5A36] shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>Bank Account Number *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter account number (e.g. 0938434102)"
                        className="w-full h-12 px-4 pr-11 rounded-xl bg-[#05070A] border border-white/15 text-sm font-mono font-bold text-white placeholder-white/20 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 transition-all"
                      />
                      {isSearchingName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF5A36] animate-spin">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A8B3] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#FF5A36]" />
                        <span>Account Holder Name *</span>
                      </label>
                      {isSearchingName && (
                        <span className="text-[11px] text-[#FF5A36] font-mono flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Verifying with bank...
                        </span>
                      )}
                      {!isSearchingName && isVerifiedName && (
                        <span className="text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Bank Verified
                        </span>
                      )}
                      {!isSearchingName && lookupFailed && (
                        <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                          ✏️ Enter name manually
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={accountHolderName}
                        onChange={(e) => {
                          setAccountHolderName(e.target.value.toUpperCase());
                          setIsVerifiedName(false);
                        }}
                        placeholder="NGUYEN VAN A"
                        className={`w-full h-12 px-4 rounded-xl bg-[#05070A] border ${
                          isVerifiedName ? 'border-emerald-500/40 text-emerald-300' : 'border-white/15 text-white'
                        } text-sm font-bold uppercase tracking-wider placeholder-white/20 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 transition-all`}
                      />
                    </div>
                  </div>

                  {/* Default Account Option */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="page-is-default-account"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#05070A] border border-white/20 text-[#FF5A36] accent-[#FF5A36] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="page-is-default-account" className="text-xs sm:text-sm text-[#A3A8B3] hover:text-white transition-colors cursor-pointer select-none">
                      Set as default payout account
                    </label>
                  </div>

                  {/* Continue Button */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={accountNumber.length < 6 || !accountHolderName.trim() || isSearchingName}
                      className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Review</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: CONFIRM ACCOUNT DETAILS */}
              {formStep === 'confirm' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0F141C] via-[#05070A] to-[#0A0D12] border-2 border-[#FF5A36]/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5A36] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        CONFIRM ACCOUNT DETAILS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono text-[#8B929C]">Bank</div>
                        <div className="font-bold text-white text-sm">
                          {selectedBank.name} ({selectedBank.code})
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-mono text-[#8B929C]">Account Number</div>
                        <div className="font-mono text-base font-extrabold text-white tracking-widest">
                          {accountNumber}
                        </div>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <div className="text-[10px] uppercase font-mono text-[#8B929C]">Account Holder Name</div>
                        <div className="font-mono text-base sm:text-lg font-black uppercase text-[#FF5A36] tracking-wider">
                          {accountHolderName}
                        </div>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <div className="text-[10px] uppercase font-mono text-[#8B929C]">Account Role</div>
                        <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isDefault ? 'Default Payout Account' : 'Secondary Account'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Please verify your bank account number and beneficiary name before confirming.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setFormStep('input')}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#A3A8B3] hover:text-white transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmSave}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving Account...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Confirm &amp; Save Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PayoutAccountsPage;
