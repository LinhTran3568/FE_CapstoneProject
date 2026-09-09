import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMyTickets } from '../hooks/useTickets';
import { DigitalTicketCard } from '../components/ticket/DigitalTicketCard';
import { Link } from 'react-router-dom';
import { ShieldCheck, Ticket, Store, Lock, History, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: tickets, isLoading } = useMyTickets();

  return (
    <div className="space-y-8 py-6">
      {/* Profile Header */}
      <div className="bg-navy-850 p-6 rounded-3xl border border-navy-750 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl}
            alt={user?.fullName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-glow-cyan"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{user?.fullName}</h1>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email} • {user?.phoneNumber}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/tickets/verify">
            <Button size="sm" variant="outline" className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Xác Thực Vé Bán
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button size="sm" className="flex items-center gap-1.5 font-bold">
              <Store className="w-4 h-4" /> Mua Vé Verified
            </Button>
          </Link>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" /> Vé Của Tôi Trong Ví (Digital Tickets)
          </h2>
          <span className="text-xs text-slate-400">Tự động làm mới mã QR Check-in động</span>
        </div>

        {isLoading ? (
          <div className="h-64 bg-navy-800 rounded-2xl animate-pulse" />
        ) : (
          <div className="space-y-6">
            {tickets?.map((t) => (
              <DigitalTicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
