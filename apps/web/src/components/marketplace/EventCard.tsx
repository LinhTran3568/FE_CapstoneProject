import React from 'react';
import { Calendar, MapPin, Tag, ArrowRight } from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import { TrendingEventDto } from '@ticketshield/types';

interface EventCardProps {
  event: TrendingEventDto;
  onSelectEvent: (eventName: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelectEvent }) => {
  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={() => onSelectEvent(event.name)}
      className="group relative bg-[#0D1117] border border-white/10 hover:border-[#FF5A36]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,90,54,0.15)] hover:-translate-y-1 flex flex-col cursor-pointer"
    >
      {/* 1. Event Banner / Poster */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
        <img
          src={
            event.bannerUrl ||
            'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80'
          }
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out brightness-95 group-hover:brightness-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090C12] via-black/30 to-transparent pointer-events-none" />

        {/* Top-Left: Category Pill */}
        {event.category && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[11px] font-mono font-bold text-white uppercase shadow-md">
              {event.category === 'CONCERT'
                ? 'Concert'
                : event.category === 'SPORTS'
                ? 'Sports'
                : event.category === 'THEATER'
                ? 'Theater'
                : event.category === 'FESTIVAL'
                ? 'Festival'
                : event.category}
            </span>
          </div>
        )}

        {/* Top-Right: Available Tickets Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1 shadow-md">
            <Tag className="w-3 h-3" />
            <span>{event.totalAvailableListings} available</span>
          </span>
        </div>
      </div>

      {/* 2. Card Body: Flex-1 with strict min-heights for pixel perfection */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Event Name: Fixed 2-line height (56px) so all cards align identically */}
          <div className="h-14 flex items-start">
            <h3 className="text-base sm:text-lg font-bold font-display text-white group-hover:text-[#FF5A36] transition-colors line-clamp-2 leading-snug">
              {event.name}
            </h3>
          </div>

          {/* Artist: Fixed height slot (20px) to prevent layout shifts */}
          <div className="h-5 flex items-center">
            {event.artist ? (
              <p className="text-xs text-[#CBD5E1] truncate">
                Artist: <span className="text-white font-medium">{event.artist}</span>
              </p>
            ) : (
              <p className="text-xs text-[#8B929C] italic">Various Artists</p>
            )}
          </div>

          {/* Date & Location: Fixed heights with truncation */}
          <div className="space-y-1.5 text-xs text-[#94A3B8] font-sans pt-1">
            <div className="flex items-center gap-2 h-5">
              <Calendar className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
              <span className="text-white font-medium truncate">{formatEventDate(event.eventStartAt)}</span>
            </div>

            <div className="flex items-center gap-2 h-5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[#CBD5E1] truncate">
                {event.venue} {event.city ? `· ${event.city}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Card Footer: Starting Price & CTA Button (Aligned bottom) */}
        <div className="pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#8B929C] uppercase font-mono tracking-wider block">
              Tickets From
            </span>
            <div className="h-7 flex items-baseline">
              <span className="text-lg sm:text-xl font-black font-display text-white tabular-nums">
                {event.minResalePrice ? formatVND(event.minResalePrice) : 'Contact'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectEvent(event.name)}
            className="h-10 px-4 bg-[#FF5A36] hover:bg-[#FF7252] active:scale-95 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>View Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
