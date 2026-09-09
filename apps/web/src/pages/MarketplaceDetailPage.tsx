import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListingDetail } from '../hooks/useListings';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { EscrowBadge } from '../components/ui/EscrowBadge';
import { formatVND, formatVietnameseDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Lock, Star, Calendar, MapPin, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const MarketplaceDetailPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { data: listing, isLoading } = useListingDetail(listingId || 'lst-301');
  const navigate = useNavigate();

  if (isLoading || !listing) {
    return <div className="p-12 text-center text-slate-400">Đang tải thông tin niêm yết vé...</div>;
  }

  const isFlagged = listing.status === 'FLAGGED';

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Flag Alert if applicable */}
      {isFlagged && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <strong className="block text-sm">Cảnh báo An Ninh Phe Vé (Scalper Alert)</strong>
            Mẫu niêm yết này có mức chênh giá bất thường cao hơn 200% giá niêm yết BTC. Hệ thống Admin đã tạm khóa để xác minh thêm.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-750 pb-4">
              <VerifiedBadge text="Vé Đã Xác Thực Chống Lừa Đảo" />
              <EscrowBadge status="FUNDED" />
            </div>

            <h1 className="text-2xl font-extrabold text-white">{listing.eventTitle}</h1>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Thời gian: <strong>{formatVietnameseDate(listing.eventDate)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Địa điểm: <strong>{listing.venueName}</strong></span>
              </div>
            </div>

            <div className="bg-navy-900 border border-navy-750 p-4 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-200">Thông tin vị trí chỗ ngồi</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Khu vực: <strong className="text-cyan-400">{listing.seatZone}</strong></div>
                <div>Chi tiết: <strong>{listing.seatInfo}</strong></div>
                <div>Giá gốc BTC: <span className="line-through text-slate-400">{formatVND(listing.faceValue)}</span></div>
                <div>Giá sang nhượng: <strong className="text-emerald-400">{formatVND(listing.resalePrice)}</strong></div>
              </div>
            </div>
          </div>

          {/* Seller Trust Profile */}
          <div className="bg-navy-850 p-6 rounded-2xl border border-navy-750 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Hồ Sơ Uy Tín Người Bán (Seller Trust Profile)</h4>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white text-sm block">{listing.sellerName}</span>
                <span className="text-slate-400">Đã tham gia TicketShield từ 2025 • Đã xác minh KYC</span>
              </div>
              <div className="bg-navy-900 border border-navy-750 px-3 py-1.5 rounded-lg text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{listing.sellerRating} / 5.0 ({listing.sellerTotalSales} giao dịch)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-navy-850 p-6 rounded-2xl border border-cyan-500/30 shadow-glow-cyan space-y-5">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold block">Tổng tiền thanh toán</span>
              <span className="text-3xl font-extrabold text-cyan-400">{formatVND(listing.resalePrice)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">+ Phí dịch vụ bảo vệ Escrow (50.000 ₫)</span>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-xl text-xs text-cyan-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-4 h-4 text-cyan-400" /> Đảm Bảo An Toàn 100% Escrow
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Tiền của bạn sẽ được giữ an toàn tại ví Escrow cho đến khi bạn quét vé qua cổng sự kiện thành công.
              </p>
            </div>

            <Button
              onClick={() => navigate(`/checkout/${listing.id}`)}
              disabled={isFlagged}
              size="lg"
              className="w-full font-bold shadow-glow-cyan flex items-center justify-center gap-2"
            >
              <span>Mua Ngay Bảo Vệ Escrow</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
