import React from 'react';
import { Ticket, QrCode, Calendar, MapPin, ShieldCheck, Download, Share2 } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

export const MyTicketsPage: React.FC = () => {
  const { showToast } = useUIStore();

  const handleShowQR = (title: string) => {
    showToast(`Displaying verified QR code for "${title}"`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold font-display text-white uppercase tracking-tight">
            My Purchased Passes
          </h1>
          <p className="text-sm text-[#A3A8B3]">Your verified digital passes with dynamic entry QR authentication.</p>
        </div>

        {/* Ticket Passes Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              title: 'Anh Trai Vượt Ngàn Chông Gai Concert',
              date: 'Dec 20, 2026 • 19:00',
              venue: 'Sân Vận Động Mỹ Đình, Hà Nội',
              zone: 'VIP Khái Hưng - Row 03 - Seat 12',
              code: 'TS-99201-PASS',
            },
            {
              title: 'Coldplay Music of the Spheres Tour',
              date: 'Jan 15, 2027 • 20:00',
              venue: 'Sân Vận Động Quốc Gia Singapore',
              zone: 'Cat 1 Standing General',
              code: 'TS-77182-PASS',
            },
          ].map((ticket, idx) => (
            <div key={idx} className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-[#FF5A36] font-bold">DIGITAL PASS</span>
                <span className="text-xs font-mono text-[#A3A8B3]">{ticket.code}</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold font-display text-white">{ticket.title}</h3>
                <div className="space-y-1 text-xs text-[#A3A8B3] font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FF5A36]" />
                    <span>{ticket.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{ticket.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-semibold">{ticket.zone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => handleShowQR(ticket.title)}
                  className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show Entry QR Code</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MyTicketsPage;
