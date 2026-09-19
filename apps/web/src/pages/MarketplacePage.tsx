import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { QuickFilterBar, QuickFilterState } from '../components/marketplace/QuickFilterBar';
import { TicketCard } from '../components/marketplace/TicketCard';
import { BuyTicketModal } from '../components/marketplace/BuyTicketModal';
import { StageMapModal } from '../components/marketplace/StageMapModal';
import { MarketplaceListingDto } from '@ticketshield/types';

export const MarketplacePage: React.FC = () => {
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
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để tiến hành đặt mua vé.', 'warning');
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
    { id: 'ALL', label: 'Tất cả vé' },
    { id: 'CONCERT', label: 'Ca nhạc & Concert' },
    { id: 'FESTIVAL', label: 'Lễ hội & EDM' },
    { id: 'SPORTS', label: 'Thể thao' },
    { id: 'THEATER', label: 'Sân khấu kịch' },
  ];

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] font-sans antialiased selection:bg-[#FF5A36] selection:text-white pt-24 sm:pt-28 pb-16">
      {/* Ambient background light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute top-1/4 -right-24 w-[450px] h-[450px] bg-[#FF5A36]/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -left-24 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px]" />
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
            <span>Quay lại Trang chủ</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#8B929C] hover:text-[#FF5A36] transition-colors cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              Sàn Giao Dịch Vé
            </h1>
            <span className="px-3 py-1 rounded-full bg-[#FF5A36]/10 border border-[#FF5A36]/30 text-xs font-mono font-bold text-[#FF5A36]">
              {filteredListings.length} vé khả dụng
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8B929C]">
            Khám phá và đặt mua vé sang tên chính chủ được bảo vệ bởi quỹ ký quỹ an toàn 24h
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
            <span>Sơ đồ sân khấu</span>
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
            <p className="text-xs text-[#8B929C] font-mono">Đang tải danh sách vé...</p>
          </div>
        )}

        {isError && (
          <div className="py-16 bg-[#0A0D12]/90 border border-rose-500/20 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Không thể kết nối đến máy chủ</h3>
            <p className="text-xs text-[#8B929C] max-w-md mx-auto">
              {error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Tải lại dữ liệu</span>
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
              <h3 className="text-lg font-bold text-white">Không tìm thấy vé phù hợp</h3>
              <p className="text-xs text-[#8B929C] max-w-md mx-auto">
                Hiện tại chưa có vé nào phù hợp với các tiêu chí tìm kiếm của bạn. Bạn có thể thử tìm kiếm từ khóa khác hoặc xóa bớt tiêu chí lọc.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Xóa tất cả tiêu chí lọc
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
                  <span>Trang trước</span>
                </button>
                <span className="text-xs font-mono text-[#8B929C]">
                  Trang <strong className="text-white">{currentPage}</strong> /{' '}
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
                  <span>Trang sau</span>
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
          showToast(
            `Đặt vé thành công! Mã đơn: ${orderData.orderId}. Vui lòng kiểm tra email và danh sách Vé Của Tôi.`,
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
          showToast(`Đã lọc danh sách vé theo khu vực: ${zone}`, 'info');
        }}
      />
    </div>
  );
};

export default MarketplacePage;
