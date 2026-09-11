import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, Ticket, Calendar, MapPin, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

export const MarketplacePage: React.FC = () => {
  const { showToast } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const demoListings = [
    {
      id: 'list-1',
      title: 'Anh Trai Vượt Ngàn Chông Gai Concert 2026',
      date: 'Dec 20, 2026',
      venue: 'Sân Vận Động Mỹ Đình, Hà Nội',
      category: 'CONCERT',
      zone: 'VIP Khái Hưng - Row 03',
      faceValue: 1500000,
      resalePrice: 1800000,
      sellerName: 'Nguyen Van Seller',
      sellerRating: 99.8,
      verified: true,
      image: '/images/landing/featured-1.jpg',
    },
    {
      id: 'list-2',
      title: 'Coldplay Music of the Spheres World Tour',
      date: 'Jan 15, 2027',
      venue: 'Sân Vận Động Quốc Gia Singapore',
      category: 'CONCERT',
      zone: 'Cat 1 Standing General',
      faceValue: 2800000,
      resalePrice: 3200000,
      sellerName: 'Alex Morgan',
      sellerRating: 100,
      verified: true,
      image: '/images/landing/hero-concert.jpg',
    },
    {
      id: 'list-3',
      title: 'Monsoon Music Festival 2026',
      date: 'Nov 05, 2026',
      venue: 'Hoàng Thành Thăng Long, Hà Nội',
      category: 'FESTIVAL',
      zone: '3-Day Full Experience Pass',
      faceValue: 1200000,
      resalePrice: 1350000,
      sellerName: 'Minh Tuấn Reseller',
      sellerRating: 98.5,
      verified: true,
      image: '/images/landing/featured-1.jpg',
    },
    {
      id: 'list-4',
      title: 'V-League Championship Final 2026',
      date: 'Oct 30, 2026',
      venue: 'Sân Vận Động Hàng Đẫy',
      category: 'SPORTS',
      zone: 'Khán Đài A - Cửa 2',
      faceValue: 400000,
      resalePrice: 550000,
      sellerName: 'Nguyen Van Seller',
      sellerRating: 99.8,
      verified: true,
      image: '/images/landing/hero-concert.jpg',
    },
  ];

  const filteredListings = demoListings.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBuy = (title: string) => {
    showToast(`Initiating Escrow purchase for "${title}"...`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#FF5A36]" />
            <span className="text-[#FF5A36] text-xs font-bold uppercase tracking-widest font-display">
              Escrow Verified Secondary Market
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight uppercase">
            Resale Marketplace
          </h1>
          <p className="text-sm text-[#A3A8B3] max-w-2xl leading-relaxed">
            Browse 100% verified resale tickets from trusted sellers. Every transaction is backed by TicketShield Escrow protection.
          </p>
        </div>

        {/* Filter & Search Controls */}
        <div className="bg-[#0A0D12] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#A3A8B3] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search event, venue or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#05070A] border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-display w-full md:w-auto">
            {['ALL', 'CONCERT', 'FESTIVAL', 'SPORTS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl border transition-all font-semibold ${
                  selectedCategory === cat
                    ? 'bg-[#FF5A36] border-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/30'
                    : 'bg-[#05070A] border-white/10 text-[#A3A8B3] hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-[#0A0D12] border border-white/10 rounded-3xl overflow-hidden hover:border-[#FF5A36]/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
            >
              {/* Image & Banner Badge */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-transparent to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold font-mono text-white rounded-full uppercase">
                    {listing.category}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-400 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED PASS
                  </span>
                </div>
              </div>

              {/* Listing Meta Content */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-display text-white line-clamp-1 group-hover:text-[#FF5A36] transition-colors">
                    {listing.title}
                  </h3>

                  <div className="space-y-1 text-xs text-[#A3A8B3] font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>{listing.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate">{listing.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-white font-semibold">{listing.zone}</span>
                    </div>
                  </div>
                </div>

                {/* Seller & Price Info */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#A3A8B3] uppercase tracking-wider font-display block">Resale Price</span>
                    <p className="text-xl font-bold font-display text-white">
                      {listing.resalePrice.toLocaleString('vi-VN')} <span className="text-xs font-normal text-[#A3A8B3]">VND</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuy(listing.title)}
                    className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all flex items-center gap-1.5"
                  >
                    <span>Buy Pass</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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

export default MarketplacePage;
