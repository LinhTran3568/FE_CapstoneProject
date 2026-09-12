import React, { useState } from 'react';
import { Search, ShieldCheck, Ticket, Calendar, MapPin, ArrowRight, Loader2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { formatEventDateTime, formatVND } from '../utils/formatters';

export const MarketplacePage: React.FC = () => {
  const { showToast } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: listings = [], isLoading, isError, error, refetch, isFetching } = useMarketplaceListings({
    keyword: searchTerm.trim() || undefined,
  });

  const handleBuy = (title: string, price: number) => {
    showToast(`Khởi tạo thanh toán Escrow an toàn cho vé "${title}" (${formatVND(price)})...`, 'info');
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased overflow-hidden">
      {/* Concert Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/concert.jpg"
          alt="Concert Atmosphere"
          className="w-full h-full object-cover opacity-60 filter brightness-110 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/70 via-[#05070A]/50 to-[#05070A]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/25 via-transparent to-transparent" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-[#FF5A36]/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#FF5A36]" />
            <span className="text-[#FF5A36] text-xs font-bold uppercase tracking-widest font-display">
              Escrow Verified Secondary Market
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight uppercase">
            Chợ Vé Bán Lại (Resale Marketplace)
          </h1>
          <p className="text-sm text-[#A3A8B3] max-w-2xl leading-relaxed">
            Khám phá các vé hòa nhạc và sự kiện chính chủ 100% được xác thực từ Ban Tổ Chức. Mọi giao dịch được bảo vệ bằng hợp đồng giữ tiền Escrow an toàn tuyệt đối.
          </p>
        </div>

        {/* Filter & Search Controls */}
        <div className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, địa điểm, nghệ sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#A3A8B3] font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Vé đã được khóa & xác minh bởi BTC</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
            <p className="text-xs text-[#A3A8B3] font-mono">Đang tải danh sách vé trực tiếp từ hệ thống...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="py-16 bg-[#0A0D12] border border-rose-500/20 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Không thể kết nối đến máy chủ API</h3>
            <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
              {error instanceof Error ? error.message : 'Vui lòng kiểm tra dịch vụ Backend đang chạy và thử lại.'}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && listings.length === 0 && (
          <div className="py-16 bg-[#0A0D12]/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Hiện chưa có vé nào đang rao bán trên thị trường</h3>
            <p className="text-xs text-[#A3A8B3] max-w-md mx-auto">
              {searchTerm
                ? `Không tìm thấy vé nào khớp với từ khóa "${searchTerm}".`
                : 'Hãy là người đầu tiên đăng bán vé chính chủ với bảo vệ Escrow!'}
            </p>
          </div>
        )}

        {/* Listings Grid */}
        {!isLoading && !isError && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.listingId}
                className="bg-[#0A0D12]/90 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-[#FF5A36]/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                {/* Image & Banner Badge */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="/images/landing/featured-1.jpg"
                    alt={listing.eventName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/40 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold font-mono text-emerald-400 rounded-full uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {listing.verificationStatus || 'VERIFIED'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#A3A8B3] rounded-full">
                      {listing.maskedTicketCode}
                    </span>
                  </div>
                </div>

                {/* Listing Meta Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold font-display text-white line-clamp-1 group-hover:text-[#FF5A36] transition-colors">
                      {listing.eventName}
                    </h3>

                    <div className="space-y-1.5 text-xs text-[#A3A8B3] font-mono">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                        <span>{formatEventDateTime(listing.eventStartAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{listing.eventVenue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-white font-semibold">{listing.tierName}</span>
                      </div>
                      {listing.sellerFullName && (
                        <div className="flex items-center gap-2 text-[11px] text-[#8F96A3] pt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Người bán: {listing.sellerFullName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seller & Price Info */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#A3A8B3] uppercase tracking-wider font-display block">
                        Giá Bán Lại
                      </span>
                      <p className="text-xl font-bold font-display text-white tabular-nums">
                        {formatVND(listing.resalePrice)}
                      </p>
                      <p className="text-[10px] text-[#8F96A3] font-mono tabular-nums">
                        Gốc {formatVND(listing.originalPrice)}
                        {listing.discountPercentage > 0 && (
                          <span className="text-emerald-400 ml-1">(-{listing.discountPercentage}%)</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => handleBuy(listing.eventName, listing.resalePrice)}
                      className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Mua Vé</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
