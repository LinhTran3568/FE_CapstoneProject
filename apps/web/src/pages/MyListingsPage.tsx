import React, { useState } from 'react';
import { Ticket, ShieldCheck, PlusCircle, CheckCircle2, TrendingUp, Wallet, Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';

export const MyListingsPage: React.FC = () => {
  const { showToast } = useUIStore();

  const [listings, setListings] = useState([
    { id: '1', title: 'Anh Trai Vượt Ngàn Chông Gai Concert 2026', zone: 'VIP Khái Hưng - Row 03', price: '1.800.000 VND', status: 'ACTIVE', views: 142 },
    { id: '2', title: 'Coldplay Music of the Spheres Tour', zone: 'Cat 1 Standing', price: '3.200.000 VND', status: 'ACTIVE', views: 289 },
    { id: '3', title: 'Lễ Hội Âm Nhạc Monsoon 2026', zone: 'Early Bird Pass', price: '950.000 VND', status: 'SOLD', views: 98 },
  ]);

  const handleRemove = (id: string, title: string) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed listing "${title}"`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold font-display text-white uppercase tracking-tight">
              My Resale Listings
            </h1>
            <p className="text-sm text-[#A3A8B3]">Manage all active ticket listings published under your seller account.</p>
          </div>
          <Link
            to="/sell-ticket"
            className="px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/30 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Sell New Ticket</span>
          </Link>
        </div>

        {/* Listings List */}
        <div className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          {listings.map((item) => (
            <div key={item.id} className="p-5 bg-[#05070A] border border-white/10 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#FF5A36]/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36]">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{item.title}</h4>
                  <p className="text-xs text-[#A3A8B3] font-mono">{item.zone} • {item.views} views</p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-left md:text-right">
                  <p className="font-bold text-white text-base font-display">{item.price}</p>
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
                    item.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-[#A3A8B3]'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemove(item.id, item.title)}
                    className="p-2 bg-white/5 border border-white/10 hover:border-red-500/40 text-[#A3A8B3] hover:text-red-400 rounded-xl transition-all"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MyListingsPage;
