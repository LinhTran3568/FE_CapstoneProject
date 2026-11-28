import React, { useState, useMemo, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TrendingEventDto } from '@ticketshield/types';
import { EventCard } from './EventCard';

interface UpcomingTabbedSectionProps {
  events: TrendingEventDto[];
  onSelectEvent: (eventName: string) => void;
}

export const UpcomingTabbedSection: React.FC<UpcomingTabbedSectionProps> = ({
  events,
  onSelectEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'7days' | 'thisMonth'>('7days');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter events based on active time tab
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const sevenDaysAhead = now + 7 * 24 * 60 * 60 * 1000;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (activeTab === '7days') {
      const result = events.filter((item) => {
        const time = new Date(item.eventStartAt).getTime();
        return time >= now && time <= sevenDaysAhead;
      });
      return result.length > 0 ? result : events.slice(0, 4);
    } else {
      const result = events.filter((item) => {
        const d = new Date(item.eventStartAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      return result.length > 0 ? result : events;
    }
  }, [events, activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="my-10 relative">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">Upcoming Events</h3>
            <p className="text-xs text-[#8B929C]">
              Event directory and verified tickets available on the marketplace
            </p>
          </div>
        </div>

        {/* 2 Tabs Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-[#090C12] border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('7days')}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === '7days'
                ? 'bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/30'
                : 'text-[#8B929C] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Next 7 Days</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thisMonth')}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'thisMonth'
                ? 'bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/30'
                : 'text-[#8B929C] hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>This Month</span>
          </button>
        </div>
      </div>

      {/* Carousel Container with 2 Floating Arrow Buttons */}
      <div className="relative group/carousel">
        {/* Left Floating Arrow Button */}
        {filteredEvents.length > 2 && (
          <div className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="w-11 h-11 rounded-full bg-[#0E131F]/90 hover:bg-[#FF5A36] border border-white/20 hover:border-[#FF5A36] text-white flex items-center justify-center transition-colors shadow-2xl cursor-pointer backdrop-blur-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* Right Floating Arrow Button */}
        {filteredEvents.length > 2 && (
          <div className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="w-11 h-11 rounded-full bg-[#0E131F]/90 hover:bg-[#FF5A36] border border-white/20 hover:border-[#FF5A36] text-white flex items-center justify-center transition-colors shadow-2xl cursor-pointer backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* Horizontal Scroll Track */}
        {filteredEvents.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex items-stretch gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:#FF5A36_rgba(255,255,255,0.05)]"
          >
            {filteredEvents.map((evt) => (
              <div
                key={evt.id || evt.eventId || evt.name}
                className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start flex flex-col h-full self-stretch"
              >
                <EventCard event={evt} onSelectEvent={onSelectEvent} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 bg-[#090C12]/70 border border-white/10 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold text-white">No events found in this time range</p>
            <p className="text-xs text-[#8B929C]">Please switch to the "This Month" tab to explore more</p>
          </div>
        )}
      </div>
    </div>
  );
};
