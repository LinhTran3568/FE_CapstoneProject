import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const FeaturedEvent: React.FC = () => {
  return (
    <section id="featured" className="relative bg-[#05070A] py-24 md:py-36 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase">
            01 /
          </span>
          <h2 className="text-xs font-semibold tracking-[0.3em] uppercase text-[#A3A8B3] font-display">
            Featured Tonight
          </h2>
        </motion.div>

        {/* Massive Full-Width Event Focal Showcase (No Cards) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full h-[65vh] min-h-[500px] rounded-3xl overflow-hidden shadow-2xl group border border-white/10"
        >
          {/* Concert Photo */}
          <img
            src="/images/landing/featured-1.jpg"
            alt="Coldplay World Tour Stage"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 filter brightness-[0.7]"
          />

          {/* Direct Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/80 via-transparent to-transparent" />

          {/* Directly Overlaid Typography & Info */}
          <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-between z-10">
            {/* Top Badge */}
            <div className="flex justify-between items-start">
              <span className="px-4 py-1.5 bg-[#FF5A36] text-white text-xs font-bold tracking-widest uppercase rounded-full">
                World Tour 2026
              </span>
              <span className="text-xs text-[#A3A8B3] uppercase tracking-widest font-mono hidden sm:inline-block">
                TICKETSHIELD EXCLUSIVE PASS
              </span>
            </div>

            {/* Bottom Giant Event Details */}
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#F5F5F2] uppercase leading-[0.95] tracking-tight">
                  Coldplay
                </h3>
                <p className="font-display text-xl sm:text-3xl text-[#FF5A36] font-bold uppercase tracking-tight">
                  Music Of The Spheres
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#F5F5F2] font-display font-medium border-l-2 border-[#FF5A36] pl-4">
                <div>
                  <span className="text-[10px] text-[#A3A8B3] uppercase tracking-widest block">Date</span>
                  <span>20 DEC 2026 · 20:00</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A3A8B3] uppercase tracking-widest block">Venue</span>
                  <span>MY DINH STADIUM, HANOI</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A3A8B3] uppercase tracking-widest block">Starting From</span>
                  <span className="text-[#FF5A36] font-bold">1.500.000 VND</span>
                </div>
              </div>

              <div>
                <Link
                  to="/events/coldplay-hanoi-2026"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-medium text-xs tracking-widest uppercase rounded-full transition-all duration-300 shadow-xl hover:scale-105"
                >
                  <span>Reserve Seats Now</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
