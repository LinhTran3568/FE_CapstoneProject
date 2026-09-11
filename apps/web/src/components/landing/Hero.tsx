import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16;
      const y = (e.clientY / innerHeight - 0.5) * 16;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[#05070A] flex flex-col justify-between">
      {/* 100vh Full Screen Concert Photo Background */}
      <div
        className="absolute inset-0 transition-transform duration-1000 ease-out scale-105"
        style={{
          transform: `scale(1.05) translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
        }}
      >
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Dramatic Live Concert Crowd & Spotlight"
          className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-125"
        />
      </div>

      {/* Dark Vignette & Gradient Overlays for High Contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05070A] via-[#05070A]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-[#05070A]/40" />

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 flex-1 flex flex-col justify-center pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-4xl space-y-8"
        >
          {/* Subheader Badge */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-[2px] bg-[#FF5A36]" />
            <span className="text-[#FF5A36] text-xs md:text-sm font-semibold tracking-[0.3em] uppercase font-display">
              Live Concert Platform
            </span>
          </div>

          {/* Graphic Headline */}
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-[#F5F5F2] uppercase leading-[0.9] tracking-tighter">
            The Moment <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F2] via-[#F5F5F2] to-[#A3A8B3]">
              You've Been
            </span> <br />
            Waiting For.
          </h1>

          {/* Subtitle */}
          <p className="text-[#A3A8B3] text-lg sm:text-xl font-normal max-w-xl leading-relaxed">
            Discover verified concerts, festivals, and unforgettable live experiences. Guaranteed entry, zero scalping.
          </p>

          {/* CTA */}
          <div className="pt-2">
            <a
              href="#featured"
              className="inline-flex items-center gap-4 px-10 py-5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-medium text-sm tracking-widest uppercase rounded-full transition-all duration-300 shadow-2xl shadow-[#FF5A36]/30 hover:shadow-[#FF5A36]/50 hover:scale-105"
            >
              <span>Explore Events</span>
              <span className="text-xl">↓</span>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Hero Bottom Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pb-8 flex items-center justify-between border-t border-white/10 pt-4">
        <a
          href="#featured"
          className="text-xs uppercase tracking-[0.25em] text-[#A3A8B3] hover:text-[#FF5A36] transition-colors flex items-center gap-2"
        >
          <span>Scroll to Discover</span>
        </a>

        <div className="flex items-center gap-3 bg-[#0A0D12]/80 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] animate-pulse" />
          <span className="text-xs font-semibold text-[#F5F5F2] font-display uppercase tracking-wider">
            LIVE MUSIC · 20.12.26
          </span>
        </div>
      </div>
    </section>
  );
};
