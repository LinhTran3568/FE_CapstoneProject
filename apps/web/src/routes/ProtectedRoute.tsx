import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '@ticketshield/types';
import { Loader2 } from 'lucide-react';

const RouteLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#05070A] flex flex-col items-center justify-center gap-3 text-white">
    <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
    <span className="text-xs font-mono tracking-widest uppercase text-slate-400">Verifying session...</span>
  </div>
);

/**
 * Route chỉ cho phép người dùng đã đăng nhập.
 * Lưu lại location hiện tại để redirect về sau khi đăng nhập.
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

/**
 * Route chỉ dành cho khách (chưa đăng nhập).
 * Khi đã đăng nhập, tự động chuyển tiếp sang Marketplace hoặc trang trước đó.
 */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoadingScreen />;
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/marketplace';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

export const RoleGuard: React.FC<{ allowedRoles: UserRole[] }> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <RouteLoadingScreen />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
