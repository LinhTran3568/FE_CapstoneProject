import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, ArrowRight, ShieldCheck, Lock, UserCheck } from 'lucide-react';
import { useTrendingEvents } from '../hooks/useTrendingEvents';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';
import { TrendingBannerSlider } from '../components/marketplace/TrendingBannerSlider';
import { UpcomingTabbedSection } from '../components/marketplace/UpcomingTabbedSection';
import { CategoryTabbedSection } from '../components/marketplace/CategoryTabbedSection';
import { FeaturedArtistsOrganizers } from '../components/marketplace/FeaturedArtistsOrganizers';
import { CityBrowseSection } from '../components/marketplace/CityBrowseSection';
import { TrendingEventDto } from '@ticketshield/types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Query marketplace listings to compute live ticket counts
  const { data: paginatedData } = useMarketplaceListings({ page: 1, size: 50 });
  const listings = paginatedData?.items || [];

  // Query trending / overall events
  const { data: trendingEventsData } = useTrendingEvents({ limit: 12 });

  // Curated Fallback events
  const FALLBACK_EVENTS: TrendingEventDto[] = useMemo(
    () => [
      {
        eventId: 'fb-1',
        name: 'Anh Trai Say Hi Live Concert 2026',
        artist: 'HIEUTHUHAI, Anh Tú, Isaac, Rhyder',
        category: 'CONCERT',
        venue: 'Sân vận động Quốc gia Mỹ Đình',
        city: 'Hà Nội',
        bannerUrl:
          'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80',
        eventStartAt: '2026-10-24T19:00:00Z',
        minResalePrice: 1200000,
        totalAvailableListings: 18,
      },
      {
        eventId: 'fb-2',
        name: 'Mỹ Tâm Live Concert - Tri Âm Tour',
        artist: 'Mỹ Tâm',
        category: 'CONCERT',
        venue: 'Sân vận động Quân khu 7',
        city: 'TP. Hồ Chí Minh',
        bannerUrl:
          'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
        eventStartAt: '2026-11-15T19:30:00Z',
        minResalePrice: 850000,
        totalAvailableListings: 12,
      },
      {
        eventId: 'fb-3',
        name: 'Ravolution Music Festival 2026',
        artist: 'Armin van Buuren, KSHMR, Suboi',
        category: 'FESTIVAL',
        venue: 'Khu Đô Thị Sala, TP. Thủ Đức',
        city: 'TP. Hồ Chí Minh',
        bannerUrl:
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
        eventStartAt: '2026-12-05T15:00:00Z',
        minResalePrice: 650000,
        totalAvailableListings: 9,
      },
      {
        eventId: 'fb-4',
        name: 'Trận Derby: CLB Hà Nội vs CLB Viettel',
        artist: 'V-League 2026',
        category: 'SPORTS',
        venue: 'Sân vận động Hàng Đẫy',
        city: 'Hà Nội',
        bannerUrl:
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
        eventStartAt: '2026-09-22T19:00:00Z',
        minResalePrice: 200000,
        totalAvailableListings: 15,
      },
      {
        eventId: 'fb-5',
        name: 'Ngày Xửa Ngày Xưa 35: Cuộc Phiêu Lưu Kỳ Thú',
        artist: 'NSƯT Thành Lộc, Hữu Châu',
        category: 'THEATER',
        venue: 'Nhà hát Bến Thành',
        city: 'TP. Hồ Chí Minh',
        bannerUrl:
          'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1600&q=80',
        eventStartAt: '2026-09-20T19:00:00Z',
        minResalePrice: 450000,
        totalAvailableListings: 8,
      },
    ],
    []
  );

  // Combine backend trending events with fallback and live listing counts
  const overallEvents: TrendingEventDto[] = useMemo(() => {
    const base =
      trendingEventsData && trendingEventsData.length > 0
        ? trendingEventsData
        : FALLBACK_EVENTS;

    return base.map((evt) => {
      const matching = listings.filter(
        (l) =>
          l.eventName?.toLowerCase().includes(evt.name.toLowerCase()) ||
          evt.name.toLowerCase().includes((l.eventName || '').toLowerCase())
      );
      if (matching.length > 0) {
        const minPrice = Math.min(...matching.map((m) => m.resalePrice));
        return {
          ...evt,
          totalAvailableListings: matching.length,
          minResalePrice: minPrice,
        };
      }
      return evt;
    });
  }, [trendingEventsData, listings, FALLBACK_EVENTS]);

  const handleSelectEvent = (eventName: string) => {
    navigate(`/marketplace?q=${encodeURIComponent(eventName)}`);
  };

  const handleSelectCategory = (catId: string) => {
    navigate(`/marketplace?category=${encodeURIComponent(catId)}`);
  };

  const handleSelectArtist = (artistName: string) => {
    navigate(`/marketplace?q=${encodeURIComponent(artistName)}`);
  };

  const handleSelectCity = (cityId: string) => {
    navigate(`/marketplace?city=${encodeURIComponent(cityId)}`);
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F5] font-sans antialiased selection:bg-[#FF5A36] selection:text-white pt-24 sm:pt-28 pb-16">
      {/* Subtle ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute top-1/4 -right-24 w-[450px] h-[450px] bg-[#FF5A36]/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -left-24 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* 1. HERO TRENDING BANNER SLIDER (SỰ KIỆN NỔI BẬT) */}
        <TrendingBannerSlider onSelectEvent={handleSelectEvent} />

        {/* 2. SẮP DIỄN RA (2 TABS: TRONG 7 NGÀY TỚI & TRONG THÁNG NÀY) */}
        <UpcomingTabbedSection
          events={overallEvents}
          onSelectEvent={handleSelectEvent}
        />

        {/* 3. KHÁM PHÁ THEO THỂ LOẠI */}
        <CategoryTabbedSection
          events={overallEvents}
          onSelectEvent={handleSelectEvent}
        />

        {/* 4. NGHỆ SĨ ĐƯỢC YÊU THÍCH */}
        <FeaturedArtistsOrganizers onSelectArtist={handleSelectArtist} />

        {/* 5. KHÁM PHÁ THEO THÀNH PHỐ */}
        <CityBrowseSection onSelectCity={handleSelectCity} />

        {/* 6. CALL TO ACTION TO MARKETPLACE */}
        <div className="mt-12 mb-6 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0C1017] via-[#10141E] to-[#0C1017] border border-white/10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/30 text-xs font-mono font-bold text-[#FF5A36] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Sàn Giao Dịch Vé Chính Hãng
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight">
              Tìm thấy tấm vé yêu thích của bạn ngay hôm nay
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Mọi giao dịch đều được bảo vệ toàn diện: cấp lại vé chính chủ từ Ban tổ chức, nhận vé trước - thanh toán sau an toàn 100%.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 text-white font-bold font-display text-sm uppercase tracking-wider rounded-2xl shadow-[0_4px_25px_rgba(255,90,54,0.4)] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đến Sàn Giao Dịch Vé</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/sell-ticket')}
                className="w-full sm:w-auto h-12 px-8 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-bold text-sm rounded-2xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng bán vé của bạn</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
