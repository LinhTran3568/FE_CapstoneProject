import React from 'react';
import { Event } from '@ticketshield/types';
import { Card } from '../ui/Card';
import { formatVND, formatShortDate } from '../../utils/formatters';
import { Calendar, MapPin, ShieldCheck, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <Card hoverGlow className="flex flex-col h-full overflow-hidden p-0 group border-navy-750">
      <div className="relative h-48 overflow-hidden bg-navy-950">
        <img
          src={event.thumbnailImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
        
        {event.isHighDemand && (
          <span className="absolute top-3 left-3 bg-red-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-glow-red backdrop-blur-sm">
            <Flame className="w-3.5 h-3.5 fill-white" /> AI BOT SHIELD PROTECTED
          </span>
        )}

        <span className="absolute top-3 right-3 bg-navy-950/80 backdrop-blur-md text-cyan-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-cyan-500/30">
          {event.category}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-xs text-slate-300 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{formatShortDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue.name}, {event.venue.city}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-navy-750 flex items-center justify-between">
          <div>
            <span className="block text-[11px] text-slate-400 uppercase font-medium">Giá từ</span>
            <span className="text-sm font-extrabold text-cyan-400">{formatVND(event.minPrice)}</span>
          </div>

          <Link
            to={`/events/${event.id}`}
            className="text-xs font-semibold bg-navy-750 hover:bg-cyan-500 hover:text-navy-950 text-slate-200 px-3 py-2 rounded-lg transition-all"
          >
            Chi tiết vé
          </Link>
        </div>
      </div>
    </Card>
  );
};
