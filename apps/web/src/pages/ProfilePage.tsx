import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'listings' | 'tickets' | 'wallet'>('profile');

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '0901234567');
  const [isSaving, setIsSaving] = useState(false);

  const isReseller = 
    user?.role === 'RESELLER' || 
    (user?.role as string) === 'SELLER';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Profile updated successfully!', 'success');
    }, 600);
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-extrabold font-display text-white">Please Sign In</h2>
        <p className="text-[#A3A8B3] text-sm">You must be logged in to view your profile.</p>
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
                    <Sparkles className="w-3 h-3" /> Reseller Verified
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
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> {user.phoneNumber || '0901234567'}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> KYC Level 2 Verified
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            {isReseller && (
              <a
                href="/#reseller-console"
                className="flex-1 md:flex-none px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Ticket</span>
              </a>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-red-500/50 text-[#A3A8B3] hover:text-red-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-2"
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
            <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-display">Escrow Balance</span>
              <p className="text-2xl font-bold font-display text-cyan-400">14.200.000 <span className="text-xs font-normal text-[#A3A8B3]">VND</span></p>
            </div>
            <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-display">Completed Sales</span>
              <p className="text-2xl font-bold font-display text-emerald-400">32.500.000 <span className="text-xs font-normal text-[#A3A8B3]">VND</span></p>
            </div>
            <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-1">
              <span className="text-[11px] text-[#A3A8B3] uppercase tracking-wider font-display">Reputation Score</span>
              <p className="text-2xl font-bold font-display text-amber-400">99.8% <span className="text-xs font-normal text-[#A3A8B3]">Platinum</span></p>
            </div>
          </div>
        )}

        {/* Profile Navigation Tabs */}
        <div className="flex border-b border-white/10 space-x-8 text-sm font-medium font-display">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 transition-colors relative ${
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
            className={`pb-4 transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'listings'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>My Resale Listings</span>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white">8</span>
            {activeTab === 'listings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-4 transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'tickets'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>My Purchased Tickets</span>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white">3</span>
            {activeTab === 'tickets' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`pb-4 transition-colors relative ${
              activeTab === 'wallet'
                ? 'text-[#FF5A36] font-bold'
                : 'text-[#A3A8B3] hover:text-white'
            }`}
          >
            <span>Escrow & Wallet</span>
            {activeTab === 'wallet' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Edit Personal Details Form */}
            <div className="lg:col-span-8 bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#FF5A36]" /> Account Information
                </h3>
                <p className="text-xs text-[#A3A8B3]">Update your personal profile details and contact information.</p>
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
                  <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Security & KYC Badge Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-4">
                <h4 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Security Status
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[#A3A8B3]">Identity Verification (KYC)</span>
                    <span className="text-emerald-400 font-bold font-mono">VERIFIED</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[#A3A8B3]">Two-Factor Authentication</span>
                    <span className="text-cyan-400 font-bold font-mono">ENABLED</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[#A3A8B3]">Escrow Wallet Security</span>
                    <span className="text-emerald-400 font-bold font-mono">PROTECTED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Listings */}
        {activeTab === 'listings' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-display text-white">My Resale Listings</h3>
                <p className="text-xs text-[#A3A8B3]">Listings currently published on the TicketShield marketplace.</p>
              </div>
              <a
                href="/#reseller-console"
                className="px-5 py-2.5 bg-[#FF5A36] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow"
              >
                + Post New Ticket
              </a>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Anh Trai Vượt Ngàn Chông Gai Concert 2026', zone: 'VIP A - Row 03', price: '1.800.000 VND', status: 'ACTIVE' },
                { title: 'Coldplay Music of the Spheres Tour', zone: 'Cat 1 Standing', price: '3.200.000 VND', status: 'ACTIVE' },
                { title: 'Lễ Hội Âm Nhạc Monsoon 2026', zone: 'Early Bird Pass', price: '950.000 VND', status: 'SOLD' },
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
            <h3 className="text-xl font-bold font-display text-white">My Purchased Passes</h3>
            <p className="text-xs text-[#A3A8B3]">Verified digital tickets purchased with TicketShield escrow guarantee.</p>

            <div className="p-8 text-center bg-[#05070A] border border-white/10 rounded-2xl space-y-3">
              <Ticket className="w-10 h-10 text-cyan-400 mx-auto" />
              <h4 className="font-bold text-white text-base">You have 3 active verified passes</h4>
              <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
                All QR codes are dynamically signed and ready for entrance scan on the day of event.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Wallet */}
        {activeTab === 'wallet' && (
          <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" /> TicketShield Escrow Wallet
            </h3>
            <p className="text-xs text-[#A3A8B3]">Overview of held escrow funds and instant payout accounts.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-emerald-950/40 to-[#05070A] border border-emerald-500/30 rounded-2xl space-y-3">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Available Balance</span>
                <p className="text-3xl font-bold font-display text-white">32.500.000 VND</p>
                <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all">
                  Withdraw to Bank
                </button>
              </div>

              <div className="p-6 bg-gradient-to-br from-cyan-950/40 to-[#05070A] border border-cyan-500/30 rounded-2xl space-y-3">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Escrow Locked Funds</span>
                <p className="text-3xl font-bold font-display text-white">14.200.000 VND</p>
                <p className="text-[11px] text-[#A3A8B3]">Automated release upon successful event entry verification.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
