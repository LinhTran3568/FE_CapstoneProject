import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  ChevronDown,
  ChevronLeft,
  Check,
  X,
  Ticket
} from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { formatEventDateTime, formatVND } from '../utils/formatters';
import { TicketShieldTrustBadge } from '../components/ui/TicketShieldTrustBadge';

export const MarketplacePage: React.FC = () => {
  const { showToast } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter states
  const [selectedDate, setSelectedDate] = useState<'all' | 'upcoming' | 'this-month'>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | 'hanoi' | 'hcm'>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'vip' | 'general' | 'standard'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'date-asc'>('newest');

  // Active dropdown states
  const [activePopover, setActivePopover] = useState<'date' | 'location' | 'tier' | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const { data: paginatedData, isLoading, isError, error, refetch, isFetching } = useMarketplaceListings({
    keyword: searchTerm.trim() || undefined,
    page: currentPage,
    size: pageSize,
  });

  const listings = paginatedData?.items || [];

  // Handle outside clicks to close autocomplete, filter popovers & sort dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options definitions
  const dateOptions = [
    { id: 'all', label: 'All Dates' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'this-month', label: 'This Month' },
  ] as const;

  const locationOptions = [
    { id: 'all', label: 'Location' },
    { id: 'hanoi', label: 'Hanoi' },
    { id: 'hcm', label: 'Ho Chi Minh City' },
  ] as const;

  const tierOptions = [
    { id: 'all', label: 'Ticket Tier' },
    { id: 'vip', label: 'VIP' },
    { id: 'general', label: 'General Admission' },
    { id: 'standard', label: 'Standard' },
  ] as const;

  const sortOptions = [
    { id: 'newest', label: 'Newest' },
    { id: 'price-asc', label: 'Price: Low → High' },
    { id: 'date-asc', label: 'Event Date: Soonest' },
  ] as const;

  // Filter & sort listings based on user selections
  const filteredListings = useMemo(() => {
    const filtered = listings.filter((item) => {
      // Date filter
      if (selectedDate === 'upcoming') {
        const eventDate = new Date(item.eventStartAt).getTime();
        const now = Date.now();
        const sevenDaysAhead = now + 7 * 24 * 60 * 60 * 1000;
        if (eventDate < now || eventDate > sevenDaysAhead) return false;
      } else if (selectedDate === 'this-month') {
        const eventDate = new Date(item.eventStartAt);
        const currentDate = new Date();
        if (
          eventDate.getMonth() !== currentDate.getMonth() ||
          eventDate.getFullYear() !== currentDate.getFullYear()
        ) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation === 'hanoi') {
        const venue = (item.eventVenue || '').toLowerCase();
        if (!venue.includes('hà nội') && !venue.includes('ha noi') && !venue.includes('hanoi') && !venue.includes('mỹ đình') && !venue.includes('my dinh')) {
          return false;
        }
      } else if (selectedLocation === 'hcm') {
        const venue = (item.eventVenue || '').toLowerCase();
        if (!venue.includes('hcm') && !venue.includes('hồ chí minh') && !venue.includes('ho chi minh') && !venue.includes('vạn hạnh') && !venue.includes('van hanh')) {
          return false;
        }
      }

      // Tier filter
      if (selectedTier === 'vip') {
        if (!(item.tierName || '').toLowerCase().includes('vip')) return false;
      } else if (selectedTier === 'general') {
        const tier = (item.tierName || '').toLowerCase();
        if (!tier.includes('ga') && !tier.includes('general')) return false;
      } else if (selectedTier === 'standard') {
        const tier = (item.tierName || '').toLowerCase();
        if (!tier.includes('standard') && !tier.includes('thường')) return false;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return a.resalePrice - b.resalePrice;
      if (sortBy === 'date-asc') return new Date(a.eventStartAt).getTime() - new Date(b.eventStartAt).getTime();
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [listings, selectedDate, selectedLocation, selectedTier, sortBy]);

  // Autocomplete Suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const query = searchTerm.toLowerCase().trim();
    const matches: Array<{
      id: string;
      title: string;
      venue: string;
      tier: string;
      price: number;
    }> = [];

    listings.forEach((item) => {
      const matchTitle = item.eventName?.toLowerCase().includes(query);
      const matchVenue = item.eventVenue?.toLowerCase().includes(query);
      const matchTier = item.tierName?.toLowerCase().includes(query);

      if (matchTitle || matchVenue || matchTier) {
        if (!matches.some((m) => m.title === item.eventName && m.tier === item.tierName)) {
          matches.push({
            id: item.listingId,
            title: item.eventName,
            venue: item.eventVenue,
            tier: item.tierName,
            price: item.resalePrice,
          });
        }
      }
    });

    if (matches.length === 0 && 'anh trai say hi concert 2026'.includes(query)) {
      matches.push({
        id: 'mock-1',
        title: 'Anh Trai Say Hi Concert 2026',
        venue: 'My Dinh National Stadium · Hanoi',
        tier: 'VIP Zone A',
        price: 2500000,
      });
      matches.push({
        id: 'mock-2',
        title: 'Anh Trai Say Hi Concert 2026',
        venue: 'Van Hanh Mall Stadium · HCMC',
        tier: 'General Admission',
        price: 1200000,
      });
    }

    return matches.slice(0, 4);
  }, [searchTerm, listings]);

  const handleSelectSuggestion = (title: string) => {
    setSearchTerm(title);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    setActivePopover(null);
  };

  const handleBuy = (title: string, price: number) => {
    showToast(`Initiating secure Escrow checkout for "${title}" (${formatVND(price)})...`, 'info');
  };

  const hasActiveFilters = selectedDate !== 'all' || selectedLocation !== 'all' || selectedTier !== 'all';

  const handleResetFilters = () => {
    setSelectedDate('all');
    setSelectedLocation('all');
    setSelectedTier('all');
    setActivePopover(null);
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] font-sans antialiased selection:bg-[#FF5A36] selection:text-white pt-24 sm:pt-28 pb-20 overflow-hidden">

      {/* ========================================================================= */}
      {/* 1. VIBRANT & DYNAMIC CINEMATIC CONCERT STAGE BACKGROUND (SÔI ĐỘNG)        */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {/* Injected Keyframes for Concert Stage Lighting & Vibrations */}
        <style>{`
          @keyframes bassPump {
            0%, 100% { transform: scale(1.03); filter: brightness(112%) contrast(108%); }
            20% { transform: scale(1.055) translateY(-2px); filter: brightness(118%) contrast(110%); }
            40% { transform: scale(1.035); filter: brightness(113%) contrast(108%); }
            60% { transform: scale(1.065) translateY(-3px); filter: brightness(120%) contrast(112%); }
            80% { transform: scale(1.03); filter: brightness(112%) contrast(108%); }
          }
          @keyframes sweepFarLeft {
            0%, 100% { transform: rotate(-24deg) scaleY(1); opacity: 0.18; }
            50% { transform: rotate(-8deg) scaleY(1.1); opacity: 0.38; }
          }
          @keyframes sweepMidLeft {
            0%, 100% { transform: rotate(-12deg) scaleY(1); opacity: 0.20; }
            50% { transform: rotate(6deg) scaleY(1.1); opacity: 0.40; }
          }
          @keyframes sweepCenter {
            0%, 100% { transform: rotate(-6deg) scale(1); opacity: 0.22; }
            50% { transform: rotate(8deg) scale(1.12); opacity: 0.45; }
          }
          @keyframes sweepMidRight {
            0%, 100% { transform: rotate(12deg) scaleY(1); opacity: 0.20; }
            50% { transform: rotate(-6deg) scaleY(1.1); opacity: 0.40; }
          }
          @keyframes sweepFarRight {
            0%, 100% { transform: rotate(24deg) scaleY(1); opacity: 0.18; }
            50% { transform: rotate(8deg) scaleY(1.1); opacity: 0.38; }
          }
          @keyframes strobeBurst {
            0%, 100% { opacity: 0.15; transform: scale(0.98); }
            45% { opacity: 0.15; }
            50% { opacity: 0.45; transform: scale(1.06); }
            55% { opacity: 0.18; }
            75% { opacity: 0.40; transform: scale(1.05); }
            80% { opacity: 0.15; }
          }
          @keyframes laserCross1 {
            0% { transform: translateX(-100%) rotate(10deg) scaleX(0.4); opacity: 0; }
            50% { opacity: 0.6; }
            100% { transform: translateX(100%) rotate(10deg) scaleX(1.2); opacity: 0; }
          }
          @keyframes laserCross2 {
            0% { transform: translateX(100%) rotate(-10deg) scaleX(0.4); opacity: 0; }
            50% { opacity: 0.6; }
            100% { transform: translateX(-100%) rotate(-10deg) scaleX(1.2); opacity: 0; }
          }
          @keyframes particleFloat1 {
            0% { transform: translateY(0) translateX(0) scale(0.6); opacity: 0; }
            30% { opacity: 0.8; }
            80% { opacity: 0.6; }
            100% { transform: translateY(-320px) translateX(40px) scale(1.2); opacity: 0; }
          }
          @keyframes particleFloat2 {
            0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
            40% { opacity: 0.8; }
            100% { transform: translateY(-360px) translateX(-50px) scale(1.3); opacity: 0; }
          }
          .animate-bass-pump {
            animation: bassPump 4.8s ease-in-out infinite;
          }
          .animate-sweep-far-left {
            animation: sweepFarLeft 5.5s ease-in-out infinite;
            transform-origin: top left;
          }
          .animate-sweep-mid-left {
            animation: sweepMidLeft 6.8s ease-in-out infinite;
            transform-origin: top left;
          }
          .animate-sweep-center {
            animation: sweepCenter 6.2s ease-in-out infinite;
            transform-origin: top center;
          }
          .animate-sweep-mid-right {
            animation: sweepMidRight 6.6s ease-in-out infinite;
            transform-origin: top right;
          }
          .animate-sweep-far-right {
            animation: sweepFarRight 5.2s ease-in-out infinite;
            transform-origin: top right;
          }
          .animate-strobe-burst {
            animation: strobeBurst 4.8s ease-in-out infinite;
          }
          .animate-laser-1 {
            animation: laserCross1 5.5s linear infinite;
          }
          .animate-laser-2 {
            animation: laserCross2 6s linear infinite;
          }
          .animate-particle-1 {
            animation: particleFloat1 6.5s ease-out infinite;
          }
          .animate-particle-2 {
            animation: particleFloat2 8s ease-out infinite;
          }
        `}</style>

        {/* Real Vibrant Concert Photography with Soft Smooth Bass Rhythm */}
        <img
          src="/images/landing/hero-concert.jpg"
          alt="Concert Atmosphere"
          className="w-full h-full object-cover object-top opacity-90 animate-bass-pump"
        />

        {/* Dynamic Translucent Gradient Overlay (Vibrant Stage Center, Deep Bottom Vignette) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/60 via-[#05070A]/30 to-[#05070A]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,_transparent_25%,_#05070A_80%)]" />

        {/* ========================================================================= */}
        {/* MULTIPLE DYNAMIC CONCERT STAGE SPOTLIGHTS (6 CHÙM ĐÈN ĐA SẮC ÊM ÁI)         */}
        {/* ========================================================================= */}
        {/* 1. Far Left: Electric Cyan Spotlight */}
        <div className="absolute -top-28 left-[5%] w-[450px] h-[850px] bg-[conic-gradient(from_115deg_at_50%_0%,rgba(0,240,255,0.25)_0deg,transparent_45deg)] blur-2xl animate-sweep-far-left pointer-events-none" />

        {/* 2. Mid Left: Magenta / Purple Spotlight */}
        <div className="absolute -top-28 left-[22%] w-[480px] h-[850px] bg-[conic-gradient(from_130deg_at_50%_0%,rgba(236,72,153,0.28)_0deg,transparent_45deg)] blur-2xl animate-sweep-mid-left pointer-events-none" />

        {/* 3. Center: Golden Sun / Amber Spotlight */}
        <div className="absolute -top-24 left-[40%] w-[520px] h-[850px] bg-[conic-gradient(from_170deg_at_50%_0%,rgba(250,204,21,0.25)_0deg,transparent_45deg)] blur-2xl animate-sweep-center pointer-events-none" />

        {/* 4. Mid Right: TicketShield Flame Orange Spotlight */}
        <div className="absolute -top-28 right-[22%] w-[500px] h-[850px] bg-[conic-gradient(from_225deg_at_50%_0%,rgba(255,90,54,0.30)_0deg,transparent_45deg)] blur-2xl animate-sweep-mid-right pointer-events-none" />

        {/* 5. Far Right: Neon Emerald / Cyan Spotlight */}
        <div className="absolute -top-28 right-[5%] w-[450px] h-[850px] bg-[conic-gradient(from_245deg_at_50%_0%,rgba(52,211,153,0.25)_0deg,transparent_45deg)] blur-2xl animate-sweep-far-right pointer-events-none" />

        {/* 6. Center Stage Strobe / Flash Burst */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(255,255,255,0.25),rgba(255,90,54,0.22),transparent_70%)] blur-2xl animate-strobe-burst" />

        {/* Glowing Ambient Stage Flares & Neon Orbs */}
        <div className="absolute top-1/4 -right-16 w-[520px] h-[520px] bg-cyan-400/20 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute top-1/3 -left-16 w-[500px] h-[500px] bg-[#FF5A36]/20 rounded-full blur-[110px] animate-pulse" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/18 rounded-full blur-[140px]" />

        {/* Sweeping Concert Criss-Cross Laser Rays */}
        <div className="absolute top-1/4 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-[1px] animate-laser-1" />
        <div className="absolute top-1/3 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF5A36]/65 to-transparent blur-[1px] animate-laser-2" style={{ animationDelay: '2.2s' }} />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-400/55 to-transparent blur-[1px] animate-laser-1" style={{ animationDelay: '3.8s' }} />

        {/* Floating Glowing Confetti & Energy Sparkles */}
        <div className="absolute bottom-1/3 left-1/5 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#00F0FF] animate-particle-1" />
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 rounded-full bg-[#FF5A36] shadow-[0_0_15px_#FF5A36] animate-particle-2" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_14px_#FDE047] animate-particle-1" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-1/4 right-1/5 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_12px_#F472B6] animate-particle-2" style={{ animationDelay: '3.6s' }} />
        <div className="absolute bottom-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_#34D399] animate-particle-1" style={{ animationDelay: '4.8s' }} />
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTAINER                                                         */}
      {/* ========================================================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">

        {/* Header Section */}
        <div className="text-center space-y-2 max-w-3xl mx-auto pt-2 pb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display text-white tracking-tight uppercase">
            RESALE MARKETPLACE
          </h1>

          <div className="flex justify-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-[#FF5A36] tracking-wide shadow-lg">
              100% Verified Tickets · Organizer Protected · Safe Escrow Checkout
            </span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. MINIMAL & ELEGANT SEARCH + FILTERS AREA                              */}
        {/* ======================================================================= */}
        <div className="max-w-[700px] mx-auto space-y-2.5">
          {/* Search Box */}
          <div ref={searchContainerRef} className="relative">
            <form
              onSubmit={handleSearchSubmit}
              className={`h-14 bg-[#0A0D12]/75 backdrop-blur-xl border rounded-2xl p-1.5 flex items-center gap-2 transition-all duration-200 shadow-xl ${isSearchFocused
                ? 'border-[#FF5A36] ring-1 ring-[#FF5A36]/40 shadow-[0_0_25px_rgba(255,90,54,0.2)]'
                : 'border-white/15 hover:border-white/25'
                }`}
            >
              <Search className="w-4 h-4 text-[#8B929C] ml-3 mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Search events, artists, or venues..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchTerm.trim()) setShowSuggestions(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full bg-transparent border-0 text-[#F5F5F5] placeholder-[#8B929C]/60 text-sm font-medium focus:outline-none pr-2"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowSuggestions(false);
                  }}
                  className="p-1 text-[#8B929C] hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="w-[88px] h-[42px] px-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-wider text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                <span>SEARCH</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0E17]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-left p-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B929C] border-b border-white/10 mb-1">
                  SUGGESTED RESULTS
                </div>

                <div className="space-y-1">
                  {autocompleteSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item.title)}
                      className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-white/[0.08] transition-colors cursor-pointer text-left group"
                    >
                      <img
                        src="/images/landing/featured-1.jpg"
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF5A36] truncate transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#8B929C] truncate font-mono">
                          {item.venue} · <span className="text-white/85 font-semibold">{item.tier}</span>
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#20C997] shrink-0">
                        {formatVND(item.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtle but Clear Filter Controls */}
          <div ref={filterBarRef} className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-3 text-[14px]">
            {/* 1. Date Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'date' ? null : 'date')}
                className={`h-11 px-4 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md flex items-center gap-2 group ${selectedDate !== 'all'
                  ? 'bg-[#0A0C10]/95 border-[#FF5A36]/60 text-white font-medium shadow-[0_0_15px_rgba(255,90,54,0.12)]'
                  : 'bg-[#0A0C10]/85 hover:bg-[#12161F] border-white/15 hover:border-[#FF5A36]/50 text-[#E5E7EB] hover:text-white'
                  }`}
              >
                <Calendar
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${selectedDate !== 'all'
                    ? 'text-[#FF5A36]'
                    : 'text-[#8B929C] group-hover:text-[#FF5A36]'
                    }`}
                />
                <span>
                  {selectedDate === 'all'
                    ? 'All Dates'
                    : dateOptions.find((d) => d.id === selectedDate)?.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8B929C] group-hover:text-white transition-transform duration-200 ${activePopover === 'date' ? 'rotate-180 text-white' : ''
                    }`}
                />
              </button>

              {activePopover === 'date' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#0A0E17]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-40 text-left font-sans">
                  {dateOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedDate(opt.id);
                        setActivePopover(null);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer ${selectedDate === opt.id
                        ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                        : 'text-[#8B929C] hover:bg-white/[0.08] hover:text-white'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {selectedDate === opt.id && <Check className="w-4 h-4 text-[#FF5A36]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Location Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'location' ? null : 'location')}
                className={`h-11 px-4 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md flex items-center gap-2 group ${selectedLocation !== 'all'
                  ? 'bg-[#0A0C10]/95 border-[#FF5A36]/60 text-white font-medium shadow-[0_0_15px_rgba(255,90,54,0.12)]'
                  : 'bg-[#0A0C10]/85 hover:bg-[#12161F] border-white/15 hover:border-[#FF5A36]/50 text-[#E5E7EB] hover:text-white'
                  }`}
              >
                <MapPin
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${selectedLocation !== 'all'
                    ? 'text-[#FF5A36]'
                    : 'text-[#8B929C] group-hover:text-[#FF5A36]'
                    }`}
                />
                <span>
                  {selectedLocation === 'all'
                    ? 'Location'
                    : locationOptions.find((l) => l.id === selectedLocation)?.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8B929C] group-hover:text-white transition-transform duration-200 ${activePopover === 'location' ? 'rotate-180 text-white' : ''
                    }`}
                />
              </button>

              {activePopover === 'location' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#0A0E17]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-40 text-left font-sans">
                  {locationOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(opt.id);
                        setActivePopover(null);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer ${selectedLocation === opt.id
                        ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                        : 'text-[#8B929C] hover:bg-white/[0.08] hover:text-white'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {selectedLocation === opt.id && <Check className="w-4 h-4 text-[#FF5A36]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Ticket Type Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActivePopover(activePopover === 'tier' ? null : 'tier')}
                className={`h-11 px-4 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md flex items-center gap-2 group ${selectedTier !== 'all'
                  ? 'bg-[#0A0C10]/95 border-[#FF5A36]/60 text-white font-medium shadow-[0_0_15px_rgba(255,90,54,0.12)]'
                  : 'bg-[#0A0C10]/85 hover:bg-[#12161F] border-white/15 hover:border-[#FF5A36]/50 text-[#E5E7EB] hover:text-white'
                  }`}
              >
                <Ticket
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${selectedTier !== 'all'
                    ? 'text-[#FF5A36]'
                    : 'text-[#8B929C] group-hover:text-[#FF5A36]'
                    }`}
                />
                <span>
                  {selectedTier === 'all'
                    ? 'Ticket Tier'
                    : tierOptions.find((t) => t.id === selectedTier)?.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#8B929C] group-hover:text-white transition-transform duration-200 ${activePopover === 'tier' ? 'rotate-180 text-white' : ''
                    }`}
                />
              </button>

              {activePopover === 'tier' && (
                <div className="absolute top-full right-0 sm:left-0 mt-2 w-52 bg-[#0A0E17]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-40 text-left font-sans">
                  {tierOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedTier(opt.id);
                        setActivePopover(null);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg text-xs sm:text-[13px] flex items-center justify-between transition-colors cursor-pointer ${selectedTier === opt.id
                        ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                        : 'text-[#8B929C] hover:bg-white/[0.08] hover:text-white'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {selectedTier === opt.id && <Check className="w-4 h-4 text-[#FF5A36]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-11 px-3.5 rounded-xl text-xs sm:text-[13px] font-mono text-[#8B929C] hover:text-white bg-[#0A0C10]/85 hover:bg-[#12161F] border border-white/15 hover:border-white/30 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                title="Reset filters"
              >
                <X className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. LISTING HEADER & SINGLE SORT DROPDOWN (CLEAR 44PX VERTICAL SEPARATION)*/}
        {/* ======================================================================= */}
        <div className="flex items-end justify-between gap-3 mt-11 mb-6">
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold font-display uppercase tracking-wider text-white">
              ACTIVE LISTINGS
            </h2>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-xs font-mono font-semibold text-[#FF5A36] tracking-wide shadow-sm">
                {String(filteredListings.length).padStart(2, '0')} tickets available
              </span>
            </div>
          </div>

          {/* Single Compact Sorting Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="h-10 px-3.5 rounded-xl bg-[#0A0C10]/85 hover:bg-[#12161F] border border-white/15 hover:border-[#FF5A36]/40 text-xs sm:text-[13px] font-sans text-[#8B929C] hover:text-white flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md group"
            >
              <span>Sort by:</span>
              <span className="text-white font-medium">{sortOptions.find((s) => s.id === sortBy)?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#8B929C] group-hover:text-white transition-transform ${isSortOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {isSortOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-[#0A0E17]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1 z-40 text-left font-sans text-xs sm:text-[13px]">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.id);
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${sortBy === opt.id
                      ? 'bg-[#FF5A36]/20 text-[#FF5A36] font-bold'
                      : 'text-[#8B929C] hover:text-white hover:bg-white/[0.08]'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#FF5A36]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
            <p className="text-xs text-[#8B929C] font-mono">Loading verified ticket listings in real-time...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="py-16 bg-[#0A0D12]/90 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Unable to connect to API server</h3>
            <p className="text-xs text-[#8B929C] max-w-md mx-auto font-mono">
              {error instanceof Error ? error.message : 'Please check that backend services are online and try again.'}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredListings.length === 0 && (
          <div className="py-20 bg-[#0A0D12]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {hasActiveFilters || searchTerm
                ? 'No matching tickets found'
                : 'No tickets currently listed on the marketplace'}
            </h3>
            <p className="text-xs text-[#8B929C] max-w-md mx-auto">
              {hasActiveFilters || searchTerm
                ? 'Try adjusting your search keyword or resetting filters.'
                : 'Be the first to list verified tickets with Escrow protection!'}
            </p>
            {(hasActiveFilters || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  handleResetFilters();
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear all filters & search</span>
              </button>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* 5. VISUAL EVENT CARDS (3 COLUMNS DESKTOP, 2 TABLET, 1 MOBILE)           */}
        {/* ======================================================================= */}
        {!isLoading && !isError && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredListings.map((listing) => (
              <div
                key={listing.listingId}
                className="bg-[#090C12]/96 backdrop-blur-2xl border border-white/20 hover:border-[#FF5A36]/60 rounded-[20px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:shadow-[0_25px_60px_rgba(255,90,54,0.22)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group"
              >
                {/* Large Event Image */}
                <div className="relative h-56 sm:h-64 overflow-hidden bg-black/60">
                  <img
                    src="/images/landing/featured-1.jpg"
                    alt={listing.eventName}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out brightness-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090C12] via-black/40 to-transparent pointer-events-none" />

                  {/* Top-Left Verified Trust Badge */}
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <TicketShieldTrustBadge variant="compact" isPrivate={listing.isPrivate} />
                  </div>

                  {/* Top-Right Masked Ticket Code */}
                  <div className="absolute top-3.5 right-3.5">
                    <span className="px-3 py-1 bg-[#06090E]/92 backdrop-blur-md border border-white/25 text-[11px] font-mono font-bold text-[#E2E8F0] rounded-full shadow-xl">
                      {listing.maskedTicketCode}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between bg-[#090C12]">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-[#FF5A36] block mb-1 drop-shadow-sm">
                        {listing.tierName}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-display text-white group-hover:text-[#FF5A36] transition-colors line-clamp-1 leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {listing.eventName}
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs font-mono pt-1">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0 drop-shadow-sm" />
                        <span className="text-white font-semibold text-[13px]">{formatEventDateTime(listing.eventStartAt)}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 drop-shadow-sm" />
                        <span className="text-[#CBD5E1] font-medium text-xs truncate">{listing.eventVenue}</span>
                      </div>
                      {listing.sellerFullName && (
                        <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
                          <UserCheck className="w-4 h-4 text-[#20C997] shrink-0 drop-shadow-sm" />
                          <span>Seller: <strong className="text-white font-semibold">{listing.sellerFullName}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Price & CTA */}
                  <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-[#94A3B8] uppercase font-mono font-bold tracking-wider block">
                        RESALE PRICE
                      </span>
                      <p className="text-2xl sm:text-3xl font-black font-display text-white tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                        {formatVND(listing.resalePrice)}
                      </p>
                      <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                        Orig. {formatVND(listing.originalPrice)}
                        {listing.discountPercentage > 0 && (
                          <span className="text-[#20C997] font-bold ml-1">(-{listing.discountPercentage}%)</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => handleBuy(listing.eventName, listing.resalePrice)}
                      className="h-11 px-5 sm:px-6 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 text-white font-black font-display text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_25px_rgba(255,90,54,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>BUY TICKET</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================================= */}
        {/* 6. PAGINATION NAVIGATION BAR                                             */}
        {/* ======================================================================= */}
        {!isLoading && !isError && (paginatedData?.totalPages || 0) > 1 && (
          <div className="pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
            <div className="text-xs font-mono text-[#A3A8B3]">
              Showing page <strong className="text-white font-bold">{paginatedData?.pageNumber}</strong> of{' '}
              <strong className="text-white font-bold">{paginatedData?.totalPages}</strong> ({paginatedData?.totalCount} tickets total)
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (paginatedData?.hasPreviousPage) {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }
                }}
                disabled={!paginatedData?.hasPreviousPage || isFetching}
                className="px-4 py-2 bg-[#0A0D12] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 hover:border-white/30 rounded-xl text-xs font-mono font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: paginatedData?.totalPages || 1 }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === paginatedData?.totalPages || Math.abs(p - (paginatedData?.pageNumber || 1)) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-500 font-mono text-xs">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(p);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        disabled={isFetching}
                        className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                          p === paginatedData?.pageNumber
                            ? 'bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/30'
                            : 'bg-[#0A0D12] hover:bg-white/10 text-[#A3A8B3] hover:text-white border border-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (paginatedData?.hasNextPage) {
                    setCurrentPage((p) => p + 1);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }
                }}
                disabled={!paginatedData?.hasNextPage || isFetching}
                className="px-4 py-2 bg-[#0A0D12] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 hover:border-white/30 rounded-xl text-xs font-mono font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MarketplacePage;

