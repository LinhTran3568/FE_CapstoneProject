import React from 'react';
import { Music, Trophy, Theater, ArrowRight, Zap } from 'lucide-react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { TicketCard } from './TicketCard';

interface CategoryEventsShowcaseProps {
  listings: MarketplaceListingDto[];
  onBuy: (listing: MarketplaceListingDto) => void;
  onViewCategory: (category: string) => void;
}

export const CategoryEventsShowcase: React.FC<CategoryEventsShowcaseProps> = ({
  listings,
  onBuy,
  onViewCategory,
}) => {
  // Filter listings by category keywords
  const concertListings = listings.filter((item) => {
    const title = (item.eventName || '').toLowerCase();
    return (
      title.includes('concert') ||
      title.includes('live') ||
      title.includes('show') ||
      title.includes('âm nhạc') ||
      title.includes('say hi') ||
      title.includes('tri âm')
    );
  });

  const sportsListings = listings.filter((item) => {
    const title = (item.eventName || '').toLowerCase();
    return (
      title.includes('bóng đá') ||
      title.includes('derby') ||
      title.includes('v-league') ||
      title.includes('fc') ||
      title.includes('thể thao')
    );
  });

  const theaterListings = listings.filter((item) => {
    const title = (item.eventName || '').toLowerCase();
    return title.includes('kịch') || title.includes('ngày xửa') || title.includes('vở kịch');
  });

  const festivalListings = listings.filter((item) => {
    const title = (item.eventName || '').toLowerCase();
    return title.includes('festival') || title.includes('edm') || title.includes('rave');
  });

  return (
    <div className="space-y-12 my-10">
      {/* 1. CA NHẠC & CONCERT */}
      {concertListings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Ca Nhạc & Live Concert
                </h3>
                <p className="text-xs text-[#8B929C]">Các đêm diễn âm nhạc bùng nổ</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('CONCERT')}
              className="text-xs font-semibold text-[#FF5A36] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem tất cả ({concertListings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {concertListings.slice(0, 3).map((listing) => (
              <TicketCard key={listing.listingId} listing={listing} onBuy={onBuy} />
            ))}
          </div>
        </div>
      )}

      {/* 2. THỂ THAO & DERBY */}
      {sportsListings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Thể Thao & Trận Đấu Đỉnh Cao
                </h3>
                <p className="text-xs text-[#8B929C]">Vé các giải đấu bóng đá và sự kiện thể thao</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('SPORTS')}
              className="text-xs font-semibold text-emerald-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem tất cả ({sportsListings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportsListings.slice(0, 3).map((listing) => (
              <TicketCard key={listing.listingId} listing={listing} onBuy={onBuy} />
            ))}
          </div>
        </div>
      )}

      {/* 3. SÂN KHẤU & KỊCH NGHỆ */}
      {theaterListings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Theater className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Sân Khấu & Kịch Nghệ
                </h3>
                <p className="text-xs text-[#8B929C]">Nhạc kịch, kịch nói và chương trình thiếu nhi</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('THEATER')}
              className="text-xs font-semibold text-cyan-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem tất cả ({theaterListings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {theaterListings.slice(0, 3).map((listing) => (
              <TicketCard key={listing.listingId} listing={listing} onBuy={onBuy} />
            ))}
          </div>
        </div>
      )}

      {/* 4. FESTIVAL & EDM */}
      {festivalListings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Lễ Hội & Festival EDM
                </h3>
                <p className="text-xs text-[#8B929C]">Âm nhạc điện tử và lễ hội ngoài trời</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('FESTIVAL')}
              className="text-xs font-semibold text-purple-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem tất cả ({festivalListings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {festivalListings.slice(0, 3).map((listing) => (
              <TicketCard key={listing.listingId} listing={listing} onBuy={onBuy} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
