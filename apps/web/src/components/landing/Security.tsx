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
              TicketShield completely eliminates scalping, fake tickets, and fraud with Real Fan Verification, Official Direct Re-issuance, and 24-Hour Funds Protection.
            </p>

            {/* Minimalist Editorial Status List (No Cards) */}
            <div className="space-y-6 pt-4 border-t border-white/10 font-display">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xl md:text-2xl font-extrabold text-[#F5F5F2] uppercase tracking-wider">
                  REAL FANS - REAL TICKETS
                </span>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  OFFICIALLY VERIFIED
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xl md:text-2xl font-extrabold text-[#F5F5F2] uppercase tracking-wider">
                  24-HOUR FUNDS PROTECTION
                </span>
                <span className="text-xs font-mono text-[#FF5A36] uppercase tracking-widest bg-[#FF5A36]/10 px-3 py-1 rounded-full border border-[#FF5A36]/20">
                  PROTECTION ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xl md:text-2xl font-extrabold text-[#F5F5F2] uppercase tracking-wider">
                  READY FOR VENUE ENTRY
                </span>
                <span className="text-xs font-mono text-[#F5F5F2] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                  OFFICIAL BARCODE
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
                    OFFICIAL VERIFICATION SYSTEM
                  </span>
                  <span className="text-xs text-emerald-400 font-mono tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    PROTECTION ACTIVE
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-[#A3A8B3] uppercase tracking-widest block font-display">
                    Protected Event
                  </span>
                  <div className="text-3xl font-extrabold font-display text-[#F5F5F2] uppercase">
                    COLDPLAY WORLD TOUR 2026
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#0A0D12] p-5 rounded-2xl border border-white/10 text-xs">
                  <div>
                    <span className="text-[#A3A8B3] block mb-1 font-display uppercase tracking-wider">ORGANIZER VERIFICATION</span>
                    <span className="font-mono text-[#F5F5F2] text-xs truncate block">
                      TS-OFFICIAL-2026-BTC
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A3A8B3] block mb-1 font-display uppercase tracking-wider">FAN VERIFICATION</span>
                    <span className="text-emerald-400 font-semibold block">100% REAL FAN</span>
                  </div>
                </div>

                {/* Scan Status Display */}
                <div className="bg-[#FF5A36]/10 border border-[#FF5A36]/30 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FF5A36] animate-ping" />
                    <span className="text-sm font-bold text-[#F5F5F2] font-display uppercase tracking-wider">
                      Official New Ticket Issued & Verified
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
