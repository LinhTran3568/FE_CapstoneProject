import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { disputesApi } from '@ticketshield/api-client';
import { isAdminRole } from '../../../utils/staffRole';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Sliders,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ChevronDown,
  Bell,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { TicketShieldLogo } from '../../ui/TicketShieldLogo';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop sidebar collapse state (persisted)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('ticketshield_admin_sidebar_collapsed') === 'true';
  });

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Profile dropdown state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Open disputes badge count
  const [openDisputesCount, setOpenDisputesCount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('ticketshield_admin_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Fetch real count of open disputes for sidebar alert badge
  useEffect(() => {
    let isMounted = true;
    const fetchBadge = async () => {
      try {
        const overview = await disputesApi.getDisputes('OPEN');
        if (isMounted && overview) {
          setOpenDisputesCount(overview.openCount ?? 0);
        }
      } catch (err) {
        // Silent fail for badge counter
      }
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    showToast('Signed out of Admin Console.', 'info');
    navigate('/login');
  };

  const isAdmin = isAdminRole(user?.role);

  const navItems = [
    {
      to: '/admin/dashboard',
      aliases: ['/admin/dashboard'],
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      adminOnly: true,
    },
    {
      to: '/admin/disputes',
      aliases: ['/admin/disputes', '/disputes/console'],
      label: 'Dispute Console',
      icon: ShieldAlert,
      badge: openDisputesCount > 0 ? openDisputesCount : null,
      badgeColor: 'bg-[#DC2626] text-white',
      adminOnly: false,
    },
    {
      to: '/admin/users',
      aliases: ['/admin/users'],
      label: 'Users & Staff',
      icon: Users,
      badge: null,
      adminOnly: true,
    },
    {
      to: '/admin/config',
      aliases: ['/admin/config', '/admin/fee-settings', '/admin/fees'],
      label: 'System Configuration',
      icon: Sliders,
      badge: null,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => (isAdmin ? true : !item.adminOnly));

  const getBreadcrumbs = () => {
    const p = location.pathname;
    const portalPrefix = isAdmin ? 'Admin' : 'Moderation';
    const portalHome = isAdmin ? '/admin/dashboard' : '/admin/disputes';

    if (p.startsWith('/admin/config') || p.startsWith('/admin/fee-settings') || p.startsWith('/admin/fees')) {
      return [
        { label: portalPrefix, to: portalHome },
        { label: 'System Configuration', to: '/admin/config' }
      ];
    }
    if (p.startsWith('/admin/disputes') || p.startsWith('/disputes/console')) {
      return [
        { label: portalPrefix, to: portalHome },
        { label: 'Dispute Resolution Console', to: '/admin/disputes' }
      ];
    }
    if (p.startsWith('/admin/users')) {
      return [
        { label: portalPrefix, to: portalHome },
        { label: 'Users & Staff', to: '/admin/users' }
      ];
    }
    return [
      { label: portalPrefix, to: portalHome },
      { label: isAdmin ? 'Dashboard Overview' : 'Dispute Console', to: portalHome }
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  const isRouteActive = (item: typeof navItems[0]) => {
    // Exact matching for dashboard to avoid matching all /admin/* sub-routes
    if (item.to === '/admin/dashboard') {
      return (
        location.pathname === '/admin' ||
        location.pathname === '/admin/' ||
        location.pathname === '/admin/dashboard'
      );
    }
    return item.aliases.some(
      (path) => location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex text-[#101722] font-sans antialiased">
      {/* ── Mobile Drawer Overlay ── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Left Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#101722] text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800/80 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Floating Toggle Button on the outer right edge in the middle of sidebar */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 w-7 h-7 rounded-full bg-[#101722] border border-slate-700/90 text-slate-300 hover:text-white hover:border-[#F45135] hover:scale-110 shadow-lg items-center justify-center transition-all focus:outline-none cursor-pointer"
          title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#F45135]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-slate-800 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          <Link
            to={isAdmin ? "/admin/dashboard" : "/admin/disputes"}
            className={`flex items-center group focus:outline-none min-w-0 ${
              isCollapsed ? 'justify-center p-1 rounded-xl hover:bg-slate-800/80' : 'gap-2.5 overflow-hidden'
            }`}
            title={isAdmin ? "TicketShield Fintech Admin" : "TicketShield Staff Console"}
          >
            <TicketShieldLogo size="sm" showText={false} />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-extrabold tracking-tight text-white font-display truncate">
                  TicketShield
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#F45135] font-semibold">
                  {isAdmin ? 'Fintech Admin' : 'Staff Console'}
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'Quản Trị Hệ Thống' : 'Phân Hệ Vận Hành'}
            </div>
          )}

          {visibleNavItems.map((item) => {
            const active = isRouteActive(item);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  active
                    ? 'bg-slate-800/90 text-white font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#F45135] before:rounded-r shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-[#F45135]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!isCollapsed && item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile & Actions */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Administrator Profile Card */}
          <div className={`bg-slate-900/90 rounded-xl border border-slate-800 flex items-center transition-all ${
            isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5 gap-2'
          }`}>
            <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F45135] to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                title={user?.fullName || 'Administrator'}
              >
                {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Administrator'}</p>
                  <p className="text-[10px] font-mono text-emerald-400 truncate">
                    {isAdmin ? 'Super Admin' : 'Staff Moderator'}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#E5EAF0] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-8 shadow-sm">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-[#667085] truncate font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.to + idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="font-bold text-[#101722] truncate">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.to} className="hover:text-[#F45135] transition-colors truncate">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Notifications & User avatar */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notification / Dispute Alert */}
            <Link
              to="/admin/disputes"
              className="relative p-2 rounded-xl text-[#667085] hover:text-[#101722] hover:bg-slate-100 transition-colors"
              title={openDisputesCount > 0 ? `${openDisputesCount} khiếu nại đang chờ xử lý` : 'Không có khiếu nại'}
            >
              <Bell className="w-4 h-4" />
              {openDisputesCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#DC2626] ring-2 ring-white"></span>
              )}
            </Link>

            {/* Administrator Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border border-[#E5EAF0] hover:border-slate-300 hover:bg-slate-50 transition-all focus:outline-none"
                title={user?.fullName || 'Administrator'}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F45135] to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                  {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#101722] leading-tight truncate max-w-[180px] lg:max-w-[240px]">
                    {user?.fullName || 'Admin'}
                  </span>
                  <span className="text-[10px] text-[#667085] leading-tight font-mono">Quản trị viên</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5EAF0] rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-[#101722] truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-[#667085] font-mono truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/admin/config"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-[#101722] hover:bg-slate-50 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#F45135]" />
                    <span>Cấu hình hệ thống</span>
                  </Link>
                  <Link
                    to="/admin/disputes"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-[#101722] hover:bg-slate-50 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>Xử lý khiếu nại</span>
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
