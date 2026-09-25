import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const TicketExperience: React.FC = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section id="experiences" className="bg-[#05070A] py-24 md:py-36 relative border-t border-white/5 overflow-hidden">
      {/* Background Concert Backdrop (948 KB) to eliminate empty black space */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/landing/ticket-bg.jpg"
          alt="Concert Atmosphere Stage Backdrop"
          className="w-full h-full object-cover filter brightness-[0.2] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A] via-[#05070A]/85 to-[#05070A]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Editorial Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase block">
            06 / Pass Architecture
          </span>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#F5F5F2] uppercase tracking-tight leading-[0.95]">
            Your Experience. <br />
            <span className="text-[#FF5A36]">Your Ticket.</span>
          </h2>
          <p className="text-[#A3A8B3] text-base font-normal max-w-lg mx-auto">
            Directly reissued by official organizers. Instant digital transfer with zero risk of duplication or fake tickets.
          </p>
        </motion.div>

        {/* 2D Digital Ticket Centerpiece (Large & Impressive) */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex justify-center perspective-1000"
        >
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-2xl bg-[#0A0D12]/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative overflow-hidden group"
          >
            {/* Ambient Accent Blur */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#FF5A36]/15 rounded-full filter blur-3xl pointer-events-none" />

            {/* Ticket Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FF5A36] shadow-[0_0_10px_#FF5A36]" />
                <span className="font-display font-bold text-xl text-[#F5F5F2] tracking-tight">
                  TicketShield
                </span>
              </div>
              <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full font-mono">
                ✓ OFFICIAL ORGANIZER PASS
              </span>
            </div>

            {/* Event Info */}
            <div className="space-y-8 mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#FF5A36] font-display font-bold block mb-1">
                  OFFICIAL VIP ADMISSION
                </span>
                <h3 className="font-display text-4xl md:text-5xl font-extrabold text-[#F5F5F2] uppercase tracking-tight leading-none">
                  COLDPLAY
                </h3>
                <p className="text-lg font-bold text-[#A3A8B3] uppercase tracking-wide font-display mt-1">
                  MUSIC OF THE SPHERES WORLD TOUR
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/5">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#A3A8B3] block">
                    DATE & TIME
                  </span>
                  <span className="text-base md:text-lg font-bold text-[#F5F5F2] font-display">
                    20 DEC 2026 · 20:00
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#A3A8B3] block">
                    VENUE
                  </span>
                  <span className="text-base md:text-lg font-bold text-[#F5F5F2] font-display">
                    MY DINH STADIUM, HANOI
                  </span>
                </div>
              </div>

              {/* Seating Grid */}
              <div className="grid grid-cols-3 gap-4 bg-[#05070A] p-5 rounded-2xl border border-white/10 text-center">
                <div>
                  <span className="text-xs uppercase text-[#A3A8B3] block font-display">SECTION</span>
                  <span className="text-2xl font-extrabold text-[#FF5A36] font-display">A-01</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-[#A3A8B3] block font-display">ROW</span>
                  <span className="text-2xl font-extrabold text-[#F5F5F2] font-display">12</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-[#A3A8B3] block font-display">SEAT</span>
                  <span className="text-2xl font-extrabold text-[#F5F5F2] font-display">24</span>
                </div>
              </div>
            </div>

            {/* Ticket Footer / Barcode & QR Graphic */}
            <div className="pt-6 border-t border-dashed border-white/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-widest text-[#A3A8B3] uppercase block font-display">
                  OFFICIAL TICKET ID
                </span>
                <span className="text-sm font-mono text-[#F5F5F2] tracking-wider">
                  TS-2026-99482-VN
                </span>
              </div>

              {/* Minimal QR Graphic */}
              <div className="w-16 h-16 bg-white p-2 rounded-xl flex items-center justify-center shadow-2xl">
                <div className="w-full h-full border-2 border-black grid grid-cols-4 gap-0.5 p-0.5">
                  <div className="bg-black col-span-2 row-span-2" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-black col-span-2" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
