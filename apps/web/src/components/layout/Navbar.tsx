import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { User as UserIcon, LogOut, PlusCircle, ShieldCheck, Ticket, Sparkles, LayoutDashboard } from 'lucide-react';
import { TicketShieldLogo } from '../ui/TicketShieldLogo';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  const isReseller = 
    user?.role === 'RESELLER' || 
    (user?.role as string) === 'SELLER' || 
    user?.email?.toLowerCase().includes('seller') ||
    user?.fullName?.toLowerCase().includes('seller');

  const getNavLinks = () => {
    if (!user) {
      return [
        { label: 'Featured', href: '/#featured' },
        { label: 'Resale Marketplace', href: '/marketplace' },
        { label: 'Experiences', href: '/#experiences' },
        { label: 'How It Works', href: '/#process' },
      ];
    }

    if (isReseller) {
      return [
        { label: 'Resale Marketplace', href: '/marketplace' },
        { label: 'Sell Ticket', href: '/sell-ticket' },
        { label: 'My Listings', href: '/my-listings' },
        { label: 'My Tickets', href: '/my-tickets' },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Resale Marketplace', href: '/marketplace' },
        { label: 'Manage Listings', href: '/my-listings' },
      ];
    }

    return [
      { label: 'Resale Marketplace', href: '/marketplace' },
      { label: 'My Tickets', href: '/my-tickets' },
      { label: 'How It Works', href: '/#process' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? 'bg-[#05070A]/95 backdrop-blur-md border-b border-white/10 py-3.5 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between gap-6">
        <a href="/" onClick={handleBrandClick} className="shrink-0">
          <TicketShieldLogo size="md" />
        </a>

        <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`transition-colors duration-200 ${
                location.pathname === link.href
                  ? 'text-[#FF5A36] font-bold'
                  : 'text-[#A3A8B3] hover:text-[#F5F5F2]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-3.5 text-xs shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#0A0D12] border border-white/10 hover:border-[#FF5A36]/50 transition-all font-semibold text-[#F5F5F2] group whitespace-nowrap"
                title="View Profile & Account"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF5A36]/20 text-[#FF5A36] group-hover:bg-[#FF5A36] group-hover:text-white transition-all flex items-center justify-center font-bold text-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="font-display font-medium max-w-[120px] truncate">{user.fullName || 'Account'}</span>
                
                {isReseller ? (
                  <span className="text-[10px] bg-gradient-to-r from-[#FF5A36] to-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider shadow">
                    RESELLER
                  </span>
                ) : user.role === 'ADMIN' ? (
                  <span className="text-[10px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full font-mono">
                    ADMIN
                  </span>
                ) : (
                  <span className="text-[10px] bg-white/10 text-[#A3A8B3] px-2 py-0.5 rounded-full font-mono">
                    BUYER
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-full bg-[#0A0D12] border border-white/10 text-[#A3A8B3] hover:text-red-400 hover:border-red-500/40 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-6 py-2 rounded-full bg-white hover:bg-[#F5F5F2] text-[#05070A] font-extrabold tracking-wider transition-all duration-200 shadow-xl shadow-white/25 hover:shadow-2xl hover:shadow-white/45 hover:-translate-y-0.5 active:translate-y-0 uppercase font-display"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-extrabold rounded-full tracking-wider transition-all duration-200 shadow-xl shadow-[#FF5A36]/30 hover:shadow-2xl hover:shadow-[#FF5A36]/50 hover:-translate-y-0.5 active:translate-y-0 uppercase font-display"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-[#F5F5F2] p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.293 5.293a1 1 0 011.414 1.414L13.414 12l6.293 6.293a1 1 0 01-1.414 1.414L12 13.414l-6.293 6.293a1 1 0 01-1.414-1.414L10.586 12 4.293 5.707a1 1 0 011.414-1.414L12 10.586l6.293-6.293z"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#05070A]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#A3A8B3] hover:text-[#F5F5F2] text-base font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#0A0D12] text-[#F5F5F2] font-medium rounded-full border border-white/10 flex items-center justify-center gap-2 text-xs"
                >
                  <UserIcon className="w-4 h-4 text-[#FF5A36]" />
                  <span>Profile ({user.fullName})</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-3 bg-red-500/20 text-red-400 font-medium rounded-full text-xs"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F5F5F2] font-medium text-center py-2 text-xs"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#FF5A36] text-white font-medium rounded-full text-xs"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
export default Navbar;
