import React from 'react';
import { Music, Zap, Trophy, Theater, ArrowRight } from 'lucide-react';
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
  // Build bundleMap: bundleId -> all listings in that bundle
  const bundleMap = React.useMemo(() => {
    const map = new Map<string, MarketplaceListingDto[]>();
    for (const item of listings) {
      if (item.bundleId && (item.bundleTotalTickets ?? 0) > 1) {
        const group = map.get(item.bundleId) || [];
        group.push(item);
        map.set(item.bundleId, group);
      }
    }
    return map;
  }, [listings]);

  // Helper filter by category/keyword
  const concertListings = listings.filter((l) => {
    const title = (l.eventName || '').toLowerCase();
    return (
      title.includes('concert') ||
      title.includes('live') ||
      title.includes('tour') ||
      title.includes('show') ||
      title.includes('say hi') ||
      title.includes('tri âm')
    );
  });

  const sportsListings = listings.filter((l) => {
    const title = (l.eventName || '').toLowerCase();
    return (
      title.includes('derby') ||
      title.includes('bóng đá') ||
      title.includes('football') ||
      title.includes('clb') ||
      title.includes('v-league')
    );
  });

  const theaterListings = listings.filter((l) => {
    const title = (l.eventName || '').toLowerCase();
    return (
      title.includes('ngày xửa') ||
      title.includes('kịch') ||
      title.includes('theater') ||
      title.includes('nhà hát') ||
      title.includes('bến thành')
    );
  });

  const festivalListings = listings.filter((l) => {
    const title = (l.eventName || '').toLowerCase();
    return (
      title.includes('festival') ||
      title.includes('ravolution') ||
      title.includes('edm') ||
      title.includes('chông gai')
    );
  });

  // Helper: dedup bundle combos — chỉ giữ 1 card đại diện cho mỗi bundleId
  const dedupBundleListings = (items: MarketplaceListingDto[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (item.bundleId && (item.bundleTotalTickets ?? 0) > 1) {
        if (seen.has(item.bundleId)) return false;
        seen.add(item.bundleId);
      }
      return true;
    });
  };

  const concertDisplay = dedupBundleListings(concertListings);
  const sportsDisplay = dedupBundleListings(sportsListings);
  const theaterDisplay = dedupBundleListings(theaterListings);
  const festivalDisplay = dedupBundleListings(festivalListings);

  return (
    <div className="space-y-12 my-10">
      {/* 1. CONCERTS & LIVE MUSIC */}
      {concertDisplay.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Concerts &amp; Live Music
                </h3>
                <p className="text-xs text-[#8B929C]">High-energy concerts and live performances</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('CONCERT')}
              className="text-xs font-semibold text-[#FF5A36] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all ({concertDisplay.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {concertDisplay.slice(0, 3).map((listing) => (
              <TicketCard
                key={listing.listingId}
                listing={listing}
                onBuy={onBuy}
                bundleListings={listing.bundleId ? bundleMap.get(listing.bundleId) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. SPORTS & TOURNAMENTS */}
      {sportsDisplay.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Sports &amp; Major Matches
                </h3>
                <p className="text-xs text-[#8B929C]">Tickets for football tournaments and athletic events</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('SPORTS')}
              className="text-xs font-semibold text-emerald-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all ({sportsDisplay.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportsDisplay.slice(0, 3).map((listing) => (
              <TicketCard
                key={listing.listingId}
                listing={listing}
                onBuy={onBuy}
                bundleListings={listing.bundleId ? bundleMap.get(listing.bundleId) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. THEATER & SHOWS */}
      {theaterDisplay.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Theater className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Theater &amp; Performing Arts
                </h3>
                <p className="text-xs text-[#8B929C]">Musicals, dramatic plays, and family shows</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('THEATER')}
              className="text-xs font-semibold text-cyan-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all ({theaterDisplay.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {theaterDisplay.slice(0, 3).map((listing) => (
              <TicketCard
                key={listing.listingId}
                listing={listing}
                onBuy={onBuy}
                bundleListings={listing.bundleId ? bundleMap.get(listing.bundleId) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. FESTIVALS & EDM */}
      {festivalDisplay.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                  Festivals &amp; Electronic Music
                </h3>
                <p className="text-xs text-[#8B929C]">EDM beats, outdoor festivals, and multi-day stages</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewCategory('FESTIVAL')}
              className="text-xs font-semibold text-purple-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View all ({festivalDisplay.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {festivalDisplay.slice(0, 3).map((listing) => (
              <TicketCard
                key={listing.listingId}
                listing={listing}
                onBuy={onBuy}
                bundleListings={listing.bundleId ? bundleMap.get(listing.bundleId) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
