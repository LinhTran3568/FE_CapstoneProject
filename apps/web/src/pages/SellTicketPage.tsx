import React, { useState } from 'react';
import { PlusCircle, ShieldCheck, Ticket, ArrowUpRight, Sparkles, CheckCircle2, FileUp } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useNavigate } from 'react-router-dom';

export const SellTicketPage: React.FC = () => {
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const [eventTitle, setEventTitle] = useState('');
  const [seatZone, setSeatZone] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [resalePrice, setResalePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !resalePrice) {
      showToast('Please fill out all required ticket fields.', 'warning');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast(`Resale listing created for "${eventTitle}"!`, 'success');
      navigate('/my-listings');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#FF5A36]" />
            <span className="text-[#FF5A36] text-xs font-bold uppercase tracking-widest font-display flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Seller Portal Action
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white uppercase tracking-tight">
            Sell Ticket (Create Resale)
          </h1>
          <p className="text-sm text-[#A3A8B3] leading-relaxed">
            List your verified event passes on TicketShield. All listings are authenticated with zero fraud escrow protection.
          </p>
        </div>

        {/* Resale Form Container */}
        <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-10 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-1 border-b border-white/10 pb-6">
            <h3 className="text-xl font-bold font-display text-white">Ticket & Pricing Details</h3>
            <p className="text-xs text-[#A3A8B3]">Enter exact seat location and pricing information for buyer verification.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            <div>
              <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Event Title *</label>
              <input
                type="text"
                placeholder="e.g. Anh Trai Vượt Ngàn Chông Gai Concert 2026"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                required
              />
            </div>

            <div>
              <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Zone / Seat Information</label>
              <input
                type="text"
                placeholder="e.g. VIP Khái Hưng - Row 03 - Seat 12"
                value={seatZone}
                onChange={(e) => setSeatZone(e.target.value)}
                className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Original Face Value (VND)</label>
                <input
                  type="number"
                  placeholder="1500000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                />
              </div>
              <div>
                <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Resale Listing Price (VND) *</label>
                <input
                  type="number"
                  placeholder="1800000"
                  value={resalePrice}
                  onChange={(e) => setResalePrice(e.target.value)}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                  required
                />
              </div>
            </div>

            {/* Ticket File Upload Placeholder */}
            <div>
              <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-2 font-display">Digital Ticket Pass Upload / QR Verification</label>
              <div className="border-2 border-dashed border-white/15 hover:border-[#FF5A36]/50 bg-[#05070A] rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-2">
                <FileUp className="w-8 h-8 text-[#FF5A36] mx-auto" />
                <p className="text-xs text-white font-semibold">Click or drag PDF / Image ticket pass here</p>
                <p className="text-[10px] text-[#A3A8B3]">Supports PDF, PKPASS, PNG, JPG (Max 10MB)</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                **Escrow Protection Guarantee**: Funds are securely held in TicketShield Escrow and released directly into your bank account after event entry verification.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Publishing Listing...' : 'Publish Ticket Listing Now'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SellTicketPage;
