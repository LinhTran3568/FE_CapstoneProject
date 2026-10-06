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
      className="group relative w-full h-[250px] sm:h-[270px] bg-transparent border-0 select-none cursor-pointer flex items-center justify-center transition-all duration-300"
      onClick={() => {
        if (!isTransacting && onViewDetails) {
          onViewDetails(listing);
        }
      }}
    >
      {/* Studio Radial Ambient Reflections in Open Space */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[260px] bg-slate-800/25 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[200px] bg-cyan-500/10 rounded-full blur-[90px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-[340px] h-[200px] bg-orange-500/10 rounded-full blur-[90px]" />

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
