import React, { useState } from 'react';
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
  const [selectedCity, setSelectedCity] = useState('TP. Hồ Chí Minh');

  return (
    <div className="bg-[#11131b] font-sans text-[#e1e1ed] antialiased selection:bg-[#ff5945] selection:text-white min-h-screen flex flex-col">
      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0c0e16]/85 backdrop-blur-xl border-b border-[#33343d]/40">
        <div className="h-20 w-full px-4 lg:px-12 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 shrink-0">
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

            {/* Nav Links (Origin Storefront Only - No secondary market links) */}
            <nav className="hidden xl:flex items-center gap-1">
              <Link
                to="/storefront"
                className={`px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  location.pathname === '/storefront'
                    ? 'bg-[#282a32] text-[#e1e1ed] shadow-[0_0_16px_-4px_rgba(255,89,69,0.3)]'
                    : 'text-[#e3beb8] hover:bg-[#282a32] hover:text-[#e1e1ed]'
                }`}
              >
                Khám phá
              </Link>
              <Link
                to="/storefront/events"
                className={`px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  location.pathname.startsWith('/storefront/events')
                    ? 'bg-[#282a32] text-[#e1e1ed] shadow-[0_0_16px_-4px_rgba(255,89,69,0.3)]'
                    : 'text-[#e3beb8] hover:bg-[#282a32] hover:text-[#e1e1ed]'
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
                className="px-4 py-2 rounded-lg text-[#e3beb8] hover:bg-[#282a32] hover:text-[#e1e1ed] transition-all text-sm font-semibold cursor-pointer"
              >
                Concert nổi bật
              </Link>
              <a
                href="#upcoming-events"
                onClick={(e) => {
                  if (location.pathname === '/storefront') {
                    e.preventDefault();
                    document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2 rounded-lg text-[#e3beb8] hover:bg-[#282a32] hover:text-[#e1e1ed] transition-all text-sm font-semibold cursor-pointer"
              >
                Lịch diễn 7 ngày tới
              </a>
              <Link
                to="/storefront/event/atsh-2026/select-seat"
                className={`px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                  location.pathname.includes('/select-seat')
                    ? 'bg-[#282a32] text-[#e1e1ed] shadow-[0_0_16px_-4px_rgba(255,89,69,0.3)]'
                    : 'text-[#e3beb8] hover:bg-[#282a32] hover:text-[#e1e1ed]'
                }`}
              >
                Sơ đồ & Hạng vé
              </Link>
            </nav>
          </div>

          {/* Right Action Icons: Search, City, Real Profile or Login */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Input Box */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#191b23] border border-[#33343d]/40 text-[#e3beb8] hover:border-[#ff5945] transition-colors cursor-pointer w-64">
              <span className="material-symbols-outlined text-[18px] text-[#aa8984]">search</span>
              <span className="text-xs text-[#aa8984] flex-1 truncate">Tìm nghệ sĩ, tour diễn...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-[#1d1f28] text-[10px] text-[#e3beb8] border border-[#33343d]/50 font-mono">
                ⌘K
              </kbd>
            </div>

            {/* City Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191b23] border border-[#33343d]/40 text-[#e1e1ed] text-xs cursor-pointer hover:border-[#33343d]">
              <span className="material-symbols-outlined text-[#ffb4a8] text-[18px]">location_on</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none outline-none text-[#e1e1ed] text-xs cursor-pointer"
              >
                <option value="TP. Hồ Chí Minh" className="bg-[#191b23]">TP. Hồ Chí Minh</option>
                <option value="Hà Nội" className="bg-[#191b23]">Hà Nội</option>
                <option value="Đà Nẵng" className="bg-[#191b23]">Đà Nẵng</option>
                <option value="Đà Lạt" className="bg-[#191b23]">Đà Lạt</option>
              </select>
            </div>

            {/* Real User Profile or Login Action (No Mock Hải Đăng) */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#33343d]/40">
              {isAuthenticated && user ? (
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
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#282a32] hover:bg-[#ff5945] text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <TicketShieldLogo size="sm" showText={false} />
                <span className="font-display font-bold text-xl text-[#e1e1ed] tracking-tight">
                  TicketShield
                </span>
              </div>
              <p className="text-sm text-[#aa8984] max-w-sm leading-relaxed">
                Nền tảng giao dịch vé concert điện ảnh và sự kiện âm nhạc đỉnh cao với công nghệ bảo vệ Cyber-Escrow chống giả mạo 100%.
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#191b23] border border-[#4cd7f6]/20 text-[#4cd7f6] w-fit text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>100% Guaranteed by TicketShield Cyber-Escrow</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-[#e1e1ed] mb-1">Khám phá</span>
              <Link to="/storefront" className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors">
                Tất cả sự kiện
              </Link>
              <Link to="/storefront/event/atsh-2026/select-seat" className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors">
                Sơ đồ & Hạng vé
              </Link>
              <span className="text-[#aa8984]">Sân vận động & Hội trường</span>
              <span className="text-[#aa8984]">Nghệ sĩ & Tour diễn</span>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-[#e1e1ed] mb-1">Hỗ trợ & Pháp lý</span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Quy chuẩn Cyber-Escrow
              </span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Xác thực mã vạch vé
              </span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Điều khoản dịch vụ
              </span>
              <span className="text-[#aa8984] hover:text-[#e1e1ed] transition-colors cursor-pointer">
                Chính sách hoàn tiền
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[#e1e1ed]">Nhận tin Tour Hot</span>
              <p className="text-xs text-[#aa8984]">
                Đăng ký nhận thông báo đợt mở bán độc quyền và pass VIP sớm.
              </p>
              <div className="flex items-center rounded-lg bg-[#1d1f28] border border-[#33343d]/40 p-1">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="w-full bg-transparent px-3 py-1.5 text-xs text-[#e1e1ed] focus:outline-none placeholder:text-[#aa8984]"
                />
                <button
                  type="button"
                  className="px-4 py-1.5 rounded bg-[#ff5945] text-white text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                >
                  Gửi
                </button>
              </div>
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
