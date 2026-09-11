import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/') {
      if (sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          const headerOffset = 64;
          const elementRect = el.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.scrollY;
          const elementHeight = el.offsetHeight;
          const viewportHeight = window.innerHeight;
          const availableHeight = viewportHeight - headerOffset;

          let targetScrollTop: number;
          if (sectionId === 'ticket-dispenser') {
            // For the 3D ticket machine section, align to top right below fixed navbar
            targetScrollTop = absoluteElementTop - headerOffset - 10;
          } else if (elementHeight < availableHeight) {
            // If the section fits within viewport, center it precisely
            targetScrollTop = absoluteElementTop - headerOffset - (availableHeight - elementHeight) / 2;
          } else {
            // For sections taller than viewport, align top with padding
            targetScrollTop = absoluteElementTop - headerOffset - 16;
          }

          window.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth',
          });
        }
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-[100] bg-[#060b18]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" onClick={() => scrollToSection('hero')} className="flex items-center gap-2.5 group select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c2410c] via-[#f97316] to-[#fb923c] flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,0.35)] group-hover:scale-105 transition-transform duration-300">
            <ShieldCheck className="w-5 h-5 text-[#060b18] stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-display font-extrabold tracking-tight text-white group-hover:text-[#fb923c] transition-colors">
              TicketShield<span className="text-[#fb923c]">.</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links — Smooth Section Scrolling */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-sm font-sans font-medium">
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold ${
              location.pathname === '/' ? 'text-[#fb923c] bg-white/[0.04]' : 'text-slate-300 hover:text-[#fb923c] hover:bg-white/[0.02]'
            }`}
          >
            Trang Chủ
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('flow')}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#fb923c] hover:bg-white/[0.04] transition-all text-xs font-semibold"
          >
            Quy Trình
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('partners')}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#fb923c] hover:bg-white/[0.04] transition-all text-xs font-semibold"
          >
            Sự Kiện &amp; Đối Tác
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('ticket-dispenser')}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#fb923c] hover:bg-white/[0.04] transition-all text-xs font-semibold"
          >
            Cấp Vé Chính Chủ
          </button>

          <Link
            to="/marketplace"
            className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold ${
              isActive('/marketplace') ? 'text-[#fb923c] bg-white/[0.04]' : 'text-slate-300 hover:text-[#fb923c] hover:bg-white/[0.04]'
            }`}
          >
            Sàn Vé
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                isActive('/dashboard') ? 'text-[#fb923c] bg-white/[0.04]' : 'text-slate-300 hover:text-[#fb923c] hover:bg-white/[0.04]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#fb923c]" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#fb923c]/40 transition-all text-xs font-semibold text-slate-200"
            >
              <div className="w-6 h-6 rounded-full bg-[#fb923c]/20 text-[#fb923c] flex items-center justify-center font-bold">
                {user.fullName ? user.fullName[0] : 'U'}
              </div>
              <span className="font-sans">{user.fullName || 'User'}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-sans font-semibold text-slate-300 hover:text-[#fb923c] px-3.5 py-2 rounded-full hover:bg-white/5 transition-all"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#fb923c] text-[#060b18] font-display font-bold text-xs tracking-wide shadow-[0_0_16px_rgba(251,146,60,0.4)] hover:bg-[#ea580c] hover:shadow-[0_0_22px_rgba(251,146,60,0.6)] transition-all duration-200"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/5 border border-white/10"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#060b18]/95 backdrop-blur-xl px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-slate-200 hover:text-[#fb923c] hover:bg-white/5"
          >
            Trang Chủ
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('flow')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-slate-200 hover:text-[#fb923c] hover:bg-white/5"
          >
            Quy Trình
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('partners')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-slate-200 hover:text-[#fb923c] hover:bg-white/5"
          >
            Sự Kiện &amp; Đối Tác
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ticket-dispenser')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-slate-200 hover:text-[#fb923c] hover:bg-white/5"
          >
            Cấp Vé Chính Chủ
          </button>
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-sans font-medium text-slate-200 hover:text-[#fb923c] hover:bg-white/5"
          >
            Sàn Vé
          </Link>
          {user ? (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans font-medium text-[#fb923c] hover:bg-white/5"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard ({user.fullName || 'User'})
            </Link>
          ) : (
            <div className="pt-2 flex items-center gap-2 border-t border-white/10">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-sans font-semibold text-slate-300 hover:text-white bg-white/5 rounded-full"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm font-display font-bold text-[#060b18] bg-[#fb923c] hover:bg-[#ea580c] rounded-full shadow-[0_0_16px_rgba(251,146,60,0.4)]"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

