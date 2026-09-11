import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const genres = ['CONCERTS', 'FESTIVALS', 'ELECTRONIC', 'POP', 'ROCK'];

export const MusicDiscovery: React.FC = () => {
  const [activeGenre, setActiveGenre] = useState('CONCERTS');

  return (
    <section id="discover" className="bg-[#0A0D12] py-24 md:py-36 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
        >
          <div>
            <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase block mb-2">
              02 / Curation
            </span>
            <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
              Discover The Sound.
            </h2>
          </div>
          <p className="text-[#A3A8B3] text-base max-w-sm">
            Curated live musical performances. Pure sound, unfiltered crowd energy, guaranteed entry.
          </p>
        </motion.div>

        {/* Editorial Sub-Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center gap-8 border-b border-white/10 pb-6 mb-16"
        >
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`text-base font-display tracking-widest transition-all duration-300 uppercase relative pb-2 ${
                activeGenre === genre
                  ? 'text-[#FF5A36] font-bold'
                  : 'text-[#A3A8B3] hover:text-[#F5F5F2]'
              }`}
            >
              {genre}
              {activeGenre === genre && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF5A36]" />
              )}
            </button>
          ))}
        </motion.div>

        {/* Magazine Editorial Asymmetric Layout (NO Equal Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Huge Image (Left 8 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="md:col-span-8 group relative rounded-3xl overflow-hidden shadow-2xl h-[520px] md:h-[620px] flex flex-col justify-end p-10 border border-white/10"
          >
            <img
              src="/images/landing/featured-2.jpg"
              alt="Ultra Music Festival 2026"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.75]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/30 to-transparent" />

            <div className="relative z-10 space-y-4">
              <span className="px-3 py-1 bg-[#FF5A36]/20 border border-[#FF5A36]/40 text-[#FF5A36] text-xs font-semibold uppercase tracking-widest rounded-full font-display">
                Headliner Event
              </span>
              <h3 className="font-display text-4xl sm:text-5xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
                Ultra Music Festival 2026
              </h3>
              <p className="text-[#A3A8B3] text-sm tracking-wide uppercase font-display">
                25-27 SEP 2026 · SAIGON EXHIBITION & CONVENTION CENTER
              </p>
              <div className="pt-2">
                <Link
                  to="/events/ultra-2026"
                  className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#F5F5F2] hover:text-[#FF5A36] uppercase transition-colors"
                >
                  <span>Explore Lineup & Passes</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Staggered Vertical Column (Right 4 Cols) */}
          <div className="md:col-span-4 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="group relative rounded-3xl overflow-hidden shadow-xl h-[290px] p-6 flex flex-col justify-end border border-white/10"
            >
              <img
                src="/images/landing/concert.jpg"
                alt="Rock Arena Concert"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.7]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent opacity-90" />
              <div className="relative z-10 space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#FF5A36] font-display font-semibold">
                  Rock Stadium
                </span>
                <h4 className="font-display text-2xl font-bold text-[#F5F5F2] uppercase">
                  Foo Fighters Live
                </h4>
                <p className="text-xs text-[#A3A8B3]">14 NOV 2026 · HANOI ARENA</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="group relative rounded-3xl overflow-hidden shadow-xl h-[290px] p-6 flex flex-col justify-end border border-white/10"
            >
              <img
                src="/images/landing/electronic.jpg"
                alt="Electronic DJ Stage"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.7]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent opacity-90" />
              <div className="relative z-10 space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#FF5A36] font-display font-semibold">
                  Electronic Beach
                </span>
                <h4 className="font-display text-2xl font-bold text-[#F5F5F2] uppercase">
                  Transmission Asia
                </h4>
                <p className="text-xs text-[#A3A8B3]">08 DEC 2026 · DA NANG BEACH</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
