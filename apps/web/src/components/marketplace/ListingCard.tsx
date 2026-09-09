import React from 'react';
import { TicketListing } from '@ticketshield/types';
import { Card } from '../ui/Card';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { formatVND, formatShortDate } from '../../utils/formatters';
import { ShieldCheck, Star, User, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ListingCard: React.FC<{ listing: TicketListing }> = ({ listing }) => {
  const isFlagged = listing.status === 'FLAGGED';

  return (
    <Card hoverGlow className={`flex flex-col h-full justify-between relative ${isFlagged ? 'border-red-500/40 bg-red-950/10' : ''}`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <VerifiedBadge text="Verified by TicketShield" size="sm" />
          <div className="flex items-center gap-1 bg-navy-900 px-2 py-0.5 rounded text-xs text-amber-400 font-semibold border border-navy-750">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{listing.sellerRating} ({listing.sellerTotalSales} bán thành công)</span>
          </div>
        </div>

        <h3 className="font-bold text-slate-100 text-base mb-1 line-clamp-2">{listing.eventTitle}</h3>
        <p className="text-xs text-slate-400 mb-3">{listing.venueName} • {formatShortDate(listing.eventDate)}</p>

        <div className="bg-navy-900/80 border border-navy-750 rounded-lg p-3 mb-4 space-y-1 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Khu vực chỗ ngồi:</span>
            <span className="font-bold text-cyan-400">{listing.seatZone}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Chi tiết chỗ:</span>
            <span className="font-medium text-slate-200">{listing.seatInfo}</span>
          </div>
          <div className="flex justify-between text-slate-400 pt-1 border-t border-navy-800">
            <span>Giá niêm yết BTC (Face value):</span>
            <span className="line-through text-slate-400">{formatVND(listing.faceValue)}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Giá nhượng lại</span>
            <span className="text-lg font-extrabold text-white">{formatVND(listing.resalePrice)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-md">
            <Lock className="w-3 h-3" /> Bảo vệ Escrow
          </div>
        </div>

        <Link
          to={`/marketplace/${listing.id}`}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-glow-cyan text-sm transition-all"
        >
          <span>Mua vé bảo vệ Escrow</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
};
