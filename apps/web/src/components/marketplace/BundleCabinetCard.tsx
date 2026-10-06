import React from 'react';
import { MarketplaceListingDto } from '@ticketshield/types';
import { ConsoleViewer3D } from './console/ConsoleViewer3D';

interface BundleCabinetCardProps {
  listing: MarketplaceListingDto;
  onBuy?: (listing: MarketplaceListingDto) => void;
  onViewDetails?: (listing: MarketplaceListingDto) => void;
  bundleListings?: MarketplaceListingDto[];
}

export const BundleCabinetCard: React.FC<BundleCabinetCardProps> = ({
  listing,
  onBuy: _onBuy,
  onViewDetails,
  bundleListings = [],
}) => {
  const rawStatus = (listing.listingStatus || 'Verified').toLowerCase();
  const isTransacting = rawStatus === 'transacting';
  const isSold = rawStatus === 'sold';

  return (
    <div
      id={`bundle-cabinet-card-${listing.listingId}`}
      className="group relative w-full h-[230px] sm:h-[250px] rounded-3xl bg-[#080B12] border border-white/10 hover:border-[#FF5A36]/50 shadow-[0_12px_36px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_48px_rgba(255,90,54,0.2)] transition-all duration-300 overflow-hidden select-none cursor-pointer"
      onClick={() => {
        if (!isTransacting && onViewDetails) {
          onViewDetails(listing);
        }
      }}
    >
      {/* Studio Radial Ambient Reflections */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[220px] bg-slate-800/20 rounded-full blur-[90px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[180px] bg-cyan-500/10 rounded-full blur-[80px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-[280px] h-[180px] bg-orange-500/10 rounded-full blur-[80px]" />

      {/* 3D Console Cabinet Dispenser */}
      <div className="relative w-full h-full">
        <ConsoleViewer3D
          listing={listing}
          bundleListings={bundleListings}
          onTicketClick={() => {
            if (!isTransacting && onViewDetails) {
              onViewDetails(listing);
            }
          }}
        />
      </div>

      {/* Transacting Overlay if applicable */}
      {isTransacting && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-[#07080b]/80 backdrop-blur-[5px] border border-amber-500/40 flex items-center justify-center p-4 rounded-3xl"
        >
          <div className="px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider uppercase font-mono">
            Vé đang trong phiên thanh toán
          </div>
        </div>
      )}

      {/* Sold Overlay */}
      {isSold && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-[#07080b]/80 backdrop-blur-[5px] border border-zinc-700/50 flex items-center justify-center p-4 rounded-3xl"
        >
          <div className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-400 text-xs font-bold tracking-wider uppercase font-mono">
            Vé đã bán hết
          </div>
        </div>
      )}
    </div>
  );
};
