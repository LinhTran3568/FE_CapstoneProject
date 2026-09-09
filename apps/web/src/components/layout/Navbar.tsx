import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Ticket, User, Store, LayoutDashboard, Settings, Bot, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '@ticketshield/types';

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as UserRole;
    switchRole(role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'ORGANIZER') navigate('/organizer');
    else if (role === 'RESELLER') navigate('/seller');
    else navigate('/dashboard');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-navy-750">
      {/* Simulation Bar for Capstone Demo */}
      <div className="bg-navy-950 border-b border-navy-800 px-4 py-1 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">TicketShield AI Engine:</span>
          <span className="text-emerald-400">Hoạt động bình thường (Accuracy 99.4%)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Demo Role Switcher:</span>
          <select
            value={user?.role || 'BUYER'}
            onChange={handleRoleChange}
            className="bg-navy-800 text-cyan-400 border border-navy-700 rounded px-2 py-0.5 font-semibold text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="BUYER">1. Ticket Buyer / Resale Buyer</option>
            <option value="RESELLER">2. Reseller (Người bán vé)</option>
            <option value="ORGANIZER">3. Event Organizer (BTC)</option>
            <option value="ADMIN">4. System Administrator</option>
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-glow-cyan">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              TicketShield<span className="text-cyan-400">.AI</span>
            </span>
            <span className="block text-[10px] text-slate-400 font-medium -mt-1 tracking-wider uppercase">
              Verified P2P Resale Vietnam
            </span>
          </div>
        </Link>

        {/* Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/events"
            className={`transition-colors hover:text-cyan-400 ${
              isActive('/events') ? 'text-cyan-400 font-semibold' : 'text-slate-300'
            }`}
          >
            Sự Kiện Hot
          </Link>
          <Link
            to="/marketplace"
            className={`flex items-center gap-1.5 transition-colors hover:text-cyan-400 ${
              isActive('/marketplace') ? 'text-cyan-400 font-semibold' : 'text-slate-300'
            }`}
          >
            <Store className="w-4 h-4 text-cyan-400" />
            Sàn Vé Verified
          </Link>
          <Link
            to="/tickets/verify"
            className={`flex items-center gap-1.5 transition-colors hover:text-cyan-400 ${
              isActive('/tickets/verify') ? 'text-cyan-400 font-semibold' : 'text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Xác Thực Vé Bán
          </Link>

          {/* Role specific links */}
          {user?.role === 'BUYER' && (
            <Link
              to="/my-tickets"
              className={`transition-colors hover:text-cyan-400 ${
                isActive('/my-tickets') ? 'text-cyan-400 font-semibold' : 'text-slate-300'
              }`}
            >
              Ví Vé Của Tôi
            </Link>
          )}

          {user?.role === 'RESELLER' && (
            <Link
              to="/seller"
              className="text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 font-semibold"
            >
              Kênh Người Bán
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/20 font-semibold flex items-center gap-1"
            >
              <ShieldAlert className="w-4 h-4" /> Admin Monitoring
            </Link>
          )}

          {user?.role === 'ORGANIZER' && (
            <Link
              to="/organizer"
              className="text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 font-semibold"
            >
              Cổng Ban Tổ Chức
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 p-1.5 rounded-lg bg-navy-800 border border-navy-700 hover:border-cyan-500/50 transition-all"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-cyan-400/50"
                />
                <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                  {user.fullName}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg shadow-glow-cyan"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
