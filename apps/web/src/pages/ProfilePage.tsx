import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import {
  User as UserIcon,
  Mail,
  Phone,
  CheckCircle2,
  PlusCircle,
  LogOut,
  Edit3,
  Building2,
  CreditCard,
  Plus,
  RefreshCw,
  Ticket,
  ListFilter,
  ArrowRight,
  Calendar,
  MapPin,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, bankAccountsApi, VIETNAM_BANKS } from '@ticketshield/api-client';
import type { UserBankAccountDto } from '@ticketshield/types';
import { SellerBankAccountModal } from '../components/profile/SellerBankAccountModal';
import { useMyListings } from '../hooks/useMyListings';
import { useMyTickets } from '../hooks/useMyTickets';
import { formatEventDateTime, formatVND } from '../utils/formatters';

type TabId = 'account' | 'tickets' | 'listings';

const STATUS_STYLES: Record<string, string> = {
  Verified:    'bg-emerald-500/20 text-emerald-400',
  Transacting: 'bg-amber-500/20 text-amber-400',
  Sold:        'bg-cyan-500/20 text-cyan-400',
  Cancelled:   'bg-white/10 text-zinc-400',
  Expired:     'bg-white/10 text-zinc-400',
};

export const ProfilePage: React.FC = () => {
  const { user, logout, setUser } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<UserBankAccountDto[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const formatRoleLabel = (role: unknown): string => {
    if (role === 1 || role === '1' || role === 'BUYER' || role === 'USER') return 'Member';
    if (role === 2 || role === '2' || role === 'ORGANIZER') return 'Organizer';
    if (role === 3 || role === '3' || role === 'ADMIN') return 'Admin';
    if (role === 'RESELLER' || role === 'SELLER') return 'Seller';
    if (typeof role === 'string' && role.trim()) return role;
    return 'Member';
  };

  const roleLabel = formatRoleLabel(user?.role);
  const isReseller =
    roleLabel === 'Seller' ||
    user?.role === 'RESELLER' ||
    (user?.role as string) === 'SELLER';

  // Real data hooks
  const { data: myListings = [], isPending: listingsPending } = useMyListings();
  const { data: myTickets = [], isPending: ticketsPending } = useMyTickets();

  // Preview: 3 most recent items each
  const recentListings = myListings.slice(0, 3);
  const recentTickets  = myTickets.slice(0, 3);

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
    } catch {
      // silent
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

  const getBankName = (code: string) => {
    const bank = VIETNAM_BANKS.find(b => b.code.toUpperCase() === code.toUpperCase());
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

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'account',  label: 'Account Details' },
    { id: 'tickets',  label: 'My Tickets',  badge: myTickets.length || undefined },
    { id: 'listings', label: 'My Listings', badge: myListings.filter(l => l.listingStatus === 'Verified').length || undefined },
  ];

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/hero-concert.jpg"
          alt=""
          className="w-full h-full object-cover opacity-20 filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/85 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/10 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-7">

        {/* ── Banner ── */}
        <div className="bg-gradient-to-r from-[#0A0D12] via-[#0F141C] to-[#0A0D12] border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF5A36]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="relative shrink-0">
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#FF5A36] to-amber-500 text-white font-extrabold font-display text-2xl flex items-center justify-center shadow-xl shadow-[#FF5A36]/20">
                {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="w-7 h-7" />}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-[#0A0D12] p-0.5 rounded-full text-white">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold font-display text-white tracking-tight">
                  {user.fullName || 'User Profile'}
                </h1>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold font-mono uppercase tracking-wider rounded-full ${
                  isReseller
                    ? 'bg-gradient-to-r from-[#FF5A36] to-amber-500 text-white'
                    : 'bg-white/10 text-[#CBD5E1]'
                }`}>
                  {roleLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#8B929C] font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#FF5A36]" /> {user.email}
                </span>
                {user.phoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-cyan-400" /> {user.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            {isReseller && (
              <Link
                to="/sell-ticket"
                className="px-4 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Ticket</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-red-500/40 text-[#A3A8B3] hover:text-red-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex border-b border-white/10 gap-8 text-sm font-medium font-display">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 transition-colors relative flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#FF5A36] font-bold'
                  : 'text-[#A3A8B3] hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-[#FF5A36]/20 text-[#FF5A36] rounded-full text-[10px] font-bold font-mono">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: Account Details ── */}
        {activeTab === 'account' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Edit Profile */}
            <div className="lg:col-span-7 bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Edit3 className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#FF5A36]" /> Personal Profile
                </h3>
                <p className="text-xs text-[#A3A8B3] mt-0.5">Update your contact details and display name.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1.5 font-display">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF5A36] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1.5 font-display">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-[#05070A]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#A3A8B3] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1.5 font-display">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0912345678"
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF5A36] placeholder:text-zinc-600 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-60 text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Right: Payout Accounts */}
            <div className="lg:col-span-5">
              <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-4 h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold font-display text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" /> Payout Accounts
                    </h4>
                    <p className="text-[11px] text-[#8B929C] mt-0.5">Direct transfer for completed sales</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/payout-accounts"
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white rounded-xl transition-all"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => setIsBankModalOpen(true)}
                      className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl transition-all cursor-pointer"
                      title="Add Bank Account"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isLoadingAccounts ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
                    Loading accounts...
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="p-6 text-center bg-[#05070A] border border-white/10 rounded-2xl space-y-3">
                    <CreditCard className="w-7 h-7 text-zinc-500 mx-auto" />
                    <p className="text-xs text-[#8B929C]">No payout account linked yet.</p>
                    <button
                      onClick={() => setIsBankModalOpen(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Link Bank Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {bankAccounts.map(acc => (
                      <div
                        key={acc.id}
                        className={`p-4 rounded-2xl border ${
                          acc.isDefault
                            ? 'bg-gradient-to-r from-emerald-950/40 via-[#05070A] to-[#05070A] border-emerald-500/40'
                            : 'bg-[#05070A] border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">
                            {acc.bankCode}
                          </span>
                          <span className="text-xs font-semibold text-white">{getBankName(acc.bankCode)}</span>
                          {acc.isDefault && (
                            <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold font-mono uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-sm font-bold text-white tracking-widest">{acc.bankAccountNumber}</div>
                        <div className="text-[11px] text-amber-400 font-semibold uppercase mt-0.5">{acc.accountHolderName}</div>
                      </div>
                    ))}
                    <button
                      onClick={() => setIsBankModalOpen(true)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      Add Another Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: My Tickets ── */}
        {activeTab === 'tickets' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Ticket className="w-4.5 h-[18px] w-[18px] text-cyan-400" /> My Tickets
                </h3>
                <p className="text-xs text-[#8B929C] mt-0.5">Your purchased event passes — showing {recentTickets.length} of {myTickets.length}.</p>
              </div>
              <Link
                to="/my-tickets"
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {ticketsPending ? (
              <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Loading tickets...
              </div>
            ) : myTickets.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Ticket className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">No tickets yet.</p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF5A36] hover:text-[#FF7252] transition-colors"
                >
                  Browse Events <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map(ticket => (
                  <div
                    key={ticket.escrowId}
                    className="p-4 bg-[#05070A] border border-white/10 hover:border-white/20 rounded-2xl flex items-center gap-4 transition-colors"
                  >
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{ticket.eventName}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-[#8B929C] font-mono">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ticket.eventVenue}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatEventDateTime(ticket.eventStartAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-zinc-400">{ticket.tierName}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{formatVND(ticket.totalAmountPaid)}</p>
                    </div>
                  </div>
                ))}

                {myTickets.length > 3 && (
                  <Link
                    to="/my-tickets"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-all"
                  >
                    View all {myTickets.length} tickets <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: My Listings ── */}
        {activeTab === 'listings' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <ListFilter className="w-[18px] h-[18px] text-[#FF5A36]" /> My Listings
                </h3>
                <p className="text-xs text-[#8B929C] mt-0.5">Your resale listings — showing {recentListings.length} of {myListings.length}.</p>
              </div>
              <div className="flex items-center gap-3">
                {isReseller && (
                  <Link
                    to="/sell-ticket"
                    className="px-3 py-1.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-[10px] uppercase tracking-wider rounded-xl shadow transition-all"
                  >
                    + New Listing
                  </Link>
                )}
                <Link
                  to="/my-listings"
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FF5A36] hover:text-[#FF7252] transition-colors"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {listingsPending ? (
              <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
                Loading listings...
              </div>
            ) : myListings.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <ListFilter className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-zinc-400">No listings yet.</p>
                {isReseller && (
                  <Link
                    to="/sell-ticket"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FF5A36] hover:text-[#FF7252] transition-colors"
                  >
                    Sell a ticket <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentListings.map(listing => (
                  <div
                    key={listing.listingId}
                    className="p-4 bg-[#05070A] border border-white/10 hover:border-white/20 rounded-2xl flex items-center gap-4 transition-colors"
                  >
                    <div className="p-3 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] shrink-0">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{listing.eventName}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-[#8B929C] font-mono">
                        <span>{listing.tierName}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatEventDateTime(listing.eventStartAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-bold text-white">{formatVND(listing.resalePrice)}</p>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${STATUS_STYLES[listing.listingStatus] || 'bg-white/10 text-zinc-400'}`}>
                        {listing.listingStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}

                {myListings.length > 3 && (
                  <Link
                    to="/my-listings"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-mono text-[#FF5A36] hover:text-[#FF7252] transition-all"
                  >
                    View all {myListings.length} listings <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bank Account Modal */}
      <SellerBankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={(newAccount) => {
          setBankAccounts(prev => {
            const updated = prev.map(a => ({
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
