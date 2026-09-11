import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const EventCategories: React.FC = () => {
  return (
    <section id="events" className="bg-[#05070A] py-24 md:py-36 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase block mb-2">
              05 / Spectrum
            </span>
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
              More Than Music.
            </h2>
          </div>
          <p className="text-[#A3A8B3] text-base max-w-md">
            From stadium championships to film premieres and theater stages, access every major live event genre.
          </p>
        </motion.div>

        {/* Magazine Composition (NOT Equal Cards) */}
        <div className="grid grid-cols-12 gap-8">
          {/* MUSIC: Huge Photo (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="col-span-12 lg:col-span-7 group relative rounded-3xl overflow-hidden shadow-2xl h-[420px] lg:h-[480px] border border-white/10"
          >
            <img
              src="/images/landing/artist-1.jpg"
              alt="Music Concerts & Live Shows"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <h3 className="font-display text-4xl font-extrabold text-[#F5F5F2] uppercase tracking-tight mb-1">
                  MUSIC
                </h3>
                <p className="text-xs text-[#A3A8B3] font-medium tracking-wide">
                  Concerts · Music Festivals · Stadium World Tours
                </p>
              </div>
              <Link
                to="/events?category=music"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#F5F5F2] group-hover:bg-[#FF5A36] group-hover:border-[#FF5A36] transition-all duration-300"
              >
                <span className="text-lg">→</span>
              </Link>
            </div>
          </motion.div>

          {/* CINEMA: Medium Photo (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="col-span-12 lg:col-span-5 group relative rounded-3xl overflow-hidden shadow-2xl h-[420px] lg:h-[480px] border border-white/10"
          >
            <img
              src="/images/landing/cinema.jpg"
              alt="Film Premieres & Cinema"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <h3 className="font-display text-4xl font-extrabold text-[#F5F5F2] uppercase tracking-tight mb-1">
                  CINEMA
                </h3>
                <p className="text-xs text-[#A3A8B3] font-medium tracking-wide">
                  Movie Premieres · Red Carpet · IMAX Screenings
                </p>
              </div>
              <Link
                to="/events?category=cinema"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#F5F5F2] group-hover:bg-[#FF5A36] group-hover:border-[#FF5A36] transition-all duration-300"
              >
                <span className="text-lg">→</span>
              </Link>
            </div>
          </motion.div>

          {/* SPORTS: Medium Photo (5 Cols) - Fixed 609 KB image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="col-span-12 lg:col-span-5 group relative rounded-3xl overflow-hidden shadow-2xl h-[380px] border border-white/10"
          >
            <img
              src="/images/landing/sports.jpg"
              alt="Stadium Sports & Esports"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <h3 className="font-display text-4xl font-extrabold text-[#F5F5F2] uppercase tracking-tight mb-1">
                  SPORTS
                </h3>
                <p className="text-xs text-[#A3A8B3] font-medium tracking-wide">
                  Championships · Football Matches · Esports Arenas
                </p>
              </div>
              <Link
                to="/events?category=sports"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#F5F5F2] group-hover:bg-[#FF5A36] group-hover:border-[#FF5A36] transition-all duration-300"
              >
                <span className="text-lg">→</span>
              </Link>
            </div>
          </motion.div>

          {/* CULTURE: Wide Photo (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="col-span-12 lg:col-span-7 group relative rounded-3xl overflow-hidden shadow-2xl h-[380px] border border-white/10"
          >
            <img
              src="/images/landing/theater.jpg"
              alt="Theater & Opera Performances"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/30 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
              <div>
                <h3 className="font-display text-4xl font-extrabold text-[#F5F5F2] uppercase tracking-tight mb-1">
                  CULTURE
                </h3>
                <p className="text-xs text-[#A3A8B3] font-medium tracking-wide">
                  Theater Shows · Opera Performances · Art Exhibitions
                </p>
              </div>
              <Link
                to="/events?category=culture"
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#F5F5F2] group-hover:bg-[#FF5A36] group-hover:border-[#FF5A36] transition-all duration-300"
              >
                <span className="text-lg">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
