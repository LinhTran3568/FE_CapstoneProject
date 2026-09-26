import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  MapPin,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { QuickFilterBar, QuickFilterState } from '../components/marketplace/QuickFilterBar';
import { TicketCard } from '../components/marketplace/TicketCard';
import { BuyTicketModal } from '../components/marketplace/BuyTicketModal';
import { StageMapModal } from '../components/marketplace/StageMapModal';
import { MarketplaceListingDto } from '@ticketshield/types';

export const MarketplacePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'ALL'
  );

  // Quick filters state
  const [filters, setFilters] = useState<QuickFilterState>({
    keyword: searchParams.get('q') || '',
    city: searchParams.get('city') || 'ALL',
    dateRange: 'all',
    sortBy: 'newest',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Sync state when URL searchParams changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('category') || 'ALL';
    const city = searchParams.get('city') || 'ALL';

    setFilters((prev) => ({
      ...prev,
      keyword: q,
      city: city,
    }));
    setSelectedCategory(cat);
    setCurrentPage(1);
  }, [searchParams]);

  // Query marketplace listings
  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMarketplaceListings({
    keyword: filters.keyword.trim() || undefined,
    page: currentPage,
    size: pageSize,
  });

  const listings = paginatedData?.items || [];

  // Filter & sort listings on client side
  const filteredListings = useMemo(() => {
    const filtered = listings.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL') {
        const title = (item.eventName || '').toLowerCase();
        if (selectedCategory === 'CONCERT') {
          if (
            !title.includes('concert') &&
            !title.includes('live') &&
            !title.includes('tour') &&
            !title.includes('say hi') &&
            !title.includes('mỹ tâm')
          ) {
            return false;
          }
        } else if (selectedCategory === 'FESTIVAL') {
          if (!title.includes('fest') && !title.includes('rave') && !title.includes('music')) {
            return false;
          }
        } else if (selectedCategory === 'SPORTS') {
          if (
            !title.includes('derby') &&
            !title.includes('league') &&
            !title.includes('bóng') &&
            !title.includes('clb')
          ) {
            return false;
          }
        } else if (selectedCategory === 'THEATER') {
          if (
            !title.includes('kịch') &&
            !title.includes('ngày xửa') &&
            !title.includes('diễn') &&
            !title.includes('hát')
          ) {
            return false;
          }
        }
      }

      // 2. City Filter
      if (filters.city !== 'ALL') {
        const venue = (item.eventVenue || '').toLowerCase();
        const cityLower = filters.city.toLowerCase();
        if (!venue.includes(cityLower)) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (filters.dateRange === 'upcoming') {
        const eventDate = new Date(item.eventStartAt);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 7);
        if (eventDate > maxDate) return false;
      } else if (filters.dateRange === 'this-month') {
        const eventDate = new Date(item.eventStartAt);
        const currentDate = new Date();
        if (
          eventDate.getMonth() !== currentDate.getMonth() ||
          eventDate.getFullYear() !== currentDate.getFullYear()
        ) {
          return false;
        }
      }

      return true;
    });

    // 4. Sorting
    return filtered.sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.resalePrice - b.resalePrice;
      if (filters.sortBy === 'date-asc') {
        return new Date(a.eventStartAt).getTime() - new Date(b.eventStartAt).getTime();
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [listings, selectedCategory, filters]);

  // Update filter & sync with URL
  const handleFilterChange = (newFilters: QuickFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);

    const params: Record<string, string> = {};
    if (newFilters.keyword.trim()) params.q = newFilters.keyword.trim();
    if (newFilters.city !== 'ALL') params.city = newFilters.city;
    if (selectedCategory !== 'ALL') params.category = selectedCategory;
    setSearchParams(params);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);

    const params: Record<string, string> = {};
    if (filters.keyword.trim()) params.q = filters.keyword.trim();
    if (filters.city !== 'ALL') params.city = filters.city;
    if (catId !== 'ALL') params.category = catId;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setFilters({
      keyword: '',
      city: 'ALL',
      dateRange: 'all',
      sortBy: 'newest',
    });
    setSearchParams({});
  };

  // Modals inherited from user design
  const [buyingListing, setBuyingListing] = useState<MarketplaceListingDto | null>(null);
  const [isStageMapOpen, setIsStageMapOpen] = useState(false);

  // Resume buying flow if returning after login with ?buy=listingId
  useEffect(() => {
    const buyListingId = searchParams.get('buy');
    if (buyListingId && isAuthenticated && listings.length > 0) {
      const targetListing = listings.find((l) => l.listingId === buyListingId);
      if (targetListing) {
        setBuyingListing(targetListing);
        // Clear buy param so it doesn't re-trigger on subsequent renders
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('buy');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, isAuthenticated, listings]);

  const handleBuy = (listing: MarketplaceListingDto) => {
    const rawStatus = (listing.listingStatus || '').toLowerCase();
    if (rawStatus === 'transacting') {
      showToast('This ticket is currently in a checkout session. Please choose another ticket or check back later!', 'warning');
      return;
    }
    if (rawStatus === 'sold') {
      showToast('This ticket has already been sold. Please choose another ticket!', 'warning');
      return;
    }

    if (!isAuthenticated) {
      showToast('Please sign in to proceed with purchasing tickets.', 'warning');
      navigate('/login', {
        state: {
          from: `/marketplace?buy=${listing.listingId}`,
        },
      });
      return;
    }
    setBuyingListing(listing);
  };

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    Boolean(filters.keyword.trim()) ||
    filters.city !== 'ALL' ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'newest';

  const CATEGORY_TABS = [
    { id: 'ALL', label: 'All Tickets' },
    { id: 'CONCERT', label: 'Concerts & Live' },
    { id: 'FESTIVAL', label: 'Festivals & EDM' },
    { id: 'SPORTS', label: 'Sports' },
    { id: 'THEATER', label: 'Theater & Arts' },
  ];

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] font-sans antialiased selection:bg-[#FF5A36] selection:text-white pt-24 sm:pt-28 pb-16 overflow-hidden">
      {/* ================= DYNAMIC BACKGROUND ATMOSPHERE WITH EFFECTS ================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Real High-Res Concert Laser Arena Photo with Slow Breathing Zoom Animation */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.65, 0.76, 0.65],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter contrast-125 saturate-125"
          style={{
            backgroundImage: `url('/images/landing/marketplace-hero.jpg')`,
          }}
        />

        {/* Dynamic Sweeping Cyber Laser Light Beam 1 (Neon Coral) */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
            opacity: [0, 0.35, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 1.5,
          }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#FF5A36]/40 to-transparent transform -skew-x-12 blur-2xl pointer-events-none"
        />

        {/* Dynamic Sweeping Cyber Laser Light Beam 2 (Electric Cyan) */}
        <motion.div
          animate={{
            x: ['200%', '-100%'],
            opacity: [0, 0.25, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 3,
          }}
          className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent transform skew-x-12 blur-2xl pointer-events-none"
        />

        {/* Layered Gradient Masks for Perfect Content Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/35 via-[#05070A]/60 to-[#05070A]/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/75 via-transparent to-[#05070A]/75" />

        {/* Floating Cyber Light Particles */}
        {[
          { top: '15%', left: '12%', size: 4, color: 'bg-orange-400 shadow-[0_0_10px_#fb923c]', duration: 7, delay: 0 },
          { top: '25%', left: '85%', size: 5, color: 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]', duration: 9, delay: 1 },
          { top: '45%', left: '22%', size: 3, color: 'bg-amber-300 shadow-[0_0_8px_#fcd34d]', duration: 8, delay: 2 },
          { top: '65%', left: '78%', size: 4, color: 'bg-orange-500 shadow-[0_0_10px_#f97316]', duration: 11, delay: 0.5 },
          { top: '35%', left: '50%', size: 5, color: 'bg-cyan-300 shadow-[0_0_12px_#67e8f9]', duration: 10, delay: 3 },
          { top: '75%', left: '15%', size: 3, color: 'bg-purple-400 shadow-[0_0_8px_#c084fc]', duration: 8.5, delay: 1.5 },
          { top: '80%', left: '60%', size: 4, color: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]', duration: 9.5, delay: 2.5 },
          { top: '18%', left: '42%', size: 3, color: 'bg-rose-400 shadow-[0_0_8px_#fb7185]', duration: 12, delay: 4 },
        ].map((particle, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [-15, 15, -15],
              x: [-10, 10, -10],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute rounded-full pointer-events-none ${particle.color}`}
            style={{
              top: particle.top,
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          />
        ))}

        {/* Dynamic Floating Coral/Amber Glow Orb */}
        <motion.div
          animate={{
            x: [-40, 50, -40],
            y: [-30, 40, -30],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/40 via-[#FF5A36]/12 to-transparent blur-3xl"
        />

        {/* Dynamic Floating Cyan Laser Beam Orb */}
        <motion.div
          animate={{
            x: [40, -50, 40],
            y: [30, -30, 30],
            scale: [1, 1.25, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/3 -left-20 w-[600px] h-[450px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/30 via-cyan-500/8 to-transparent blur-3xl"
        />

        {/* Dynamic Floating Violet / Purple Accent Orb */}
        <motion.div
          animate={{
            x: [-30, 30, -30],
            y: [20, -20, 20],
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.32, 0.15],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 -right-24 w-[550px] h-[450px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/25 via-purple-600/8 to-transparent blur-3xl"
        />

        {/* Dynamic Concert Moving Searchlight Beams */}
        <motion.div
          animate={{
            rotate: [-20, 25, -20],
            opacity: [0.18, 0.4, 0.18],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom left' }}
          className="absolute -bottom-20 -left-10 w-[450px] h-[850px] bg-gradient-to-t from-[#FF5A36]/30 via-[#FF5A36]/10 to-transparent blur-3xl pointer-events-none"
        />

        <motion.div
          animate={{
            rotate: [25, -20, 25],
            opacity: [0.18, 0.4, 0.18],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: 'bottom right' }}
          className="absolute -bottom-20 -right-10 w-[450px] h-[850px] bg-gradient-to-t from-cyan-400/30 via-cyan-400/10 to-transparent blur-3xl pointer-events-none"
        />

        {/* Shooting Cyber Laser Streak 1 */}
        <motion.div
          animate={{
            x: ['-200%', '300%'],
            y: ['-50%', '250%'],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeOut',
          }}
          className="absolute top-10 -left-40 w-72 h-[2px] bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent transform -rotate-12 blur-[1px] pointer-events-none"
        />

        {/* Shooting Cyber Laser Streak 2 */}
        <motion.div
          animate={{
            x: ['300%', '-200%'],
            y: ['0%', '300%'],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 7,
            delay: 2.5,
            ease: 'easeOut',
          }}
          className="absolute top-28 -right-40 w-80 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform rotate-12 blur-[1px] pointer-events-none"
        />

        {/* Subtle Ambient Equalizer Wave Bars at the bottom */}
        <div className="absolute bottom-0 inset-x-0 h-16 flex items-end justify-center gap-1.5 opacity-25 pointer-events-none overflow-hidden px-8">
          {[24, 45, 30, 60, 80, 50, 95, 40, 70, 35, 85, 65, 30, 55, 75, 40, 90, 60, 35, 70, 45, 80, 50, 30].map((height, i) => (
            <motion.div
              key={i}
              animate={{
                height: [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`],
              }}
              transition={{
                duration: 1.2 + (i % 5) * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'reverse',
              }}
              className="w-1.5 rounded-t-full bg-gradient-to-t from-[#FF5A36] via-amber-400 to-cyan-400 shadow-[0_0_8px_rgba(255,90,54,0.4)]"
            />
          ))}
        </div>

        {/* High-tech Micro Dot Matrix Overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.45) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Navigation back to Home & Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#CBD5E1] hover:text-[#FF5A36] bg-[#090C12] hover:bg-[#121622] border border-white/10 hover:border-[#FF5A36]/40 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B929C] group-hover:-translate-x-1 group-hover:text-[#FF5A36] transition-all" />
            <span>Back to Home</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#8B929C] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-2.5">
              <span>Ticket Marketplace</span>
              <Sparkles className="w-5 h-5 text-[#FF5A36] animate-pulse" />
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-xs font-mono font-bold text-[#FF5A36] shadow-[0_0_12px_rgba(255,90,54,0.25)]">
              {filteredListings.length} tickets available
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Discover and purchase verified tickets directly reissued by official organizers, protected by our 24-hour buyer funds guarantee
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategorySelect(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF5A36] text-white shadow-[0_2px_12px_rgba(255,90,54,0.35)]'
                    : 'bg-[#090C12] text-[#94A3B8] hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsStageMapOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1.5 shrink-0 ml-auto"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Venue Seating Map</span>
          </button>
        </div>

        {/* Quick Filter Bar (Search input, City, Date range, Sort by price/date) */}
        <QuickFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
            <p className="text-xs text-[#8B929C] font-mono">Loading tickets...</p>
          </div>
        )}

        {isError && (
          <div className="py-16 bg-[#0A0D12]/90 border border-rose-500/20 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Unable to connect to server</h3>
            <p className="text-xs text-[#8B929C] max-w-md mx-auto">
              {error instanceof Error ? error.message : 'Please try again later.'}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Reload Data</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredListings.length === 0 && (
          <div className="py-24 bg-[#090C12]/60 border border-white/10 rounded-3xl p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
              <Ticket className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No matching tickets found</h3>
              <p className="text-xs text-[#8B929C] max-w-md mx-auto">
                Currently there are no tickets matching your search criteria. Try a different keyword or reset filters.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Ticket Listings Grid (2 cột thoáng đãng, sang trọng) */}
        {!isLoading && !isError && filteredListings.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredListings.map((listing) => (
                <TicketCard key={listing.listingId} listing={listing} onBuy={handleBuy} />
              ))}
            </div>

            {/* Pagination Controls */}
            {paginatedData && paginatedData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl bg-[#090C12] border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-xs font-mono text-[#8B929C]">
                  Page <strong className="text-white">{currentPage}</strong> /{' '}
                  {paginatedData.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(paginatedData.totalPages, p + 1))
                  }
                  disabled={currentPage >= paginatedData.totalPages}
                  className="px-3.5 py-2 rounded-xl bg-[#090C12] border border-white/10 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals inherited from user design */}
      <BuyTicketModal
        listing={buyingListing}
        isOpen={Boolean(buyingListing)}
        onClose={() => setBuyingListing(null)}
        onSuccess={(orderData) => {
          setBuyingListing(null);
          queryClient.invalidateQueries({ queryKey: ['resale-listings'] });
          refetch();
          showToast(
            `Ticket purchased successfully! Order ID: ${orderData.orderId}. Please check your email and My Tickets.`,
            'success'
          );
          navigate('/my-tickets');
        }}
      />

      <StageMapModal
        isOpen={isStageMapOpen}
        onClose={() => setIsStageMapOpen(false)}
        onSelectZone={(zone) => {
          setSelectedCategory('ALL');
          setFilters((prev) => ({ ...prev, keyword: zone }));
          showToast(`Filtered tickets by zone: ${zone}`, 'info');
        }}
      />
    </div>
  );
};

export default MarketplacePage;
