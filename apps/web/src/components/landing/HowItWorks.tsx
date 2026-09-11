import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'DISCOVER',
    desc: 'Find curated concerts, music festivals, and live events worth experiencing.',
  },
  {
    num: '02',
    title: 'CHOOSE',
    desc: 'Pick your exact seat, section, and verified digital ticket pass with full price transparency.',
  },
  {
    num: '03',
    title: 'SECURE',
    desc: 'Complete your purchase safely through our encrypted escrow checkout system.',
  },
  {
    num: '04',
    title: 'EXPERIENCE',
    desc: 'Present your verified mobile ticket pass at the venue door and live the moment.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="process" className="relative bg-[#05070A] py-24 md:py-36 border-t border-white/5 overflow-hidden">
      {/* Background Concert Texture to prevent plain black empty space */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/landing/howitworks.jpg"
          alt="Concert Crowd Backlight"
          className="w-full h-full object-cover filter brightness-[0.25] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A] via-[#05070A]/80 to-[#05070A]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20 space-y-3"
        >
          <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase block">
            08 / Process
          </span>
          <h2 className="font-display text-4xl sm:text-6xl font-extrabold text-[#F5F5F2] uppercase tracking-tight">
            How It Works.
          </h2>
        </motion.div>

        {/* Clean Editorial Timeline with Fixed Left Line (No Text Overlap) */}
        <div className="relative pl-10 sm:pl-16 md:pl-24">
          {/* Vertical Connecting Line */}
          <div className="absolute left-3 sm:left-6 md:left-8 top-3 bottom-3 w-[2px] bg-white/10">
            <motion.div
              initial={{ height: '0%' }}
              whileInView={{ height: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
              className="w-full bg-[#FF5A36] shadow-[0_0_15px_#FF5A36]"
            />
          </div>

          <div className="space-y-16">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 sm:gap-8 group"
              >
                {/* Timeline Dot on the Line */}
                <div className="absolute -left-[35px] sm:-left-[47px] md:-left-[71px] top-1.5 w-5 h-5 rounded-full bg-[#05070A] border-2 border-[#FF5A36] flex items-center justify-center z-10 shadow-[0_0_10px_#FF5A36]">
                  <div className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                </div>

                {/* Step Number & Title */}
                <div className="flex items-baseline gap-4 sm:w-1/2 shrink-0">
                  <span className="font-display text-4xl sm:text-5xl font-extrabold text-[#FF5A36] tracking-tight">
                    {step.num}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F5F2] uppercase tracking-tight group-hover:text-[#FF5A36] transition-colors">
                    {step.title}
                  </h3>
                </div>

                {/* Step Description */}
                <div className="sm:w-1/2">
                  <p className="text-[#A3A8B3] text-base leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
