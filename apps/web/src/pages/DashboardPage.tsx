import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { LayoutDashboard, User as UserIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 py-6">
      {/* Profile Header Skeleton */}
      <div className="bg-navy-850 p-6 rounded-3xl border border-navy-750 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
          <UserIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{user?.fullName || 'Người dùng'}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'email@example.com'}</p>
        </div>
      </div>

      {/* Dashboard Main Content Area */}
      <Card hoverGlow className="p-8 text-center space-y-3">
        <LayoutDashboard className="w-10 h-10 text-cyan-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Khung Dashboard Người Dùng</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Khu vực này dành cho nội dung quản lý cá nhân, tích hợp dữ liệu từ Backend API khi sẵn sàng.
        </p>
      </Card>
    </div>
  );
};

