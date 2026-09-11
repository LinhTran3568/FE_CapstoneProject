import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const FinalCTA: React.FC = () => {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] overflow-hidden bg-[#05070A] flex items-center justify-center">
      {/* Background Massive Full Screen Concert Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/landing/final-cta.jpg"
          alt="Massive Concert Crowd & Stage Glow"
          className="w-full h-full object-cover filter brightness-[0.55] contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-[#05070A]/80" />
      </div>

      {/* Overlaid Typography & CTA */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8"
      >
        <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase block">
          09 / Join The Movement
        </span>

        <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-[#F5F5F2] uppercase leading-[0.9] tracking-tighter">
          Ready For <br />
          Your Next <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] to-[#FF8C42]">
            Experience?
          </span>
        </h2>

        <p className="text-[#A3A8B3] text-lg max-w-xl mx-auto font-normal">
          Join thousands of music and event enthusiasts buying and selling verified live event tickets safely.
        </p>

        <div className="pt-4">
          <Link
            to="/events"
            className="inline-flex items-center gap-4 px-12 py-5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-medium text-sm tracking-widest uppercase rounded-full transition-all duration-300 shadow-2xl shadow-[#FF5A36]/40 hover:scale-105"
          >
            <span>Explore Events</span>
            <span className="text-xl">→</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};
