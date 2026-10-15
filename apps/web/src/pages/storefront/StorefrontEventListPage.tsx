import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { STOREFRONT_EVENTS, StorefrontEvent } from '../../data/storefrontCatalog';

const normalizeSearch = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

export const StorefrontEventListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  // Genre definitions
  const genres = [
    { id: 'all', label: 'Tất cả thể loại', icon: 'apps' },
    { id: 'pop', label: 'Pop & Ballad', icon: 'mic' },
    { id: 'rap', label: 'Rap / Hip-Hop', icon: 'graphic_eq' },
    { id: 'edm', label: 'EDM & Festival', icon: 'speaker' },
    { id: 'rock', label: 'Rock & Indie', icon: 'electric_bolt' },
    { id: 'acoustic', label: 'Acoustic / Live', icon: 'piano' },
  ];

  // Distinct organizers
  const organizers = useMemo(() => {
    const orgs = Array.from(new Set(STOREFRONT_EVENTS.map((e) => e.organizerName)));
    return [{ id: 'all', label: 'Tất cả ban tổ chức' }, ...orgs.map((o) => ({ id: o, label: o }))];
  }, []);

  // Filter & Sort
  const filteredEvents = useMemo(() => {
    let result = STOREFRONT_EVENTS.filter((e) => {
      // 1. Text search
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

        if (!matchTitle && !matchVenue && !matchSubtitle && !matchTour && !matchDesc && !matchOrg && !matchArtist) {
          return false;
        }
      }

      // 2. Genre
      if (selectedGenre !== 'all' && e.genre !== selectedGenre) {
        return false;
      }

      // 3. City
      if (selectedCity !== 'all' && e.cityKey !== selectedCity) {
        return false;
      }

      // 4. Organizer
      if (selectedOrganizer !== 'all' && e.organizerName !== selectedOrganizer) {
        return false;
      }

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return a.minPrice - b.minPrice;
      if (sortBy === 'price-desc') return b.minPrice - a.minPrice;
      if (sortBy === 'name') return a.title.localeCompare(b.title, 'vi');
      // Default: featured first
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });

    return result;
  }, [searchQuery, selectedGenre, selectedCity, selectedOrganizer, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedCity('all');
    setSelectedOrganizer('all');
    setSortBy('featured');
  };

  const isFiltering =
    Boolean(searchQuery.trim()) ||
    selectedGenre !== 'all' ||
    selectedCity !== 'all' ||
    selectedOrganizer !== 'all' ||
    sortBy !== 'featured';

  return (
    <StorefrontLayout>
      <div className="min-h-screen pb-24">
        {/* HERO / BANNER HEADER */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#191b23] via-[#11131b] to-[#11131b] border-b border-[#33343d]/40 pt-10 pb-12">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff5945]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 lg:px-12 relative z-10 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#aa8984]">
              <Link to="/storefront" className="hover:text-white transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Trang chủ Storefront</span>
              </Link>
              <span>/</span>
              <span className="text-[#ffb4a8] font-semibold">Tất cả sự kiện & Đại nhạc hội</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5945]/15 border border-[#ff5945]/30 text-[#ffb4a8] text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#ff5945] animate-pulse" />
                Cổng phát hành vé chính thức từ Ban Tổ Chức
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                Tất cả sự kiện & Đại nhạc hội
              </h1>
              <p className="text-sm sm:text-base text-[#aa8984] leading-relaxed">
                Khám phá và đặt vé trực tiếp cho toàn bộ live concert, festival âm nhạc và tour diễn đỉnh cao toàn quốc.
                Bảo chứng 100% vé gốc phát hành với công nghệ chống vé giả Cyber-Escrow.
              </p>
            </div>

            {/* Feature Highlights Pills */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#e1e1ed]">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b23] border border-[#33343d]/60">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">verified</span>
                <span>100% Vé gốc từ BTC</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b23] border border-[#33343d]/60">
                <span className="material-symbols-outlined text-[#ff5945] text-[18px]">qr_code_2</span>
                <span>Mã QR vé Dynamic chống chụp màn hình</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#191b23] border border-[#33343d]/60">
                <span className="material-symbols-outlined text-[#d0bcff] text-[18px]">shield</span>
                <span>Cyber-Escrow bảo vệ giao dịch</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH, FILTER & CONTROLS DOCK */}
        <section className="sticky top-20 z-40 bg-[#0c0e16]/95 backdrop-blur-xl border-b border-[#33343d]/50 shadow-2xl py-4">
          <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aa8984] text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên concert, ca sĩ, ban nhạc, địa điểm..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#191b23] border border-[#33343d]/60 text-white placeholder-[#aa8984] text-xs sm:text-sm focus:outline-none focus:border-[#ff5945] focus:ring-1 focus:ring-[#ff5945] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aa8984] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Dropdowns (City, Organizer, Sort) */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* City select */}
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#191b23] border border-[#33343d]/60 text-white text-xs font-semibold focus:outline-none focus:border-[#ff5945] cursor-pointer"
                >
                  <option value="all">Tất cả thành phố</option>
                  <option value="hcm">TP. Hồ Chí Minh</option>
                  <option value="hanoi">Hà Nội</option>
                  <option value="danang">Đà Nẵng</option>
                </select>

                {/* Organizer select */}
                <select
                  value={selectedOrganizer}
                  onChange={(e) => setSelectedOrganizer(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-[#191b23] border border-[#33343d]/60 text-white text-xs font-semibold focus:outline-none focus:border-[#ff5945] cursor-pointer max-w-[160px] truncate"
                >
                  {organizers.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.label}
                    </option>
                  ))}
                </select>

                {/* Sort by */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl bg-[#191b23] border border-[#33343d]/60 text-white text-xs font-semibold focus:outline-none focus:border-[#ff5945] cursor-pointer"
                >
                  <option value="featured">Nổi bật nhất</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                  <option value="name">Tên sự kiện (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Genre Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {genres.map((g) => {
                const isActive = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenre(g.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#ff5945] text-white shadow-[0_0_12px_rgba(255,89,69,0.4)]'
                        : 'bg-[#191b23] hover:bg-[#282a32] text-[#aa8984] hover:text-white border border-[#33343d]/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* MAIN EVENTS GRID SECTION */}
        <section className="max-w-7xl mx-auto px-4 lg:px-12 pt-8 space-y-6">
          {/* Active summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#191b23]/80 border border-[#33343d]/40">
            <div className="flex items-center gap-2 text-xs text-[#e1e1ed]">
              <span className="material-symbols-outlined text-[#ff5945] text-[18px]">event</span>
              <span>
                Hiển thị <strong className="text-white font-bold">{filteredEvents.length}</strong> sự kiện / đại nhạc hội
                {isFiltering && <span className="text-[#aa8984]"> (đang áp dụng bộ lọc)</span>}
              </span>
            </div>

            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#ffb4a8] hover:text-white font-semibold flex items-center gap-1 underline transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Đặt lại tất cả bộ lọc
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-3xl bg-[#191b23]/60 border border-[#33343d]/40 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ff5945]/15 text-[#ff5945] flex items-center justify-center border border-[#ff5945]/30">
                <span className="material-symbols-outlined text-[36px]">search_off</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-white">Không tìm thấy sự kiện nào</h3>
                <p className="text-sm text-[#aa8984] max-w-md mx-auto">
                  Không có sự kiện nào khớp với tiêu chí tìm kiếm hiện tại. Hãy thử từ khóa khác hoặc xóa các bộ lọc đang chọn.
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
            /* Events Grid: 4 Columns on XL */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#191b23] border border-[#33343d]/50 hover:border-[#ff5945]/60 hover:-translate-y-1.5 transition-all duration-300 shadow-xl hover:shadow-[0_0_32px_-8px_rgba(255,89,69,0.35)]"
                >
                  {/* Poster Graphic */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#282a32]">
                    <img
                      src={event.posterImage}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#191b23] via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md bg-[#ff5945]/30 text-[#ffb4a8] text-[10px] uppercase font-bold tracking-wide backdrop-blur-md border border-[#ff5945]/40 flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5945] animate-ping" />
                        {event.tagBadge || 'Còn vé'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10">
                        {event.organizerName}
                      </span>
                    </div>

                    {/* Price Tag Sticker */}
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-[#0c0e16]/90 backdrop-blur-md border border-white/10 shadow-lg">
                      <span className="text-[10px] text-[#aa8984]">Từ</span>
                      <span className="text-xs sm:text-sm text-[#ffb4a8] font-bold ml-1">
                        {event.minPrice.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[11px] text-[#4cd7f6] font-mono font-semibold">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span>{event.dateDisplay}</span>
                        <span>•</span>
                        <span>{event.timeDisplay}</span>
                      </div>

                      <h2 className="font-display font-bold text-base text-white group-hover:text-[#ffb4a8] transition-colors line-clamp-2 leading-snug">
                        {event.title}
                      </h2>

                      <p className="text-xs text-[#aa8984] line-clamp-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-[#aa8984] shrink-0">pin_drop</span>
                        <span>{event.venueName}</span>
                      </p>

                      <p className="text-[11px] text-[#8e9099] line-clamp-2 leading-relaxed">
                        {event.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-[#33343d]/40">
                      <div className="flex items-center gap-1 text-[#d0bcff] text-xs font-semibold">
                        <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">verified_user</span>
                        <span>Vé chính hãng</span>
                      </div>
                      <Link
                        to={`/storefront/event/${event.id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#282a32] group-hover:bg-[#ff5945] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
                      >
                        <span>Đặt vé</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ORGANIZER PARTNER CALLOUT BANNER */}
        <section className="max-w-7xl mx-auto px-4 lg:px-12 mt-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#191b23] via-[#22242e] to-[#191b23] border border-[#33343d]/60 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase tracking-widest text-[#ff5945] font-bold">
                Dành cho Đơn vị Tổ Chức & Nghệ sĩ
              </span>
              <h2 className="font-display font-bold text-2xl text-white">
                Muốn phát hành vé concert trên TicketShield?
              </h2>
              <p className="text-xs sm:text-sm text-[#aa8984] leading-relaxed">
                Tích hợp giải pháp bán vé gốc trực tiếp, kiểm soát phe vé 100% bằng cơ chế mã hóa Dynamic QR,
                phí sàn minh bạch và đối soát doanh thu tự động.
              </p>
            </div>
            <Link
              to="/organizer"
              className="shrink-0 px-6 py-3 rounded-xl bg-[#ff5945] hover:bg-[#e04330] text-white font-bold text-sm transition-all shadow-[0_0_24px_rgba(255,89,69,0.35)] active:scale-95 flex items-center gap-2"
            >
              <span>Mở cổng bán vé ngay</span>
              <span className="material-symbols-outlined text-[18px]">launch</span>
            </Link>
          </div>
        </section>
      </div>
    </StorefrontLayout>
  );
};
