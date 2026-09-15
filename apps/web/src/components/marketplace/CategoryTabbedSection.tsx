import React, { useState, useMemo, useRef } from 'react';
import { Music, Zap, Trophy, Theater, GraduationCap, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TrendingEventDto } from '@ticketshield/types';
import { EventCard } from './EventCard';

interface CategoryTabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const CATEGORY_TABS: CategoryTabItem[] = [
  { id: 'ALL', label: 'Tất cả', icon: LayoutGrid },
  { id: 'CONCERT', label: 'Ca nhạc & Concert', icon: Music },
  { id: 'FESTIVAL', label: 'Festival & EDM', icon: Zap },
  { id: 'SPORTS', label: 'Thể thao & Derby', icon: Trophy },
  { id: 'THEATER', label: 'Sân khấu & Kịch', icon: Theater },
  { id: 'WORKSHOP', label: 'Hội thảo', icon: GraduationCap },
];

interface CategoryTabbedSectionProps {
  events: TrendingEventDto[];
  onSelectEvent: (eventName: string) => void;
}

export const CategoryTabbedSection: React.FC<CategoryTabbedSectionProps> = ({
  events,
  onSelectEvent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter events by active category tab
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'ALL') return events;

    return events.filter((item) => {
      if (item.category === selectedCategory) return true;
      const title = (item.name || '').toLowerCase();
      if (selectedCategory === 'CONCERT') {
        return (
          title.includes('concert') ||
          title.includes('live') ||
          title.includes('show') ||
          title.includes('âm nhạc') ||
          title.includes('say hi') ||
          title.includes('tri âm')
        );
      }
      if (selectedCategory === 'FESTIVAL') {
        return title.includes('festival') || title.includes('edm') || title.includes('rave');
      }
      if (selectedCategory === 'SPORTS') {
        return (
          title.includes('bóng đá') ||
          title.includes('derby') ||
          title.includes('v-league') ||
          title.includes('fc') ||
          title.includes('thể thao')
        );
      }
      if (selectedCategory === 'THEATER') {
        return title.includes('kịch') || title.includes('ngày xửa') || title.includes('vở kịch');
      }
      return false;
    });
  }, [events, selectedCategory]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="my-12 relative">
      {/* Header & Category Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-white">Khám Phá Theo Thể Loại</h3>
          <p className="text-xs text-[#8B929C]">
            Chọn danh mục để xem các sự kiện và tổng số lượng vé đang có trên hệ thống
          </p>
        </div>

        <span className="text-xs font-mono font-semibold text-[#CBD5E1]">
          Có <strong className="text-[#FF5A36]">{filteredEvents.length}</strong> sự kiện phù hợp
        </span>
      </div>

      {/* Category Tabs Bar */}
      <div className="w-full overflow-x-auto no-scrollbar py-1 mb-6">
        <div className="flex items-center gap-2.5 min-w-max">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer border select-none ${
                  isSelected
                    ? 'bg-[#FF5A36] border-[#FF5A36] text-white shadow-[0_4px_15px_rgba(255,90,54,0.35)] scale-[1.02]'
                    : 'bg-[#090C12]/90 hover:bg-[#121620] border-white/10 hover:border-white/20 text-[#A3A8B3] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#8B929C]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
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
              aria-label="Cuộn sang trái"
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
              aria-label="Cuộn sang phải"
              className="w-11 h-11 rounded-full bg-[#0E131F]/90 hover:bg-[#FF5A36] border border-white/20 hover:border-[#FF5A36] text-white flex items-center justify-center transition-colors shadow-2xl cursor-pointer backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* Horizontal Scroll Track with visible sleek scrollbar */}
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
          <div className="py-16 bg-[#090C12]/70 border border-white/10 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold text-white">Chưa có sự kiện nào thuộc thể loại này</p>
            <p className="text-xs text-[#8B929C]">Vui lòng chọn "Tất cả" hoặc thể loại khác để khám phá</p>
          </div>
        )}
      </div>
    </div>
  );
};
