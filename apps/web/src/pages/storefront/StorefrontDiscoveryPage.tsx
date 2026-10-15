import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { HorizontalEventCarousel } from '../../components/storefront/HorizontalEventCarousel';
import { STOREFRONT_EVENTS } from '../../data/storefrontCatalog';

export const StorefrontDiscoveryPage: React.FC = () => {
  // Live seconds countdown ticker
  const [seconds, setSeconds] = useState(48);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Auto-sliding Hero Carousel state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-sliding 10-events track state
  const [eventSlideIndex, setEventSlideIndex] = useState(0);

  const heroSlides = [
    {
      id: 'atsh-2026',
      stadium: 'SVĐ Quốc gia Mỹ Đình, Hà Nội • 19:30 - 29/03/2025',
      titleMain: 'ANH TRAI SAY HI',
      titleHighlight: 'LIVE CONCERT 2025',
      gradient: 'from-[#ffb4a8] via-[#ff5945] to-[#d0bcff]',
      description:
        'Đại nhạc hội bùng nổ nhất năm quy tụ 30 anh trai với hệ thống âm thanh vòm L-Acoustics K1 chuẩn quốc tế và hiệu ứng thị giác laser đa chiều lần đầu tiên xuất hiện tại Việt Nam.',
      bgImage: '/images/storefront/concert-hero.jpg',
      countdownDays: '02',
      countdownHours: '14',
      countdownMins: '23',
    },
    {
      id: 'vu-bao-tang-cua-nuoi-tiec',
      stadium: 'Trung tâm Hội nghị Quốc gia, Hà Nội • 20:00 - 22/04/2025',
      titleMain: 'VŨ. - BẢO TÀNG',
      titleHighlight: 'CỦA NUỐI TIẾC TOUR',
      gradient: 'from-[#d0bcff] via-[#4cd7f6] to-[#ffb4a8]',
      description:
        'Hành trình âm nhạc đánh dấu album mới nhất của "hoàng tử indie" Vũ. với những bản phối live cùng dàn nhạc thính phòng đặc biệt.',
      bgImage: '/images/storefront/gallery-finale.jpg',
      countdownDays: '05',
      countdownHours: '08',
      countdownMins: '45',
    },
    {
      id: 'hay-glamping-music-festival',
      stadium: 'Công viên Yên Sở, Hà Nội • 14:00 - 03/05/2025',
      titleMain: 'HAY GLAMPING',
      titleHighlight: 'MUSIC FESTIVAL 2025',
      gradient: 'from-[#4cd7f6] via-[#acedff] to-[#ff5945]',
      description:
        'Lễ hội âm nhạc dã ngoại kết hợp cắm trại ngoài trời lớn nhất mùa hè với hàng chục ban nhạc quốc tế và trải nghiệm ẩm thực Glamping độc quyền.',
      bgImage: '/images/storefront/festival.jpg',
      countdownDays: '14',
      countdownHours: '19',
      countdownMins: '10',
    },
    {
      id: 'mono-22-live-concert',
      stadium: 'Nhà thi đấu Nguyễn Du, TP.HCM • 19:30 - 18/05/2025',
      titleMain: 'MONO - 22',
      titleHighlight: 'LIVE CONCERT EXPERIENCE',
      gradient: 'from-[#ff5945] via-[#ffb4a8] to-[#4cd7f6]',
      description:
        'Chuyến lưu diễn solo bùng nổ của MONO tái hiện trọn vẹn album 22 với dàn dancer quốc tế và sân khấu visual LED vòng cung.',
      bgImage: '/images/storefront/concert-stage.jpg',
      countdownDays: '22',
      countdownHours: '11',
      countdownMins: '30',
    },
  ];

  // Auto-slide to the left every 4.5s
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  const nextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev <= 0 ? 59 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const genres = [
    { id: 'pop', label: '★ Pop / Ballad', color: 'text-[#ffb4a8]' },
    { id: 'rap', label: '⚡ Rap / Hip-Hop', color: 'text-[#4cd7f6]' },
    { id: 'edm', label: '🔊 EDM / Festival', color: 'text-[#d0bcff]' },
    { id: 'rock', label: '🎸 Rock / Indie', color: 'text-[#e1e1ed]' },
    { id: 'acoustic', label: '🎙 Acoustic Live Session', color: 'text-[#e3beb8]' },
  ];

  const dateFilters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'weekend', label: 'Cuối tuần này' },
    { id: 'apr2025', label: 'Tháng 04/2025' },
    { id: 'summer2025', label: 'Mùa hè 2025' },
  ];

  const normalizeSearch = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim();
  };

  const isFiltering = Boolean(
    searchQuery.trim() || selectedGenre || selectedDateFilter !== 'all' || selectedCity !== 'all'
  );

  // 100% active search & filter matching (supports Vietnamese accent & non-accent)
  const filteredEvents = STOREFRONT_EVENTS.filter((e) => {
    // 1. Text search query (title, venue, address, subtitle, tour, desc, organizer, artists)
    if (searchQuery.trim()) {
      const q = normalizeSearch(searchQuery);
      const matchTitle = normalizeSearch(e.title).includes(q);
      const matchVenue =
        normalizeSearch(e.venueName).includes(q) || normalizeSearch(e.venueAddress).includes(q);
      const matchSubtitle = normalizeSearch(e.subtitle).includes(q);
      const matchTour = normalizeSearch(e.tourName).includes(q);
      const matchDesc = normalizeSearch(e.description).includes(q);
      const matchOrg = normalizeSearch(e.organizerName).includes(q);
      const matchArtist = e.artists?.some((a) => normalizeSearch(a.name).includes(q));
      if (
        !matchTitle &&
        !matchVenue &&
        !matchSubtitle &&
        !matchTour &&
        !matchDesc &&
        !matchOrg &&
        !matchArtist
      ) {
        return false;
      }
    }

    // 2. City filter
    if (selectedCity !== 'all') {
      if (e.cityKey !== selectedCity) {
        return false;
      }
    }

    // 3. Date filter
    if (selectedDateFilter === 'weekend') {
      const isWeekend =
        e.dateDisplay.includes('Thứ Bảy') ||
        e.dateDisplay.includes('Chủ Nhật') ||
        e.dateDisplay.includes('Thứ Sáu');
      if (!isWeekend) return false;
    } else if (selectedDateFilter === 'apr2025') {
      if (!e.dateDisplay.includes('/04/2025')) return false;
    } else if (selectedDateFilter === 'summer2025') {
      const isSummer =
        e.dateDisplay.includes('/05/2025') ||
        e.dateDisplay.includes('/06/2025') ||
        e.dateDisplay.includes('/07/2025');
      if (!isSummer) return false;
    }

    // 4. Genre filter
    if (selectedGenre && e.genre !== selectedGenre) {
      return false;
    }

    return true;
  });

  // Maximum steps to slide through all 10 events (showing ~3-4 per screen)
  const maxSlideSteps = Math.max(0, filteredEvents.length - 3);

  // Auto-slide to the left every 3s
  useEffect(() => {
    if (isFiltering || maxSlideSteps === 0) return;
    const interval = setInterval(() => {
      setEventSlideIndex((prev) => (prev >= maxSlideSteps ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isFiltering, maxSlideSteps]);

  // Reset slide index when search/filter changes
  useEffect(() => {
    setEventSlideIndex(0);
  }, [searchQuery, selectedGenre, selectedDateFilter, selectedCity]);

  const scrollEventsLeft = () => {
    setEventSlideIndex((prev) => (prev <= 0 ? maxSlideSteps : prev - 1));
  };

  const scrollEventsRight = () => {
    setEventSlideIndex((prev) => (prev >= maxSlideSteps ? 0 : prev + 1));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre(null);
    setSelectedDateFilter('all');
    setSelectedCity('all');
    setEventSlideIndex(0);
  };

  return (
    <StorefrontLayout activeTab="kham-pha">
      {/* 1. AUTO-SLIDING HERO SHOWCASE (Tự động chuyển động lướt ngang qua trái) */}
      <section
        className="relative w-full -mt-20 overflow-hidden bg-[#0c0e16]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Floating Stage Light Blooms */}
        <div className="absolute -top-10 left-1/4 w-[600px] h-[600px] bg-[#571bc1]/35 rounded-full blur-[130px] pointer-events-none z-10" />
        <div className="absolute top-1/4 -right-10 w-[550px] h-[550px] bg-[#ff5945]/30 rounded-full blur-[140px] pointer-events-none z-10" />
        <div className="absolute bottom-6 left-1/3 w-[450px] h-[450px] bg-[#00a0bb]/25 rounded-full blur-[120px] pointer-events-none z-10" />

        {/* Sliding Slides Container - Translates to the Left */}
        <div
          className="flex transition-transform duration-700 ease-out w-full"
          style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
        >
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className="w-full shrink-0 min-w-full relative min-h-[540px] md:min-h-[560px] lg:min-h-[580px] flex items-center"
            >
              {/* Background Backdrop Image - Crystal clear, vivid colors */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-100 transform scale-100 transition-transform duration-1000 ease-out"
                style={{
                  backgroundImage: `url('${slide.bgImage}')`,
                  filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                }}
              />

              {/* Scrim: Darker gradient specifically on the left to make all text pop boldly */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c13]/95 via-[#0a0c13]/80 via-40% to-transparent pointer-events-none" />
              {/* Subtle top & bottom edge blends */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0c13]/85 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0e16] via-[#0c0e16]/60 to-transparent pointer-events-none" />

              {/* Slide Content */}
              <div className="relative z-20 w-full px-6 lg:px-14 pt-24 pb-12 lg:pt-28 lg:pb-14 flex flex-col gap-5 max-w-7xl mx-auto">
                {/* Headline - High Contrast, Bold, Ultra Clear */}
                <div className="max-w-3xl flex flex-col gap-2">
                  <p className="text-xs sm:text-sm md:text-base text-[#4cd7f6] uppercase tracking-widest font-bold flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
                    <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">stadium</span>
                    {slide.stadium}
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white uppercase font-black tracking-tight leading-[1.08] drop-shadow-[0_4px_18px_rgba(0,0,0,1)]">
                    <span className="text-white drop-shadow-[0_3px_12px_rgba(0,0,0,1)]">{slide.titleMain}</span> <br />
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.gradient} drop-shadow-[0_4px_20px_rgba(0,0,0,1)]`}>
                      {slide.titleHighlight}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-[#e5d0cd] max-w-2xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,1)] font-medium">
                    {slide.description}
                  </p>
                </div>

                {/* Action Row & Stage Countdown Ticker */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      to={`/storefront/event/${slide.id}`}
                      className="px-6 py-3 rounded-xl bg-[#ff5945] hover:bg-[#ff6c5b] text-white font-extrabold text-sm sm:text-base hover:shadow-[0_0_32px_rgba(255,89,69,0.6)] transition-all flex items-center gap-2.5 group active:scale-95 shadow-xl"
                    >
                      <span>Khám phá & Đặt vé ngay</span>
                      <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </Link>
                    <Link
                      to={`/storefront/event/${slide.id}/select-seat`}
                      className="px-5 py-3 rounded-xl bg-[#191b23]/90 hover:bg-[#282a32] text-white font-bold text-sm sm:text-base backdrop-blur-md transition-all flex items-center gap-2 border border-white/15 hover:border-white/30 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">play_circle</span>
                      <span>Trailer & Sơ đồ sân khấu</span>
                    </Link>
                  </div>

                  {/* Countdown Ticker */}
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#13151f]/95 backdrop-blur-xl shadow-2xl border border-white/10 w-fit">
                    <div className="flex items-center gap-1.5 text-[#ffb4a8]">
                      <span className="material-symbols-outlined text-[20px] animate-pulse text-[#ff5945]">timer</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#aa8984] font-bold">Mở bán sau</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-display text-base sm:text-lg font-black text-white">
                      <div className="flex flex-col items-center">
                        <span className="bg-[#282a32] px-2 py-0.5 rounded text-[#ffb4a8] shadow-inner">{slide.countdownDays}</span>
                        <span className="text-[9px] text-[#aa8984] font-normal">Ngày</span>
                      </div>
                      <span className="text-[#aa8984] pb-2">:</span>
                      <div className="flex flex-col items-center">
                        <span className="bg-[#282a32] px-2 py-0.5 rounded text-[#ffb4a8] shadow-inner">{slide.countdownHours}</span>
                        <span className="text-[9px] text-[#aa8984] font-normal">Giờ</span>
                      </div>
                      <span className="text-[#aa8984] pb-2">:</span>
                      <div className="flex flex-col items-center">
                        <span className="bg-[#282a32] px-2 py-0.5 rounded text-[#ffb4a8] shadow-inner">{slide.countdownMins}</span>
                        <span className="text-[9px] text-[#aa8984] font-normal">Phút</span>
                      </div>
                      <span className="text-[#aa8984] pb-2">:</span>
                      <div className="flex flex-col items-center">
                        <span className="bg-[#282a32] px-2 py-0.5 rounded text-[#4cd7f6] shadow-inner">
                          {seconds < 10 ? `0${seconds}` : seconds}
                        </span>
                        <span className="text-[9px] text-[#aa8984] font-normal">Giây</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Side Navigation Buttons */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-[#ff5945] text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-xl active:scale-95"
          aria-label="Sự kiện trước"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-[#ff5945] text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-xl active:scale-95"
          aria-label="Sự kiện tiếp theo"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
        </button>

        {/* Bottom Slide Indicators / Thumbnail Pills */}
        <div className="absolute bottom-3 left-0 right-0 z-30 flex items-center justify-center gap-2 px-4">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeSlideIndex === idx
                  ? 'w-10 bg-[#ff5945] shadow-[0_0_12px_rgba(255,89,69,0.7)]'
                  : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Chuyển tới slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. DISCOVERY SEARCH & FILTER DOCK (Sticky & 100% Functional) */}
      <section className="sticky top-20 z-40 w-full px-4 lg:px-12 py-3 bg-[#0c0e16]/95 backdrop-blur-2xl shadow-xl border-y border-[#33343d]/40">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input Container */}
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aa8984] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm concert, nghệ sĩ, lễ hội âm nhạc, sân vận động..."
              className="w-full h-11 pl-11 pr-28 rounded-xl bg-[#191b23] text-white text-xs placeholder:text-[#aa8984] border border-[#33343d]/40 focus:outline-none focus:border-[#ff5945] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-24 top-1/2 -translate-y-1/2 text-[#aa8984] hover:text-white transition-colors"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                isFiltering
                  ? 'bg-[#ff5945] text-white hover:bg-[#ff6c5b] shadow-md'
                  : 'bg-[#282a32] text-[#e3beb8] hover:text-white'
              }`}
            >
              {isFiltering ? 'Xóa lọc' : 'Tất cả'}
            </button>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {dateFilters.map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setSelectedDateFilter(df.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDateFilter === df.id
                    ? 'bg-[#ff5945] text-white shadow-[0_0_12px_rgba(255,89,69,0.3)]'
                    : 'bg-[#191b23] hover:bg-[#282a32] text-[#e3beb8]'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-1 bg-[#191b23] px-3 py-1.5 rounded-xl border border-[#33343d]/40 text-xs">
            <span className="material-symbols-outlined text-[#aa8984] text-[18px]">location_on</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-white border-none outline-none text-xs cursor-pointer"
            >
              <option value="all" className="bg-[#191b23]">Tất cả địa điểm</option>
              <option value="hcm" className="bg-[#191b23]">TP. Hồ Chí Minh (5)</option>
              <option value="hanoi" className="bg-[#191b23]">Hà Nội (3)</option>
              <option value="danang" className="bg-[#191b23]">Đà Nẵng & Hội An (2)</option>
            </select>
          </div>
        </div>

        {/* Genre Pills */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 pt-2.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] text-[#aa8984] uppercase tracking-wider shrink-0 mr-1 font-bold">
            Thể loại:
          </span>
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-all ${
                selectedGenre === g.id
                  ? 'bg-[#ff5945] text-white shadow-md'
                  : 'bg-[#1d1f28] hover:bg-[#282a32] text-[#e1e1ed]'
              }`}
            >
              <span className={selectedGenre === g.id ? 'text-white' : g.color}>{g.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. SECTION: SỰ KIỆN NỔI BẬT & ĐANG BÁN CHẠY (AUTO-SLIDING HORIZONTAL CAROUSEL ~10 CONCERT) */}
      <section id="featured-events" className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[#ff5945]">
                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                <span className="text-xs uppercase tracking-widest font-bold">Cháy vé nhanh nhất</span>
              </span>
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Sự kiện nổi bật & Đang bán chạy
            </h2>
          </div>

          {/* Controls: Chuyển trang xem toàn bộ sự kiện & Carousel Manual Controls */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/storefront/events"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-md border bg-[#191b23] hover:bg-[#ff5945] text-[#ffb4a8] hover:text-white border-[#33343d]/60 hover:shadow-[0_0_18px_rgba(255,89,69,0.4)]"
            >
              <span>Xem toàn bộ sự kiện</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>

            <button
              type="button"
              onClick={scrollEventsLeft}
              className="w-10 h-10 rounded-full bg-[#191b23] hover:bg-[#ff5945] text-white flex items-center justify-center border border-[#33343d]/60 transition-all shadow-md active:scale-95"
              aria-label="Cuộn sang trái"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={scrollEventsRight}
              className="w-10 h-10 rounded-full bg-[#191b23] hover:bg-[#ff5945] text-white flex items-center justify-center border border-[#33343d]/60 transition-all shadow-md active:scale-95"
              aria-label="Cuộn sang phải"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        {isFiltering && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#191b23]/90 border border-[#ff5945]/30 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-[#e5d0cd]">
              <span className="material-symbols-outlined text-[#ff5945] text-[18px]">filter_list</span>
              <span>
                Tìm thấy <strong className="text-white font-bold">{filteredEvents.length}</strong> concert phù hợp
                {searchQuery && (
                  <span> với từ khóa "<strong className="text-[#ffb4a8]">{searchQuery}</strong>"</span>
                )}
                {selectedGenre && (
                  <span> • Thể loại: <strong className="text-[#4cd7f6]">{selectedGenre.toUpperCase()}</strong></span>
                )}
                {selectedCity !== 'all' && (
                  <span> • Khu vực: <strong className="text-[#d0bcff]">{selectedCity.toUpperCase()}</strong></span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#ffb4a8] hover:text-white underline font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Empty State when no events match */}
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl bg-[#191b23]/60 border border-[#33343d]/40 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#ff5945]/15 text-[#ff5945] flex items-center justify-center border border-[#ff5945]/30">
              <span className="material-symbols-outlined text-[36px]">search_off</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-white">Không tìm thấy concert phù hợp</h3>
              <p className="text-sm text-[#aa8984] max-w-md mx-auto">
                Không có sự kiện nào khớp với tiêu chí tìm kiếm hiện tại. Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-xl bg-[#ff5945] text-white text-xs font-bold hover:shadow-[0_0_20px_rgba(255,89,69,0.5)] transition-all"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : (
          /* Auto-Sliding Horizontal Track (10 Concerts moving to the left via CSS translate) */
          <div className="overflow-hidden w-full relative py-3">
            <div
              className="flex items-stretch gap-5 transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(-${eventSlideIndex * 335}px)`,
              }}
            >
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="w-[285px] sm:w-[315px] shrink-0 group relative flex flex-col rounded-2xl overflow-hidden bg-[#191b23] border border-[#33343d]/40 hover:-translate-y-1.5 transition-all duration-300 shadow-xl hover:shadow-[0_0_32px_-8px_rgba(255,89,69,0.35)]"
                >
                  {/* Poster Graphic */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#282a32]">
                    <img
                      src={event.posterImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#191b23] via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md bg-[#ff5945]/25 text-[#ffb4a8] text-[10px] uppercase font-bold tracking-wide backdrop-blur-md border border-[#ff5945]/30 flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5945] animate-ping" />
                        {event.tagBadge || 'Còn vé'}
                      </span>
                      <button
                        type="button"
                        className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-md"
                        aria-label="Lưu sự kiện"
                      >
                        <span className="material-symbols-outlined text-[18px]">bookmark</span>
                      </button>
                    </div>

                    {/* Price Sticker */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#0c0e16]/90 backdrop-blur-md border border-white/10 shadow-lg">
                      <span className="text-[10px] text-[#aa8984]">Từ</span>
                      <span className="text-xs sm:text-sm text-[#ffb4a8] font-bold ml-1">
                        {event.minPrice.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-[#4cd7f6] flex items-center gap-1 font-mono font-semibold">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {event.dateDisplay} • {event.timeDisplay}
                      </span>
                      <h3 className="font-display font-bold text-base text-white group-hover:text-[#ffb4a8] transition-colors line-clamp-1 leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs text-[#aa8984] flex items-center gap-1 line-clamp-1">
                        <span className="material-symbols-outlined text-[16px] text-[#aa8984] shrink-0">pin_drop</span>
                        {event.venueName}
                      </p>
                    </div>

                    <div className="pt-2.5 flex items-center justify-between border-t border-[#33343d]/30">
                      <div className="flex items-center gap-1 text-[#d0bcff] text-xs font-semibold">
                        <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">verified_user</span>
                        <span>Vé chính chủ</span>
                      </div>
                      <Link
                        to={`/storefront/event/${event.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-[#282a32] group-hover:bg-[#ff5945] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. SECTION: SẮP DIỄN RA TRONG TUẦN (HORIZONTAL CAROUSEL SLIDER) */}
      <HorizontalEventCarousel />

      {/* 5. SECTION: VÉ RESALE ĐƯỢC XÁC THỰC BỞI TICKETSHIELD (CYBER-ESCROW SPOTLIGHT) */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1d1f28] via-[#191b23] to-[#0c0e16] p-6 lg:p-12 shadow-2xl border border-[#33343d]/40">
          {/* Ambient Glows */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#571bc1]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-[#00a0bb]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left Guarantee Pillars */}
            <div className="flex flex-col gap-4 max-w-xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#571bc1]/30 text-[#d0bcff] w-fit text-xs uppercase tracking-wider font-bold border border-[#571bc1]/40">
                <span className="material-symbols-outlined text-[18px]">gshield</span>
                Hệ thống Cyber-Escrow độc quyền
              </div>

              <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                Chợ vé Resale minh bạch, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d0bcff] via-[#4cd7f6] to-[#ff5945]">
                  Chống lừa đảo & Đội giá 100%
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#e3beb8] leading-relaxed">
                Bạn lỡ hẹn mở bán chính thức? Yên tâm tìm mua vé sang nhượng từ người hâm mộ khác. Tiền chỉ được chuyển giao cho người bán sau khi bạn đã check-in thành công qua cửa quét mã của ban tổ chức.
              </p>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#282a32]/60 backdrop-blur-md border border-[#33343d]/40">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[24px]">verified</span>
                  <span className="text-xs text-white font-bold">Mã vé chuẩn gốc</span>
                  <span className="text-[11px] text-[#aa8984]">Xác thực tự động qua API nhà phát hành.</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#282a32]/60 backdrop-blur-md border border-[#33343d]/40">
                  <span className="material-symbols-outlined text-[#ff5945] text-[24px]">price_check</span>
                  <span className="text-xs text-white font-bold">Trần giá công bằng</span>
                  <span className="text-[11px] text-[#aa8984]">Không cho phép phe vé độn giá quá +15%.</span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#282a32]/60 backdrop-blur-md border border-[#33343d]/40">
                  <span className="material-symbols-outlined text-[#d0bcff] text-[24px]">lock_clock</span>
                  <span className="text-xs text-white font-bold">Giữ tiền Escrow</span>
                  <span className="text-[11px] text-[#aa8984]">Hoàn 100% tiền ngay lập tức nếu có sự cố.</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Link
                  to="/marketplace"
                  className="px-6 py-3 rounded-xl bg-[#571bc1] hover:bg-[#6c28e8] text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#571bc1]/30 active:scale-95"
                >
                  <span>Vào Chợ vé Marketplace</span>
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                </Link>
                <Link
                  to="/sell-ticket"
                  className="text-xs text-[#aa8984] hover:text-white transition-colors flex items-center gap-1 font-semibold"
                >
                  <span>Đăng bán vé của bạn</span>
                  <span className="material-symbols-outlined text-[16px]">north_east</span>
                </Link>
              </div>
            </div>

            {/* Visual Live Ticket Stub Mockup on Right */}
            <div className="w-full lg:w-96 flex flex-col rounded-2xl overflow-hidden bg-[#282a32]/90 backdrop-blur-xl shadow-2xl border border-[#33343d]/50">
              {/* Stub Header */}
              <div className="p-4 bg-[#33343d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">format_image_left</span>
                  <span className="text-xs uppercase tracking-wider text-white font-bold">Verified Ticket Pass</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#00a0bb]/30 text-[#4cd7f6] text-[10px] font-mono font-bold">
                  ESCROW READY
                </span>
              </div>

              {/* Stub Body */}
              <div className="p-5 flex flex-col gap-3">
                <span className="text-xs text-[#ff5945] uppercase tracking-widest font-bold">
                  VIP ZONE A1 • GHẾ VIP-108
                </span>
                <h4 className="font-display font-bold text-base text-white leading-snug">
                  SOOBIN - THE FIRST LIVE CONCERT: BẬT NÓC NHÀ
                </h4>
                <div className="flex items-center justify-between text-xs text-[#aa8984] pt-1">
                  <span>Người bán: <strong className="text-white">tuan_anh_9x</strong> (★ 4.9)</span>
                  <span className="text-[#4cd7f6] font-semibold">Đã xác minh CCCD</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#191b23]">
                  <span className="text-xs text-[#aa8984]">Giá chuyển nhượng:</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-bold text-base text-[#ff5945]">1.850.000₫</span>
                    <span className="text-[11px] text-[#aa8984] line-through">Gốc: 1.800.000₫</span>
                  </div>
                </div>
              </div>

              {/* Perforation Dashed Line with Circular Cuts */}
              <div className="relative w-full flex items-center justify-between px-2">
                <div className="w-4 h-8 bg-[#11131b] rounded-r-full -ml-4" />
                <div className="flex-1 border-t-2 border-dashed border-[#33343d] mx-2" />
                <div className="w-4 h-8 bg-[#11131b] rounded-l-full -mr-4" />
              </div>

              {/* Stub Barcode */}
              <div className="p-5 flex flex-col items-center gap-2 bg-[#282a32]/60">
                <div className="w-full h-10 flex items-center justify-between gap-1 px-4 py-1 bg-white rounded-lg">
                  <div className="w-1.5 h-full bg-[#0c0e16]" />
                  <div className="w-0.5 h-full bg-[#0c0e16]" />
                  <div className="w-2 h-full bg-[#0c0e16]" />
                  <div className="w-1 h-full bg-[#0c0e16]" />
                  <div className="w-3 h-full bg-[#0c0e16]" />
                  <div className="w-0.5 h-full bg-[#0c0e16]" />
                  <div className="w-2 h-full bg-[#0c0e16]" />
                  <div className="w-1.5 h-full bg-[#0c0e16]" />
                  <div className="w-0.5 h-full bg-[#0c0e16]" />
                  <div className="w-2 h-full bg-[#0c0e16]" />
                  <div className="w-1 h-full bg-[#0c0e16]" />
                  <div className="w-3 h-full bg-[#0c0e16]" />
                </div>
                <span className="text-[10px] text-[#aa8984] font-mono tracking-widest uppercase">
                  MÃ CHECK-IN KHÓA ĐẾN GIỜ GIAO NHẬN
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
};
