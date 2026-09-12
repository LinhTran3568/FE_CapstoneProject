import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { TicketShieldLogo } from '../ui/TicketShieldLogo';
import {
  Ticket,
  PlusCircle,
  ListFilter,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      if (isLandingPage) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else {
      navigate('/marketplace');
    }
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    showToast('Signed out successfully. Returned to Landing Page.', 'info');
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (isLandingPage) {
      if (sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          const headerOffset = 64;
          const elementRect = el.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, absoluteElementTop - headerOffset),
            behavior: 'smooth',
          });
        }
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  const isSeller =
    user?.role === 'RESELLER' ||
    (user?.role as string) === 'SELLER';

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#05070A]/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.85)] py-3'
          : 'bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/40 to-transparent py-4'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" onClick={handleBrandClick} className="focus:outline-none shrink-0 group">
          <TicketShieldLogo size="md" />
        </a>

        {/* Navigation Links */}
        {!user ? (
          /* GUEST MODE: Landing Section Scroll Anchors */
          <nav className="hidden lg:flex items-center gap-6 bg-[#090C12]/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-inner">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#CBD5E1] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('flow')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#CBD5E1] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              How it work ?
            </button>
            <button
              onClick={() => scrollToSection('partners')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#CBD5E1] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              Partners
            </button>
            <button
              onClick={() => scrollToSection('ticket-dispenser')}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#CBD5E1] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              Issuer Pass
            </button>
            <Link
              to="/marketplace"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#20C997] hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </Link>
          </nav>
        ) : (
          /* LOGGED IN MODE: Direct Functional App Links */
          <nav className="hidden md:flex items-center gap-1 bg-[#090C12]/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <Link
              to="/marketplace"
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${location.pathname === '/marketplace'
                  ? 'bg-[#FF5A36] text-white shadow-[0_2px_15px_rgba(255,90,54,0.4)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </Link>

            <Link
              to="/sell-ticket"
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${location.pathname === '/sell-ticket'
                  ? 'bg-[#FF5A36] text-white shadow-[0_2px_15px_rgba(255,90,54,0.4)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Sell Ticket</span>
            </Link>

            {(isSeller || isAdmin) && (
              <Link
                to="/my-listings"
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${location.pathname === '/my-listings'
                    ? 'bg-[#FF5A36] text-white shadow-[0_2px_15px_rgba(255,90,54,0.4)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                  }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>My Listings</span>
              </Link>
            )}

            <Link
              to="/my-tickets"
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${location.pathname === '/my-tickets'
                  ? 'bg-[#FF5A36] text-white shadow-[0_2px_15px_rgba(255,90,54,0.4)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.06]'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>My Tickets</span>
            </Link>
          </nav>
        )}

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {!user ? (
            <Link
              to="/login"
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.4)] transition-all flex items-center gap-1.5"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-[#090C12] border border-white/15 hover:border-[#FF5A36]/60 transition-all cursor-pointer group focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5A36] to-[#FF7252] text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold font-display text-white line-clamp-1 group-hover:text-[#FF5A36] transition-colors">
                    {user.fullName || 'User'}
                  </span>
                  <span className="text-[10px] font-mono text-[#8B929C]">
                    {isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}
                  </span>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8B929C] group-hover:text-white transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-white' : ''
                    }`}
                />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0B0E14]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-2 space-y-1 z-50">
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5 space-y-1">
                    <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] font-mono text-[#8B929C] truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono text-[#CBD5E1] hover:text-white hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#FF5A36]" />
                    <span>My Profile</span>
                  </Link>



                  <div className="pt-1 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white hover:text-[#FF5A36] focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
};
