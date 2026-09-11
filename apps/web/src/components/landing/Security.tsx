import React from 'react';
import { motion } from 'framer-motion';

export const Security: React.FC = () => {
  return (
    <section id="security" className="bg-[#0A0D12] py-24 md:py-36 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column Editorial Text & Clean Typography Checklist */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 space-y-10"
          >
            <div>
              <span className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] font-display uppercase block mb-3">
                07 / Security Protocol
              </span>
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#F5F5F2] uppercase tracking-tight leading-[0.95]">
                Your Ticket. <br />
                <span className="text-[#FF5A36]">Protected.</span>
              </h2>
            </div>

            <p className="text-[#A3A8B3] text-lg leading-relaxed">
              TicketShield eliminates scalping, fake tickets, and bot abuse with cryptographic verification and automated escrow settlement.
            </p>

            {/* Minimalist Editorial Status List (No Cards) */}
            <div className="space-y-6 pt-4 border-t border-white/10 font-display">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xl md:text-2xl font-extrabold text-[#F5F5F2] uppercase tracking-wider">
                  VERIFIED
                </span>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  PASSED (0.00ms)
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xl md:text-2xl font-extrabold text-[#F5F5F2] uppercase tracking-wider">
                  SECURE PAYMENT
                </span>
                <span className="text-xs font-mono text-[#FF5A36] uppercase tracking-widest bg-[#FF5A36]/10 px-3 py-1 rounded-full border border-[#FF5A36]/20">
                  ESCROW ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xl md:text-2xl font-extrabold text-[#F5F5F2] uppercase tracking-wider">
                  READY FOR ENTRY
                </span>
                <span className="text-xs font-mono text-[#F5F5F2] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  MOBILE BARCODE
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Large Ticket UI with Active Scanning Line */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 flex justify-center"
          >
            <div className="relative w-full max-w-xl bg-[#05070A] border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden">
              {/* Animated Scanner Laser Line */}
              <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent shadow-[0_0_20px_#FF5A36] animate-[scan_3s_ease-in-out_infinite]" />

              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-display font-bold text-[#FF5A36] uppercase tracking-widest">
                    SYSTEM CRYPTO SCANNER
                  </span>
                  <span className="text-xs text-emerald-400 font-mono tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    SCANNING ACTIVE
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-[#A3A8B3] uppercase tracking-widest block font-display">
                    Target Event Identification
                  </span>
                  <div className="text-3xl font-extrabold font-display text-[#F5F5F2] uppercase">
                    COLDPLAY WORLD TOUR 2026
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#0A0D12] p-5 rounded-2xl border border-white/10 text-xs">
                  <div>
                    <span className="text-[#A3A8B3] block mb-1">HASH VERIFICATION</span>
                    <span className="font-mono text-[#F5F5F2] text-xs truncate block">
                      0x8f9a2b7c4e1c9003
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A3A8B3] block mb-1">BOT DEFENSE ENGINE</span>
                    <span className="text-emerald-400 font-semibold block">PASSED (100% SECURE)</span>
                  </div>
                </div>

                {/* Scan Status Display */}
                <div className="bg-[#FF5A36]/10 border border-[#FF5A36]/30 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5A36] animate-ping" />
                    <span className="text-sm font-bold text-[#F5F5F2] font-display uppercase tracking-wider">
                      Pass Authenticated & Validated
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#FF5A36] font-display">100% GUARANTEED</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
