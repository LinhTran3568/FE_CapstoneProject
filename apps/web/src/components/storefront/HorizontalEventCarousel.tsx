import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UPCOMING_CONCERTS } from '../../data/storefrontCatalog';

export const HorizontalEventCarousel: React.FC = () => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardStep, setCardStep] = useState(544);

  // Measure card width + gap dynamically
  useEffect(() => {
    const updateStep = () => {
      if (cardRef.current) {
        // card offsetWidth + 24px gap
        setCardStep(cardRef.current.offsetWidth + 24);
      }
    };
    updateStep();
    window.addEventListener('resize', updateStep);
    return () => window.removeEventListener('resize', updateStep);
  }, []);

  // Total steps: we slide through all items
  const maxSteps = Math.max(0, UPCOMING_CONCERTS.length - 1);

  // Auto-slide to the left every 3.5s
  useEffect(() => {
    if (isPaused || maxSteps === 0) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev >= maxSteps ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, maxSteps]);

  const scrollLeft = () => {
    setSlideIndex((prev) => (prev <= 0 ? maxSteps : prev - 1));
  };

  const scrollRight = () => {
    setSlideIndex((prev) => (prev >= maxSteps ? 0 : prev + 1));
  };

  return (
    <section id="upcoming-events" className="w-full px-4 lg:px-12 py-12 bg-[#0c0e16]/60 border-y border-[#33343d]/30">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[20px]">alarm_on</span>
              <span className="text-xs uppercase tracking-widest font-bold">Lên lịch gấp</span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#e1e1ed] tracking-tight">
              Sắp diễn ra trong 7 ngày tới
            </h2>
            <p className="text-xs text-[#aa8984]">
              Những đêm nhạc cận kề giờ G. Hệ thống tự động lướt hoặc bấm nút điều hướng để xem các sự kiện tiếp theo.
            </p>
          </div>

          {/* Navigation Controls & Slide Indicator */}
          <div className="flex items-center gap-3">
            {/* Dot indicators */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {UPCOMING_CONCERTS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    slideIndex === idx ? 'w-6 bg-[#ff5945]' : 'w-1.5 bg-[#33343d] hover:bg-[#aa8984]'
                  }`}
                  aria-label={`Chuyển đến sự kiện ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={scrollLeft}
              className="w-10 h-10 rounded-xl bg-[#1d1f28] hover:bg-[#ff5945] hover:text-white text-[#e1e1ed] flex items-center justify-center transition-all shadow-md active:scale-95 border border-[#33343d]/50"
              aria-label="Cuộn sang trái"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="w-10 h-10 rounded-xl bg-[#1d1f28] hover:bg-[#ff5945] hover:text-white text-[#e1e1ed] flex items-center justify-center transition-all shadow-md active:scale-95 border border-[#33343d]/50"
              aria-label="Cuộn sang phải"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Track - Auto-sliding to the left */}
        <div
          className="overflow-hidden w-full relative py-3"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex items-stretch gap-6 transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${slideIndex * cardStep}px)`,
            }}
          >
            {UPCOMING_CONCERTS.map((item, idx) => (
              <div
                key={item.id}
                ref={idx === 0 ? cardRef : undefined}
                className="w-[88vw] sm:w-[460px] lg:w-[520px] shrink-0 flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-[#191b23] border border-[#33343d]/40 shadow-xl group hover:shadow-[0_0_32px_rgba(255,89,69,0.3)] hover:border-[#ff5945]/50 transition-all duration-300"
              >
                {/* Event Image */}
                <div className="relative w-full sm:w-56 h-48 sm:h-auto shrink-0 overflow-hidden bg-[#1d1f28]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#191b23] via-transparent to-transparent sm:hidden" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#93000a]/90 text-[#ffdad6] text-[11px] font-bold uppercase tracking-wide backdrop-blur-md shadow-md">
                    {item.badgeText}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#ff5945] font-bold uppercase tracking-wide">{item.dateText}</span>
                      <span className="text-[#4cd7f6] font-semibold text-[11px] font-mono">{item.relativeTime}</span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#e1e1ed] group-hover:text-[#ffb4a8] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#aa8984] flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-[16px] text-[#aa8984] shrink-0">location_on</span>
                      <span className="truncate">{item.venueText}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#33343d]/40">
                    <div>
                      <span className="text-[11px] text-[#aa8984] block">Giá vé từ</span>
                      <span className="font-display font-extrabold text-lg text-[#e1e1ed]">{item.priceText}</span>
                    </div>
                    <Link
                      to={`/storefront/event/${item.eventId}`}
                      className="px-4 py-2 rounded-xl bg-[#ff5945] hover:bg-[#ff7252] text-white text-xs font-bold transition-all shadow-md shadow-[#ff5945]/20 hover:shadow-[#ff5945]/40 active:scale-95 flex items-center gap-1"
                    >
                      <span>Xem chỗ ngồi</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
