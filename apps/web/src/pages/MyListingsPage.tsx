import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, PlusCircle, Trash2, Loader2, Lock, Share2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { resaleApi, SellerListingDto } from '@ticketshield/api-client';

export const MyListingsPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [listings, setListings] = useState<SellerListingDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await resaleApi.getMyListings();
      setListings(data || []);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách vé rao bán.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const handleCancelListing = async (listingId: string, eventName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy tin rao bán vé cho sự kiện "${eventName}"? Vé sẽ được giải phóng khóa gRPC bên BTC.`)) {
      return;
    }

    try {
      setCancellingId(listingId);
      await resaleApi.cancelListing(listingId);
      showToast(`Đã hủy niêm yết vé cho "${eventName}" thành công!`, 'success');
      await fetchMyListings();
    } catch (err: any) {
      showToast(err.message || 'Không thể hủy niêm yết vé. Vui lòng thử lại!', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased overflow-hidden">
      {/* Background Concert Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/featured-2.jpg"
          alt="Concert Background"
          className="w-full h-full object-cover opacity-25 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/85 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold font-display text-white uppercase tracking-tight">
              Quản Lý Vé Đang Rao Bán (My Listings)
            </h1>
            <p className="text-sm text-[#A3A8B3]">Quản lý tất cả các vé rao bán được niêm yết dưới tài khoản Reseller của bạn.</p>
          </div>
          <Link
            to="/sell-ticket"
            className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/30 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Đăng Bán Vé Mới</span>
          </Link>
        </div>

        {/* Listings List */}
        <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mx-auto" />
              <p className="text-sm text-[#A3A8B3] font-mono">Đang tải danh sách vé rao bán từ Backend...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-[#A3A8B3]">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-display">Bạn chưa có vé nào đang đăng bán</h3>
                <p className="text-xs text-[#A3A8B3] max-w-sm mx-auto">Hãy niêm yết vé chính chủ đầu tiên lên TicketShield Marketplace với Escrow Protection.</p>
              </div>
              <Link
                to="/sell-ticket"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/30"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng Bán Vé Ngay</span>
              </Link>
            </div>
          ) : (
            listings.map((item) => (
              <div key={item.listingId} className="p-5 bg-[#05070A] border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#FF5A36]/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36]">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{item.eventName || 'Anh Trai Say Hi Concert'}</h4>
                      {item.isPrivate && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono rounded-full flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Vé Riêng Tư
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A3A8B3] font-mono">
                      Mã vé gốc: <span className="text-white font-bold">{item.originalTicketCode}</span> • Hạng: {item.tierName || 'VIP Zone'} • Địa điểm: {item.eventVenue || 'Mỹ Đình'}
                    </p>
                    {item.shareUrl && (
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono pt-0.5">
                        <Share2 className="w-3 h-3" />
                        <a href={item.shareUrl} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-md">
                          {item.shareUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <p className="font-bold text-white text-base font-display">
                      {item.resalePrice ? item.resalePrice.toLocaleString('vi-VN') : '0'} VNĐ
                    </p>
                    {item.originalPrice && item.originalPrice !== item.resalePrice && (
                      <p className="text-[11px] text-[#A3A8B3] font-mono line-through">
                        Giá gốc: {item.originalPrice.toLocaleString('vi-VN')} VNĐ
                      </p>
                    )}
                    <span className={`inline-block mt-1 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
                      item.listingStatus === 'Verified' || item.listingStatus === 'Active' || item.listingStatus === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.listingStatus === 'Cancelled'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/10 text-[#A3A8B3]'
                    }`}>
                      {item.listingStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.listingStatus !== 'Cancelled' && (
                      <button
                        onClick={() => handleCancelListing(item.listingId, item.eventName || item.originalTicketCode)}
                        disabled={cancellingId === item.listingId}
                        className="p-2.5 bg-white/5 border border-white/10 hover:border-red-500/40 text-[#A3A8B3] hover:text-red-400 rounded-xl transition-all flex items-center gap-1 text-xs"
                        title="Hủy tin đăng & Mở khóa vé"
                      >
                        {cancellingId === item.listingId ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Hủy Niêm Yết</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default MyListingsPage;
