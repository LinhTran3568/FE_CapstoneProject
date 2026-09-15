import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, ChevronLeft, ChevronRight, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useTrendingEvents } from '../../hooks/useTrendingEvents';
import { formatVND } from '../../utils/formatters';
import { TrendingEventDto } from '@ticketshield/types';

interface TrendingBannerSliderProps {
  onSelectEvent?: (eventName: string) => void;
}

// Fallback curated mock trending events in case backend is loading or empty
const FALLBACK_SLIDES: TrendingEventDto[] = [
  {
    eventId: 'fb-1',
    name: 'Anh Trai Say Hi Live Concert 2026',
    artist: 'HIEUTHUHAI, Anh Tú, Isaac, Rhyder',
    category: 'CONCERT',
    venue: 'Sân vận động Quốc gia Mỹ Đình',
    city: 'Hà Nội',
    bannerUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80',
    eventStartAt: '2026-10-24T19:00:00Z',
    minResalePrice: 1200000,
    totalAvailableListings: 18,
  },
  {
    eventId: 'fb-2',
    name: 'Mỹ Tâm Live Concert - Tri Âm Tour',
    artist: 'Mỹ Tâm',
    category: 'CONCERT',
    venue: 'Sân vận động Quân khu 7',
    city: 'TP. Hồ Chí Minh',
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
    eventStartAt: '2026-11-15T19:30:00Z',
    minResalePrice: 850000,
    totalAvailableListings: 12,
  },
  {
    eventId: 'fb-3',
    name: 'Ravolution Music Festival 2026',
    artist: 'Armin van Buuren, KSHMR, Suboi',
    category: 'FESTIVAL',
    venue: 'Khu Đô Thị Sala, TP. Thủ Đức',
    city: 'TP. Hồ Chí Minh',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    eventStartAt: '2026-12-05T15:00:00Z',
    minResalePrice: 650000,
    totalAvailableListings: 9,
  },
];

export const TrendingBannerSlider: React.FC<TrendingBannerSliderProps> = ({ onSelectEvent }) => {
  const { data: trendingEvents, isLoading } = useTrendingEvents({ limit: 5 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  const slides: TrendingEventDto[] =
    trendingEvents && trendingEvents.length > 0 ? trendingEvents : FALLBACK_SLIDES;

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto slide timer
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [isPaused, handleNext, slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  const formatSlideDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCtaClick = () => {
    if (onSelectEvent) {
      onSelectEvent(currentSlide.name);
    } else {
      const element = document.getElementById('marketplace-listings');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl bg-[#090C12] border border-white/10 shadow-2xl mb-10 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Viewport (16:8 desktop, 16:10 mobile) */}
      <div className="relative h-[340px] sm:h-[400px] md:h-[440px] w-full overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide.eventId || currentSlide.id || currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.35 },
              scale: { duration: 0.35 },
            }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Cinematic Overlay */}
            <img
              src={currentSlide.bannerUrl}
              alt={currentSlide.name}
              className="w-full h-full object-cover object-center"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/90 via-[#05070A]/50 to-transparent" />

            {/* Slide Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12 z-10 max-w-3xl">
              {/* Category & Status Pill */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/90 backdrop-blur-md text-white font-mono text-[11px] font-bold uppercase tracking-wider shadow-lg">
                  <Sparkles className="w-3 h-3" />
                  Sự kiện nổi bật
                </span>

                {currentSlide.totalAvailableListings > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-emerald-400 font-mono text-[11px] font-semibold">
                    <Tag className="w-3 h-3" />
                    {currentSlide.totalAvailableListings} vé đang bán
                  </span>
                )}
              </div>

              {/* Event Name */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md mb-2">
                {currentSlide.name}
              </h2>

              {/* Artist / Performer */}
              {currentSlide.artist && (
                <p className="text-sm sm:text-base font-medium text-[#CBD5E1] line-clamp-1 mb-3">
                  Nghệ sĩ: <span className="text-white font-bold">{currentSlide.artist}</span>
                </p>
              )}

              {/* Meta details & Price */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-mono text-[#94A3B8] mb-5">
                <div className="flex items-center gap-1.5 text-white/90">
                  <Calendar className="w-4 h-4 text-[#FF5A36]" />
                  <span>{formatSlideDate(currentSlide.eventStartAt)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-white/90">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>
                    {currentSlide.venue} · <strong className="text-white">{currentSlide.city}</strong>
                  </span>
                </div>

                {currentSlide.minResalePrice && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#94A3B8]">Vé từ:</span>
                    <span className="text-base sm:text-lg font-black text-[#20C997] font-display">
                      {formatVND(currentSlide.minResalePrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="h-11 px-6 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_20px_rgba(255,90,54,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Xem vé sự kiện</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls: Previous / Next Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 z-20 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 z-20 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Navigation Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? 'w-6 bg-[#FF5A36] shadow-[0_0_10px_#FF5A36]'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
