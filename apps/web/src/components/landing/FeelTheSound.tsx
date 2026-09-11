import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const FeelTheSound: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1, 1.08]);
  const textY = useTransform(scrollYProgress, [0.1, 0.6], [50, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[85vh] min-h-[600px] bg-[#05070A] overflow-hidden flex items-center justify-center border-t border-white/5"
    >
      {/* High Resolution Festival Stage Backdrop Photo (434 KB) */}
      <motion.div style={{ scale: imageScale }} className="absolute inset-0 z-0">
        <img
          src="/images/landing/festival.jpg"
          alt="Vibrant Festival Crowd & Laser Lights"
          className="w-full h-full object-cover filter brightness-[0.75] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-[#05070A]" />
        <div className="absolute inset-0 bg-[#05070A]/30" />
      </motion.div>

      {/* Graphic Overlay Typography */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-6"
      >
        <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.4em] font-display uppercase block drop-shadow-md">
          04 / Experience
        </span>

        <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-[#F5F5F2] uppercase leading-[0.9] tracking-tighter drop-shadow-2xl">
          Feel The Sound.
        </h2>

        <div className="font-display text-2xl sm:text-4xl md:text-5xl font-bold uppercase tracking-widest text-[#FF5A36] flex flex-wrap items-center justify-center gap-6 pt-4 drop-shadow-lg">
          <span>LIVE.</span>
          <span className="text-[#F5F5F2]">LOUD.</span>
          <span>TOGETHER.</span>
        </div>
      </motion.div>
    </section>
  );
};
