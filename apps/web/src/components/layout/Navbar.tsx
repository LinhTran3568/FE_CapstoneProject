import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';

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

  const navLinks = [
    { label: 'Featured', href: '#featured' },
    { label: 'Discover', href: '#discover' },
    { label: 'Events', href: '#events' },
    { label: 'Passes', href: '#experiences' },
    { label: 'Security', href: '#security' },
    { label: 'Process', href: '#process' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? 'bg-[#05070A]/90 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Brand Logo - Click scrolls to top */}
        <a
          href="/"
          onClick={handleBrandClick}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-[#FF5A36] group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_#FF5A36]" />
          <span className="font-display text-xl font-bold tracking-tight text-[#F5F5F2]">
            TicketShield
          </span>
        </a>

        {/* Desktop Nav Links (Complete Section Navigation) */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium tracking-wide">
          {isHome ? (
            navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))
          ) : (
            <>
              <Link to="/" className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors">
                Home
              </Link>
              <Link to="/#events" className="text-[#A3A8B3] hover:text-[#F5F5F2] transition-colors">
                Events
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA / User Account Controls */}
        <div className="hidden md:flex items-center space-x-5 text-sm">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0A0D12] border border-white/10 hover:border-[#FF5A36]/50 transition-all text-xs font-semibold text-[#F5F5F2]"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF5A36]/20 text-[#FF5A36] flex items-center justify-center font-bold">
                  {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="font-display font-medium">{user.fullName || 'Account'}</span>
                {user.role === 'ADMIN' && (
                  <span className="text-[10px] bg-[#FF5A36] text-white px-1.5 py-0.5 rounded font-mono">
                    ADMIN
                  </span>
                )}
              </Link>
              <Link
                to="/dashboard"
                className="p-2.5 rounded-full bg-[#0A0D12] border border-white/10 text-[#A3A8B3] hover:text-[#F5F5F2] hover:border-white/30 transition-all"
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2.5 rounded-full bg-[#0A0D12] border border-white/10 text-[#A3A8B3] hover:text-red-400 hover:border-red-500/40 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link
                to="/login"
                className="text-[#A3A8B3] hover:text-[#F5F5F2] font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-medium rounded-full tracking-wide transition-all duration-200 shadow-lg shadow-[#FF5A36]/20 hover:shadow-[#FF5A36]/40"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#F5F5F2] p-2 focus:outline-none"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#05070A]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#A3A8B3] hover:text-[#F5F5F2] text-lg font-medium"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#0A0D12] text-[#F5F5F2] font-medium rounded-full border border-white/10"
                >
                  Dashboard ({user.fullName})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center py-3 bg-red-500/20 text-red-400 font-medium rounded-full"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F5F5F2] font-medium text-center py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-[#FF5A36] text-white font-medium rounded-full"
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
