import React from 'react';
import { StorefrontEvent } from '../../data/storefrontCatalog';

interface StorefrontHeroProps {
  event: StorefrontEvent;
  onViewStageModal: () => void;
}

export const StorefrontHero: React.FC<StorefrontHeroProps> = ({
  event,
  onViewStageModal,
}) => {
  return (
    <section className="relative w-full overflow-hidden border-b border-white/[0.08] bg-[#0E1520]">
      {/* Background Image with Dark Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover object-center filter brightness-[0.35] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/60 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0B0F17]/50 to-[#0B0F17]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-4">
            {/* Organizer & Official Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider bg-[#E11D48] text-white">
                Vé Gốc Ban Tổ Chức
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#16202E] text-[#CBD5E1] border border-white/10">
                Đơn vị tổ chức: <strong className="text-white">{event.organizerName}</strong>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                Đang mở bán trực tiếp
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
              {event.subtitle}
            </p>

            {/* Meta Details: Date, Time, Venue */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#131B26]/80 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase text-[#94A3B8] mb-1">
                  Thời gian biểu diễn
                </div>
                <div className="font-bold text-white text-sm sm:text-base leading-snug">
                  {event.dateDisplay}
                </div>
                <div className="text-xs text-[#CBD5E1] mt-0.5 font-mono">
                  {event.timeDisplay}
                </div>
              </div>

              <div className="bg-[#131B26]/80 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:col-span-2">
                <div className="text-[11px] font-mono uppercase text-[#94A3B8] mb-1">
                  Địa điểm tổ chức
                </div>
                <div className="font-bold text-white text-sm sm:text-base leading-snug">
                  {event.venueName}
                </div>
                <div className="text-xs text-[#94A3B8] mt-0.5 truncate" title={event.venueAddress}>
                  {event.venueAddress}
                </div>
              </div>
            </div>
          </div>

          {/* Side Action: Stage Map & Gate Info */}
          <div className="lg:col-span-4 flex flex-col justify-end gap-3">
            <div className="bg-[#131B26]/90 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Giờ mở cửa soát vé:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {event.gateOpenTime}
                </span>
              </div>
              <div className="h-px bg-white/10" />
              <button
                type="button"
                onClick={onViewStageModal}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1A2433] hover:bg-[#233145] text-white text-xs font-semibold border border-white/15 transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#E11D48]"
              >
                <svg className="w-4 h-4 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Xem sơ đồ sân khấu & khán đài</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
