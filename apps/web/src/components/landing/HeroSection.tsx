import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Floating, { FloatingElement } from '../fancy/parallax-floating';

// Top 8 hot concerts / event posters
const EVENT_POSTERS = [
  {
    id: 'ev-1',
    name: 'Anh Trai Say Hi',
    slug: 'anh-trai-say-hi-2026',
    url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-2',
    name: 'Born Pink Finale',
    slug: 'born-pink-finale',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-3',
    name: 'The Eras Experience',
    slug: 'the-eras-experience',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-4',
    name: 'Bảo Tàng Của Nuối Tiếc - Vũ.',
    slug: 'vu-bao-tang-nuoi-tiec',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-5',
    name: 'Monsoon Music Festival',
    slug: 'monsoon-festival-2026',
    url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-6',
    name: 'Những Thành Phố Mơ Màng',
    slug: 'nhung-thanh-pho-mo-mang',
    url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-7',
    name: 'Chân Trời Rực Rỡ - Hà Anh Tuấn',
    slug: 'ha-anh-tuan-chan-troi-ruc-ro',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'ev-8',
    name: 'Vietnam Electronic Weekend',
    slug: 'vew-2026',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80',
  },
];

export const HeroSection: React.FC = () => {
  return (
    <section className="relative z-10 w-full min-h-[92vh] md:min-h-screen flex justify-center items-center bg-transparent overflow-visible select-none" id="hero">
      {/* Center Typography - Positioned at z-20 below fixed navbar (z-[100]) */}
      <div className="z-20 relative text-center space-y-4 items-center flex flex-col px-4 max-w-xl mx-auto pointer-events-auto">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          TicketShield<span className="hero-title-dot">.</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          Verified Event Ticket Resale Marketplace — 100% Escrow &amp; Price Ceiling Protected
        </motion.p>

        <motion.div
          className="flex items-center gap-3 pt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/marketplace"
            className="btn-primary"
          >
            Explore Marketplace
          </Link>
          <Link
            to="/marketplace"
            className="btn-secondary"
          >
            View Schedule
          </Link>
        </motion.div>

      </div>

      {/* Floating Posters — Crisp sharp geometry, lower z-indices to never overlap navbar */}
      <Floating sensitivity={-1} className="overflow-visible">
        {/* 1. Top Left Corner — Depth 0.5 (Background) */}
        <FloatingElement depth={0.5} className="top-[8%] left-[10%] z-[2]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[0].slug}`}
              title={EVENT_POSTERS[0].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/20 bg-zinc-950 shadow-[0_12px_28px_rgba(0,0,0,0.7)] hover:border-orange-500/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.85),0_0_25px_rgba(251,146,60,0.25)] transition-all duration-300 ease-out w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 aspect-square"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[0].url}
                alt={EVENT_POSTERS[0].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 2. Top Mid-Left — Depth 1.0 (Midground) */}
        <FloatingElement depth={1.0} className="top-[12%] left-[28%] z-[3]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[1].slug}`}
              title={EVENT_POSTERS[1].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/20 bg-zinc-950 shadow-[0_12px_28px_rgba(0,0,0,0.7)] hover:border-orange-500/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.85),0_0_25px_rgba(251,146,60,0.25)] transition-all duration-300 ease-out w-16 h-16 sm:w-22 sm:h-22 md:w-28 md:h-28 aspect-square"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[1].url}
                alt={EVENT_POSTERS[1].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 3. Top Center-Right (Portrait) — Depth 2.0 (Upper Foreground) */}
        <FloatingElement depth={2.0} className="top-[4%] left-[54%] z-[5]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[2].slug}`}
              title={EVENT_POSTERS[2].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/25 bg-zinc-950 shadow-[0_14px_32px_rgba(0,0,0,0.75)] hover:border-orange-500/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(251,146,60,0.3)] transition-all duration-300 ease-out w-18 h-24 sm:w-24 sm:h-32 md:w-32 md:h-44 aspect-[3/4]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[2].url}
                alt={EVENT_POSTERS[2].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 4. Top Right Corner — Depth 1.0 (Midground) */}
        <FloatingElement depth={1.0} className="top-[4%] left-[80%] z-[3]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[3].slug}`}
              title={EVENT_POSTERS[3].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/20 bg-zinc-950 shadow-[0_12px_28px_rgba(0,0,0,0.7)] hover:border-orange-500/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.85),0_0_25px_rgba(251,146,60,0.25)] transition-all duration-300 ease-out w-16 h-16 sm:w-20 sm:h-20 md:w-26 md:h-26 aspect-square"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[3].url}
                alt={EVENT_POSTERS[3].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 5. Mid Left Flank — Depth 1.0 (Midground) */}
        <FloatingElement depth={1.0} className="top-[38%] left-[3%] z-[3]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[4].slug}`}
              title={EVENT_POSTERS[4].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/20 bg-zinc-950 shadow-[0_12px_28px_rgba(0,0,0,0.7)] hover:border-orange-500/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.85),0_0_25px_rgba(251,146,60,0.25)] transition-all duration-300 ease-out w-16 h-16 sm:w-22 sm:h-22 md:w-30 md:h-30 aspect-square"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[4].url}
                alt={EVENT_POSTERS[4].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 6. Bottom Right (Portrait) — Depth 2.0 (Mid-Foreground) */}
        <FloatingElement depth={2.0} className="top-[64%] left-[76%] z-[5]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[7].slug}`}
              title={EVENT_POSTERS[7].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/25 bg-zinc-950 shadow-[0_14px_32px_rgba(0,0,0,0.75)] hover:border-orange-500/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(251,146,60,0.3)] transition-all duration-300 ease-out w-18 h-24 sm:w-24 sm:h-32 md:w-32 md:h-44 aspect-[3/4]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[7].url}
                alt={EVENT_POSTERS[7].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 7. Bottom Left (Portrait Showcase) — Depth 3.5 (Primary Foreground Showcase) */}
        <FloatingElement depth={3.5} className="top-[62%] left-[13%] z-[8]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[5].slug}`}
              title={EVENT_POSTERS[5].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/30 bg-zinc-950 shadow-[0_18px_40px_rgba(0,0,0,0.8)] hover:border-orange-500/70 hover:shadow-[0_24px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(251,146,60,0.35)] transition-all duration-300 ease-out w-22 h-30 sm:w-30 sm:h-40 md:w-40 md:h-54 aspect-[3/4]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[5].url}
                alt={EVENT_POSTERS[5].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>

        {/* 8. Bottom Center — Depth 1.0 (Midground Anchor) */}
        <FloatingElement depth={1.0} className="top-[72%] left-[48%] z-[3]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to={`/marketplace?event=${EVENT_POSTERS[6].slug}`}
              title={EVENT_POSTERS[6].name}
              className="group relative block overflow-hidden rounded-none cursor-pointer border border-white/20 bg-zinc-950 shadow-[0_12px_28px_rgba(0,0,0,0.7)] hover:border-orange-500/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.85),0_0_25px_rgba(251,146,60,0.25)] transition-all duration-300 ease-out w-16 h-16 sm:w-22 sm:h-22 md:w-28 md:h-28 aspect-square"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 z-10 pointer-events-none group-hover:opacity-60 transition-opacity duration-300" />
              <img
                src={EVENT_POSTERS[6].url}
                alt={EVENT_POSTERS[6].name}
                className="w-full h-full object-cover rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </Link>
          </motion.div>
        </FloatingElement>
      </Floating>
    </section>
  );
};

export default HeroSection;
