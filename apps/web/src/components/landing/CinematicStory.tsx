import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const CinematicStory: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity1 = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const opacity2 = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);
  const opacity3 = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);
  const opacity4 = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);

  const y1 = useTransform(scrollYProgress, [0.1, 0.3], [40, 0]);
  const y2 = useTransform(scrollYProgress, [0.3, 0.5], [40, 0]);
  const y3 = useTransform(scrollYProgress, [0.5, 0.7], [40, 0]);
  const y4 = useTransform(scrollYProgress, [0.7, 0.9], [40, 0]);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[140vh] bg-[#0A0D12] overflow-hidden flex items-center justify-center py-32"
    >
      {/* Full-Width Background Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/landing/artist-2.jpg"
          alt="Artist Spotlight Performance"
          className="w-full h-full object-cover filter brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A] via-transparent to-[#05070A]" />
        <div className="absolute inset-0 bg-[#05070A]/50" />
      </div>

      {/* Story Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-4">
          <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.4em] font-display uppercase block">
            04 / The Philosophy
          </span>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
            Not Just A Ticket.
          </h2>
        </div>

        <div className="space-y-8 font-display text-3xl sm:text-5xl md:text-6xl font-bold uppercase tracking-tight">
          <motion.div style={{ opacity: opacity1, y: y1 }} className="text-[#A3A8B3]">
            A Seat.
          </motion.div>

          <motion.div style={{ opacity: opacity2, y: y2 }} className="text-[#F5F5F2]">
            A Moment.
          </motion.div>

          <motion.div style={{ opacity: opacity3, y: y3 }} className="text-[#A3A8B3]">
            A Memory.
          </motion.div>

          <motion.div style={{ opacity: opacity4, y: y4 }} className="text-[#FF5A36]">
            An Experience.
          </motion.div>
        </div>
      </div>
    </section>
  );
};
