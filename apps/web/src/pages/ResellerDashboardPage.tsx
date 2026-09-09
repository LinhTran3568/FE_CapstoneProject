import React from 'react';
import { Link } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Button } from '../components/ui/Button';
import { Store, Plus, ShieldCheck, DollarSign } from 'lucide-react';
import { formatVND } from '../utils/formatters';

export const ResellerDashboardPage: React.FC = () => {
  const { data: listings, isLoading } = useListings();

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-navy-850 p-6 rounded-3xl border border-navy-750">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Kênh Người Bán Vé (Reseller Portal)</h1>
          <p className="text-xs text-slate-400 mt-1">Đăng bán vé chính chủ đã qua xác thực AI TicketShield</p>
        </div>

        <Link to="/seller/listings/new">
          <Button size="lg" className="font-bold shadow-glow-cyan flex items-center gap-2">
            <Plus className="w-5 h-5" /> Đăng Bán Vé Mới (Verified)
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-navy-850 p-5 rounded-2xl border border-navy-750">
          <span className="text-xs text-slate-400 block mb-1">Vé Đang Rao Bán</span>
          <span className="text-2xl font-extrabold text-white">3 Vé</span>
        </div>
        <div className="bg-navy-850 p-5 rounded-2xl border border-navy-750">
          <span className="text-xs text-slate-400 block mb-1">Đã Bán Thành Công</span>
          <span className="text-2xl font-extrabold text-emerald-400">28 Vé</span>
        </div>
        <div className="bg-navy-850 p-5 rounded-2xl border border-navy-750">
          <span className="text-xs text-slate-400 block mb-1">Doanh Thu Đã Giải Ngân</span>
          <span className="text-2xl font-extrabold text-cyan-400">{formatVND(67200000)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Danh Sách Vé Đã Đăng Của Tôi</h2>
        {isLoading ? (
          <div className="h-64 bg-navy-800 rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings?.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
