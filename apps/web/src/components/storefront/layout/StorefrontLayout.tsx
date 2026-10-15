import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TicketShieldLogo } from '../../ui/TicketShieldLogo';
import { useAuthStore } from '../../../stores/authStore';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  activeTab?: 'kham-pha' | 'marketplace' | 've-cua-toi' | 'dang-ban-ve';
  activeEventId?: string;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
}) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className="bg-[#11131b] font-sans text-[#e1e1ed] antialiased selection:bg-[#ff5945] selection:text-white min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0e16]/85 backdrop-blur-xl border-b border-[#33343d]/40">
        <div className="relative h-20 w-full px-4 lg:px-12 flex items-center justify-between gap-4">
          {/* Logo & Brand on Left */}
          <div className="flex items-center shrink-0">
            <Link to="/storefront" className="flex items-center gap-3 group">
              <TicketShieldLogo size="sm" showText={false} />
              <div className="flex flex-col">
                <span className="font-display text-xl text-[#e1e1ed] font-bold tracking-tight group-hover:text-[#ffb4a8] transition-colors leading-none">
                  TicketShield
                </span>
                <span className="text-[10px] text-[#ff5945] tracking-widest uppercase font-bold mt-1">
                  CONCERT PASS
                </span>
              </div>
            </Link>
          </div>

          {/* Centered Navigation Menu - Clean & Standard Text Links */}
          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-7 lg:gap-9">
            <Link
              to="/storefront"
              className={`text-sm font-semibold transition-colors py-1 ${
                location.pathname === '/storefront'
                  ? 'text-white font-bold'
                  : 'text-[#aa8984] hover:text-white'
              }`}
            >
              Khám phá
            </Link>
            <Link
              to="/storefront/events"
              className={`text-sm font-semibold transition-colors py-1 ${
                location.pathname.startsWith('/storefront/events')
                  ? 'text-white font-bold'
                  : 'text-[#aa8984] hover:text-white'
              }`}
            >
              Tất cả sự kiện
            </Link>
            <Link
              to="/storefront#featured-events"
              onClick={(e) => {
                if (location.pathname === '/storefront') {
                  e.preventDefault();
                  document.getElementById('featured-events')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm font-semibold text-[#aa8984] hover:text-white transition-colors py-1 cursor-pointer"
            >
              Concert nổi bật
            </Link>
            <Link
              to="/storefront#upcoming-events"
              onClick={(e) => {
                if (location.pathname === '/storefront') {
                  e.preventDefault();
                  document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm font-semibold text-[#aa8984] hover:text-white transition-colors py-1 cursor-pointer"
            >
              Lịch diễn sắp tới
            </Link>
            <Link
              to="/"
              id="nav-link-home-marketplace"
              className="text-sm font-semibold text-[#4cd7f6] hover:text-[#7ee6fc] transition-colors py-1 flex items-center gap-1.5 group"
            >
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6] group-hover:scale-110 transition-transform">
                sync_alt
              </span>
              <span>Sàn bán lại vé</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/30 uppercase font-bold">
                P2P
              </span>
            </Link>
          </nav>

          {/* Right Action: Profile (if authenticated) */}
          <div className="flex items-center gap-3 shrink-0 min-w-[40px] justify-end">
            {isAuthenticated && user && (
              <Link to="/profile" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full ring-2 ring-[#ff5945]/40 overflow-hidden bg-[#282a32] flex items-center justify-center font-bold text-xs text-[#ffb4a8]">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4cd7f6] rounded-full ring-2 ring-[#0c0e16]" />
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#e1e1ed] group-hover:text-[#ffb4a8] transition-colors leading-tight truncate max-w-[120px]">
                    {user.fullName || user.email?.split('@')[0] || 'Khách hàng'}
                  </span>
                  <span className="text-[10px] text-[#ffb4a8] font-bold uppercase tracking-wider">
                    {user.role || 'THÀNH VIÊN'}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full pt-20 bg-[#11131b] flex-1">
        {children}
      </main>

      {/* Dedicated Concert Footer */}
      <footer className="w-full bg-[#0c0e16] border-t border-[#33343d]/30 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <TicketShieldLogo size="sm" showText={false} />
                <span className="font-display font-bold text-xl text-[#e1e1ed] tracking-tight">
                  TicketShield
                </span>
              </div>
              <p className="text-sm text-[#aa8984] max-w-sm leading-relaxed">
                Cổng phát hành vé concert và sự kiện âm nhạc chính thức từ Ban Tổ Chức, mang lại trải nghiệm check-in an toàn và minh bạch 100%.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-[#e1e1ed] mb-1">Khám phá</span>
              <Link to="/storefront/events" className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors">
                Tất cả sự kiện
              </Link>
              <Link to="/storefront#featured-events" className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors">
                Concert nổi bật
              </Link>
              <Link to="/" className="text-[#4cd7f6] hover:text-white transition-colors flex items-center gap-1 font-medium">
                <span>Sàn bán lại vé P2P</span>
                <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
              </Link>
              <span className="text-[#aa8984]">Sân vận động & Hội trường</span>
              <span className="text-[#aa8984]">Nghệ sĩ & Tour diễn</span>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-[#e1e1ed] mb-1">Hỗ trợ & Pháp lý</span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Quy chuẩn vé chính gốc
              </span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Xác thực mã Dynamic QR
              </span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Điều khoản dịch vụ
              </span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Chính sách hoàn tiền
              </span>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#33343d]/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#aa8984]">
            <span>© 2026 TicketShield Ecosystem. Tất cả quyền được bảo lưu.</span>
            <div className="flex items-center gap-3">
              <span className="uppercase tracking-wider text-[11px]">Cổng thanh toán bảo mật:</span>
              <div className="flex items-center gap-2 font-mono font-bold text-[#e3beb8]">
                <span className="px-2 py-0.5 rounded bg-[#1d1f28] border border-[#33343d]/40 text-[11px]">VietQR</span>
                <span className="px-2 py-0.5 rounded bg-[#1d1f28] border border-[#33343d]/40 text-[11px]">Napas247</span>
                <span className="px-2 py-0.5 rounded bg-[#1d1f28] border border-[#33343d]/40 text-[11px]">VISA</span>
                <span className="px-2 py-0.5 rounded bg-[#1d1f28] border border-[#33343d]/40 text-[11px]">Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
