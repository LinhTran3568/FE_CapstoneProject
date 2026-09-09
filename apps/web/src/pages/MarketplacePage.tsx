import React, { useState } from 'react';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Search, Filter, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');
  const { data: listings, isLoading } = useListings({ verifiedOnly, sortBy });

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-navy-750 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Peer-to-Peer Resale
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Sàn Sang Nhượng Vé Xác Thực Việt Nam</h1>
          <p className="text-sm text-slate-400">100% Vé đã được kiểm tra mã QR chính chủ & bảo vệ thanh toán Escrow</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-navy-850 p-4 rounded-xl border border-navy-750 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-navy-700 bg-navy-900 text-cyan-500 focus:ring-cyan-400"
            />
            <span>Chỉ hiển thị vé đã Verified (Khuyên dùng)</span>
          </label>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-navy-900 text-slate-200 border border-navy-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="newest">Mới đăng nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-navy-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings?.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
};
