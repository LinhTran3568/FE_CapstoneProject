import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-navy-750">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-glow-cyan">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              Capstone<span className="text-cyan-400">.FE</span>
            </span>
          </div>
        </Link>

        {/* Main Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={`transition-colors hover:text-cyan-400 ${
              isActive('/') ? 'text-cyan-400 font-semibold' : 'text-slate-300'
            }`}
          >
            Trang Chủ
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 transition-colors hover:text-cyan-400 ${
                isActive('/dashboard') ? 'text-cyan-400 font-semibold' : 'text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 hover:border-cyan-500/50 transition-all text-xs font-semibold text-slate-200"
            >
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                {user.fullName ? user.fullName[0] : 'U'}
              </div>
              <span>{user.fullName || 'User'}</span>
            </Link>
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

