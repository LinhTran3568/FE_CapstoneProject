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
import { TicketDetailModal } from '../components/marketplace/TicketDetailModal';
import { StageMapModal } from '../components/marketplace/StageMapModal';
import { MarketplaceListingDto } from '@ticketshield/types';
import { API_CONFIG, resaleListingsApi } from '@ticketshield/api-client';
import * as signalR from '@microsoft/signalr';

export const MarketplacePage: React.FC = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_CONFIG.baseURL.replace(/\/api\/v1\/?$/, '')}/hubs/payment`)
      .withAutomaticReconnect()
      .build();
    connection.on('MarketplaceListingChanged', () => {
      void queryClient.invalidateQueries({ queryKey: ['resale-listings', 'marketplace'] });
    });
    void connection.start().then(() => connection.invoke('JoinMarketplace')).catch(() => {});
    return () => { void connection.stop(); };
  }, [queryClient]);
  const { showToast } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
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
    organizerId: searchParams.get('organizer') || 'ALL',
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
    const org = searchParams.get('organizer') || 'ALL';

    setFilters((prev) => ({
      ...prev,
      keyword: q,
      city: city,
      organizerId: org,
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
    organizerId: filters.organizerId && filters.organizerId !== 'ALL' ? filters.organizerId : undefined,
    // TC-MKT-01 / TC-MKT-03: category, city, date and sort are applied by the API on all listings,
    // not on the 12 listings of the current page.
    category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
    city: filters.city !== 'ALL' ? filters.city : undefined,
    dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined,
    sortBy: filters.sortBy !== 'newest' ? filters.sortBy : undefined,
    page: currentPage,
    size: pageSize,
  });

  const listings = paginatedData?.items || [];
  // Total number of tickets that match the filters on every page (a combo counts each ticket).
  const totalMatching = paginatedData?.totalCount ?? listings.length;

  // The API already filtered and sorted; only merge bundle combos into one card here.
  const filteredListings = useMemo(() => {
    const sorted = [...listings];

    // Dedup bundle combos: chỉ giữ 1 card đại diện cho mỗi bundleId
    const bundleRepresentatives = new Map<string, MarketplaceListingDto>();
    sorted.forEach((item) => {
      if (!item.bundleId || (item.bundleTotalTickets ?? 0) <= 1) return;
      const current = bundleRepresentatives.get(item.bundleId);
      if (!current || (item.listingStatus || '').toLowerCase() === 'transacting') {
        bundleRepresentatives.set(item.bundleId, item);
      }
    });
    return sorted.filter((item) => {
      if (item.bundleId && (item.bundleTotalTickets ?? 0) > 1) {
        return bundleRepresentatives.get(item.bundleId)?.listingId === item.listingId;
      }
      return true;
    });
  }, [listings]);

  // Map bundleId -> all listings in that bundle (dùng để truyền vào TicketCard)
  const bundleMap = useMemo(() => {
    const map = new Map<string, MarketplaceListingDto[]>();
    for (const item of listings) {
      if (item.bundleId && (item.bundleTotalTickets ?? 0) > 1) {
        const group = map.get(item.bundleId) || [];
        group.push(item);
        map.set(item.bundleId, group);
      }
    }
    return map;
  }, [listings]);

  // Update filter & sync with URL
  const handleFilterChange = (newFilters: QuickFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);

    const params: Record<string, string> = {};
    if (newFilters.keyword.trim()) params.q = newFilters.keyword.trim();
    if (newFilters.city !== 'ALL') params.city = newFilters.city;
    if (newFilters.organizerId && newFilters.organizerId !== 'ALL') params.organizer = newFilters.organizerId;
    if (selectedCategory !== 'ALL') params.category = selectedCategory;
    setSearchParams(params);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);

    const params: Record<string, string> = {};
    if (filters.keyword.trim()) params.q = filters.keyword.trim();
    if (filters.city !== 'ALL') params.city = filters.city;
    if (filters.organizerId && filters.organizerId !== 'ALL') params.organizer = filters.organizerId;
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
  const [isIndividualPurchase, setIsIndividualPurchase] = useState<boolean>(false);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [inspectingListing, setInspectingListing] = useState<MarketplaceListingDto | null>(null);
  const [isStageMapOpen, setIsStageMapOpen] = useState(false);

  // Resume buying flow if returning after login with ?buy=listingId
  useEffect(() => {
    const buyListingId = searchParams.get('buy');
    if (buyListingId && isAuthenticated && listings.length > 0) {
      const targetListing = listings.find((l) => l.listingId === buyListingId);
      if (targetListing) {
        const isOwner = Boolean(
          user?.id && (
            targetListing.sellerId?.toLowerCase() === user.id.toLowerCase() ||
            (targetListing.bundleId && listings.some((l) => l.bundleId === targetListing.bundleId && l.sellerId?.toLowerCase() === user.id.toLowerCase()))
          )
        );
        if (isOwner) {
          showToast('You cannot purchase your own listing!', 'warning');
        } else {
          setBuyingListing(targetListing);
        }
        // Clear buy param so it doesn't re-trigger on subsequent renders
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('buy');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, isAuthenticated, listings, user]);

  // Open ticket detail modal if URL has ?listingId=...
  useEffect(() => {
    const listingIdParam = searchParams.get('listingId');
    if (!listingIdParam) return;

    // Check if it's already in the loaded listings
    const match = listings.find((l) => l.listingId === listingIdParam);
    if (match) {
      setInspectingListing(match);
      return;
    }

    // If not in currently loaded listings, fetch it directly
    let isCancelled = false;
    resaleListingsApi
      .getListingById(listingIdParam)
      .then((detail) => {
        if (!isCancelled && detail) {
          setInspectingListing(detail);
        }
      })
      .catch((err) => {
        console.warn('Could not load listing detail for', listingIdParam, err);
      });

    return () => {
      isCancelled = true;
    };
  }, [searchParams, listings]);

  const handleBuy = (listing: MarketplaceListingDto, isIndividual = false, selectedIds: string[] = []) => {
    const rawStatus = (listing.listingStatus || '').toLowerCase();
    if (rawStatus === 'transacting') {
      showToast('This ticket is currently in a checkout session. Please choose another ticket or check back later!', 'warning');
      return;
    }
    if (rawStatus === 'sold') {
      showToast('This ticket has already been sold. Please choose another ticket!', 'warning');
      return;
    }

    const isOwner = Boolean(
      user?.id && (
        listing.sellerId?.toLowerCase() === user.id.toLowerCase() ||
        (listing.bundleId && listings.some((l) => l.bundleId === listing.bundleId && l.sellerId?.toLowerCase() === user.id.toLowerCase()))
      )
    );
    if (isOwner) {
      showToast('You cannot purchase your own listing!', 'warning');
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
    setIsIndividualPurchase(isIndividual);
    setSelectedListingIds(selectedIds);
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
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] font-sans antialiased selection:bg-[#FF5A36] selection:text-white pt-24 sm:pt-28 pb-16 overflow-x-clip">
      {/* ================= DYNAMIC BACKGROUND ATMOSPHERE WITH EFFECTS ================= */}
      {/* ================= HIGH-PERFORMANCE STATIC AMBIENT BACKGROUND ================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Static Concert Arena Backdrop with subtle opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 filter contrast-125 saturate-125"
          style={{
            backgroundImage: `url('/images/landing/marketplace-hero.jpg')`,
          }}
        />

        {/* Clean Fintech Dark Gradient Overlays for zero GPU overhead */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/75 via-[#05070A]/90 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/8 via-transparent to-transparent" />

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center gap-2.5">
              <span>Ticket Marketplace</span>
              <Sparkles className="w-5 h-5 text-[#FF5A36]" />
            </h1>
            {filteredListings.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                <span>{totalMatching} tickets available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono font-medium text-zinc-400 shadow-md">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span>0 tickets available</span>
              </span>
            )}
          </div>
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
            className="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer bg-black/75 hover:bg-black/90 text-white hover:text-amber-300 border border-amber-400/50 backdrop-blur-md inline-flex items-center gap-1.5 shrink-0 ml-auto shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
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
          <div className="space-y-8 pt-4">
            <div
              id="marketplace-card-grid"
              className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 gap-x-6 items-stretch"
            >
              {filteredListings.map((listing) => (
                <div
                  key={listing.listingId}
                  className="relative hover:z-20 overflow-visible"
                >
                  <TicketCard
                    listing={listing}
                    onBuy={handleBuy}
                    onViewDetails={(target) => setInspectingListing(target)}
                    bundleListings={listing.bundleId ? bundleMap.get(listing.bundleId) : undefined}
                  />
                </div>
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
        allListings={listings}
        isOpen={Boolean(buyingListing)}
        isIndividualPurchase={isIndividualPurchase}
        selectedListingIds={selectedListingIds}
        onClose={() => {
          setBuyingListing(null);
          setIsIndividualPurchase(false);
          setSelectedListingIds([]);
        }}
        onSuccess={(orderData) => {
          setBuyingListing(null);
          setIsIndividualPurchase(false);
          setSelectedListingIds([]);
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

      {/* Ticket Details Inspection Modal */}
      <TicketDetailModal
        listing={inspectingListing}
        isOpen={Boolean(inspectingListing)}
        onClose={() => {
          setInspectingListing(null);
          if (searchParams.get('listingId')) {
            const next = new URLSearchParams(searchParams);
            next.delete('listingId');
            setSearchParams(next, { replace: true });
          }
        }}
        onBuy={(target, isIndividual, selectedIds) => {
          setInspectingListing(null);
          if (searchParams.get('listingId')) {
            const next = new URLSearchParams(searchParams);
            next.delete('listingId');
            setSearchParams(next, { replace: true });
          }
          handleBuy(target, isIndividual, selectedIds);
        }}
        bundleListings={
          inspectingListing?.bundleId
            ? bundleMap.get(inspectingListing.bundleId)
            : undefined
        }
        isOwner={Boolean(
          user?.id && inspectingListing && (
            inspectingListing.sellerId?.toLowerCase() === user.id.toLowerCase() ||
            (inspectingListing.bundleId && listings.some((l) => l.bundleId === inspectingListing.bundleId && l.sellerId?.toLowerCase() === user.id.toLowerCase()))
          )
        )}
      />
    </div>
  );
};

export default MarketplacePage;
