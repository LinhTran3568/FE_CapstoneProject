import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Key, 
  Ticket, 
  Wallet, 
  CheckCircle2, 
  PlusCircle, 
  LogOut,
  Edit3,
  Award,
  Sparkles,
  Lock,
  ArrowRight,
  Building2,
  CreditCard,
  Plus,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, bankAccountsApi, VIETNAM_BANKS } from '@ticketshield/api-client';
import { UserBankAccountDto } from '@ticketshield/types';
import { SellerBankAccountModal } from '../components/profile/SellerBankAccountModal';

export const ProfilePage: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'tickets' | 'wallet'>('profile');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  // Bank Accounts Management State (FE-3.1.2)
  const [bankAccounts, setBankAccounts] = useState<UserBankAccountDto[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const isReseller = 
    user?.role === 'RESELLER' || 
    (user?.role as string) === 'SELLER';

  // Fetch Linked Seller Bank Accounts & Sync profile data from Backend API
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      fetchBankAccounts();
    }
  }, [user?.id, user?.fullName, user?.phoneNumber]);

  const fetchBankAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const list = await bankAccountsApi.getMyBankAccounts();
      setBankAccounts(list || []);
    } catch (err: any) {
      // Silently handle if network or fallback
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name cannot be empty.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await authApi.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      setUser(updatedUser);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Profile update failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  const getBankNameByCode = (code: string) => {
    const bank = VIETNAM_BANKS.find((b) => b.code.toUpperCase() === code.toUpperCase());
    return bank ? bank.shortName : code;
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-extrabold font-display text-white">Please Sign In</h2>
        <p className="text-[#A3A8B3] text-sm">You need to sign in to view your profile page.</p>
        <Link
          to="/login"
          className="inline-block px-8 py-3 bg-[#FF5A36] text-white font-bold font-display uppercase tracking-widest text-xs rounded-full shadow-lg shadow-[#FF5A36]/30"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 selection:bg-[#FF5A36] selection:text-white font-sans antialiased overflow-hidden">
      {/* Background Concert Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Concert Background"
          className="w-full h-full object-cover opacity-25 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/85 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Profile Banner Card */}
        <div className="bg-gradient-to-r from-[#0A0D12] via-[#0F141C] to-[#0A0D12] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-6 relative z-10">
            {/* Avatar Circle */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF5A36] to-amber-500 text-white font-extrabold font-display text-3xl flex items-center justify-center shadow-xl shadow-[#FF5A36]/20">
                {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="w-8 h-8" />}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#0A0D12] p-1 rounded-full text-white" title="Verified Account">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* User Meta Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight">
                  {user.fullName || 'User Profile'}
                </h1>
                {isReseller ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-[#FF5A36] to-amber-500 text-white text-[11px] font-extrabold font-mono uppercase tracking-widest rounded-full shadow-lg shadow-[#FF5A36]/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Verified Seller
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-white/10 text-[#A3A8B3] text-[11px] font-bold font-mono uppercase tracking-wider rounded-full">
                    {user.role || 'Member'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A3A8B3] font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#FF5A36]" /> {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> {user.phoneNumber || 'Not provided'}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Real Fan Verified
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            {isReseller && (
              <a
                href="/sell-ticket"
                className="flex-1 md:flex-none px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Ticket</span>
              </a>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-red-500/50 text-[#A3A8B3] hover:text-red-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Reseller Stats Strip */}
        {isReseller && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-display">Active Listings</span>
              <p className="text-2xl font-bold font-display text-white">8 <span className="text-xs font-normal text-[#A3A8B3]">Tickets</span></p>
            </div>
            <div className="bg-[#0A0D12] border border-[#FF5A36]/30 p-5 rounded-2xl space-y-1 bg-gradient-to-b from-[#FF5A36]/5 to-transparent">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-display">Payout Accounts</span>
              <p className="text-2xl font-bold font-display text-white">{bankAccounts.length} <span className="text-xs font-normal text-[#A3A8B3]">Accounts</span></p>
            </div>
            <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-display">Completed Sales</span>
              <p className="text-2xl font-bold font-display text-emerald-400">32,500,000 <span className="text-xs font-normal text-[#A3A8B3]">VND</span></p>
            </div>
            <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-display">Trust Score</span>
              <p className="text-2xl font-bold font-display text-amber-400">99.8% <span className="text-xs font-normal text-[#A3A8B3]">Platinum</span></p>
            </div>
          </div>
        )}

        {/* Profile Navigation Tabs */}
        <div className="flex border-b border-white/10 space-x-8 text-sm font-medium font-display">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 transition-colors relative cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>Account Details</span>
            {activeTab === 'profile' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-4 transition-colors relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'listings'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>My Listings</span>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white">8</span>
            {activeTab === 'listings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-4 transition-colors relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tickets'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>My Tickets</span>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white">3</span>
            {activeTab === 'tickets' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-4 transition-colors relative flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'wallet'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>Wallet &amp; Banks</span>
            {bankAccounts.length > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
                {bankAccounts.length} Banks
              </span>
            )}
            {activeTab === 'wallet' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content: Profile & Bank Accounts */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Edit Personal Details Form */}
            <div className="lg:col-span-7 bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#FF5A36]" /> Personal Profile
                </h3>
                <p className="text-xs text-[#A3A8B3]">Update your contact details and display name.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-[#05070A]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#A3A8B3] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Contact Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0912345678"
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF5A36] placeholder:text-gray-600"
                  />
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Seller Beneficiary Bank Accounts Card (FE-3.1.2) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" /> Payout Bank Account
                    </h4>
                    <p className="text-[11px] text-[#A3A8B3]">Automatic payout account after 24h protection</p>
                  </div>
                  <button
                    onClick={() => setIsBankModalOpen(true)}
                    className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl transition-all cursor-pointer"
                    title="Add Bank Account"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Bank Accounts List */}
                {isLoadingAccounts ? (
                  <div className="p-6 text-center text-xs text-zinc-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#FF5A36]" />
                    <span>Loading bank accounts...</span>
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="p-6 text-center bg-[#05070A] border border-white/10 rounded-2xl space-y-3">
                    <CreditCard className="w-8 h-8 text-zinc-500 mx-auto" />
                    <div className="text-xs text-[#A3A8B3]">
                      No payout bank account linked yet.
                    </div>
                    <button
                      onClick={() => setIsBankModalOpen(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Link Bank Account Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                          account.isDefault
                            ? 'bg-gradient-to-r from-emerald-950/40 via-[#05070A] to-[#05070A] border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                            : 'bg-[#05070A] border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                                {account.bankCode}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {getBankNameByCode(account.bankCode)}
                              </span>
                              {account.isDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold font-mono uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-base font-extrabold text-white tracking-widest">
                              {account.bankAccountNumber}
                            </div>
                            <div className="text-xs font-bold text-amber-400 uppercase">
                              {account.accountHolderName}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setIsBankModalOpen(true)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Add Another Bank Account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Listings */}
        {activeTab === 'listings' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-display text-white">My Active Listings</h3>
                <p className="text-xs text-[#A3A8B3]">List of tickets you are currently selling on TicketShield.</p>
              </div>
              <a
                href="/sell-ticket"
                className="px-5 py-2.5 bg-[#FF5A36] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow"
              >
                + List New Ticket
              </a>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Say Hi Concert Tour 2026', zone: 'VIP A - Row 03', price: '1,800,000 VND', status: 'ACTIVE' },
                { title: 'Coldplay Music of the Spheres Tour', zone: 'Cat 1 Standing', price: '3,200,000 VND', status: 'ACTIVE' },
                { title: 'Monsoon Music Festival 2026', zone: 'Early Bird Pass', price: '950,000 VND', status: 'SOLD' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-[#05070A] border border-white/10 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36]">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
                      <span className="text-xs text-[#A3A8B3]">{item.zone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">{item.price}</p>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      item.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-[#A3A8B3]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Purchased Tickets */}
        {activeTab === 'tickets' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold font-display text-white">My Purchased Tickets</h3>
            <p className="text-xs text-[#A3A8B3]">List of verified official tickets ready for event entry.</p>

            <div className="p-8 text-center bg-[#05070A] border border-white/10 rounded-2xl space-y-3">
              <Ticket className="w-10 h-10 text-cyan-400 mx-auto" />
              <h4 className="font-bold text-white text-base">You own 3 official tickets</h4>
              <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
                All QR passes are verified directly with event organizers and ready for entrance scanning on event day.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Wallet & Bank Accounts */}
        {activeTab === 'wallet' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" /> Payout Wallet &amp; Bank Accounts
                </h3>
                <p className="text-xs text-[#A3A8B3]">Manage your ticket sales balance and linked payout accounts.</p>
              </div>

              <button
                onClick={() => setIsBankModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bank Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-emerald-950/40 to-[#05070A] border border-emerald-500/30 rounded-2xl space-y-3">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Available Balance</span>
                <p className="text-3xl font-bold font-display text-white">32,500,000 VND</p>
                <button
                  onClick={() => setIsBankModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Withdraw to Bank
                </button>
              </div>

              <div className="p-6 bg-gradient-to-br from-cyan-950/40 to-[#05070A] border border-cyan-500/30 rounded-2xl space-y-3">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Funds Under 24h Protection</span>
                <p className="text-3xl font-bold font-display text-white">14,200,000 VND</p>
                <p className="text-[11px] text-[#A3A8B3]">Automatically transferred to your payout bank account after the 24-hour protection period.</p>
              </div>
            </div>

            {/* Bank Accounts Section in Wallet Tab */}
            <div className="pt-4 space-y-4">
              <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" /> Linked Payout Bank Accounts ({bankAccounts.length})
              </h4>

              {bankAccounts.length === 0 ? (
                <div className="p-6 text-center bg-[#05070A] border border-white/10 rounded-2xl space-y-2 text-xs text-zinc-400">
                  No payout bank accounts linked yet. Add one to receive automatic sales payouts!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        acc.isDefault
                          ? 'bg-gradient-to-r from-emerald-950/30 via-[#05070A] to-[#05070A] border-emerald-500/40'
                          : 'bg-[#05070A] border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                          {acc.bankCode}
                        </span>
                        {acc.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold font-mono uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-lg font-extrabold text-white tracking-wider">
                        {acc.bankAccountNumber}
                      </div>
                      <div className="text-xs font-bold text-amber-400 uppercase">
                        {acc.accountHolderName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Seller Bank Account Management Modal (FE-3.1.2) */}
      <SellerBankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={(newAccount) => {
          setBankAccounts((prev) => {
            const updated = prev.map((a) => ({
              ...a,
              isDefault: newAccount.isDefault ? false : a.isDefault,
            }));
            return [newAccount, ...updated];
          });
        }}
      />
    </div>
  );
};

export default ProfilePage;
