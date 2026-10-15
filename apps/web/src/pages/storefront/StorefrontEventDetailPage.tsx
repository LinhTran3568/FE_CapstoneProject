import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { getStorefrontEventById } from '../../data/storefrontCatalog';

export const StorefrontEventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const event = getStorefrontEventById(eventId);
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <StorefrontLayout activeTab="kham-pha">
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative w-full -mt-20 overflow-hidden bg-[#0c0e16]">
        {/* Cinematic Concert Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-screen opacity-55 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('${event.bannerImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#11131b] via-[#11131b]/70 to-[#0c0e16]/80" />
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#ff5945]/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-[32rem] h-[32rem] bg-[#571bc1]/30 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-4 lg:px-12 pt-32 pb-12 flex flex-col justify-end min-h-[820px]">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff5945]/20 text-[#ffb4a8] border border-[#ffb4a8]/25 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#ff5945] animate-ping" />
              <span className="font-bold uppercase tracking-wider">Live Concert 2025</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#00a0bb]/20 text-[#4cd7f6] border border-[#4cd7f6]/20 text-xs">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="font-semibold uppercase tracking-wider">Xác thực bởi TicketShield Guard</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#282a32]/80 text-[#e3beb8] backdrop-blur-md text-xs">
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
              <span className="font-semibold uppercase tracking-wider">{event.organizerBadge}</span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2 max-w-4xl">
            <span className="text-xs uppercase tracking-[0.25em] text-[#d0bcff] font-bold">
              {event.tourName}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase font-extrabold text-white drop-shadow-2xl leading-none">
              {event.title}
            </h1>
            <p className="text-base sm:text-lg text-[#aa8984] font-medium tracking-tight mt-2">
              Chặng dừng chân bùng nổ: {event.venueName} — {event.venueAddress}
            </p>
          </div>

          {/* Key Metadata Floating Bar */}
          <div className="mt-8 p-4 lg:p-6 rounded-2xl bg-[#1d1f28]/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center shrink-0 text-[#ff5945]">
                <span className="material-symbols-outlined text-[24px]">calendar_clock</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#aa8984] uppercase tracking-wider">Thời gian</span>
                <span className="font-bold text-white text-sm truncate">{event.dateDisplay}</span>
                <span className="text-xs text-[#4cd7f6]">{event.timeDisplay}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center shrink-0 text-[#ff5945]">
                <span className="material-symbols-outlined text-[24px]">stadium</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#aa8984] uppercase tracking-wider">Địa điểm</span>
                <span className="font-bold text-white text-sm truncate">{event.venueName}</span>
                <span className="text-xs text-[#aa8984] truncate">{event.venueAddress}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center shrink-0 text-[#4cd7f6]">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#aa8984] uppercase tracking-wider">Mức giá niêm yết</span>
                <span className="font-bold text-white text-sm truncate">
                  {event.minPrice.toLocaleString('vi-VN')}₫ - {event.maxPrice.toLocaleString('vi-VN')}₫
                </span>
                <span className="text-xs text-[#aa8984]">Bảo hiểm hoàn tiền 100%</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center shrink-0 text-[#d0bcff]">
                <span className="material-symbols-outlined text-[24px]">local_activity</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#aa8984] uppercase tracking-wider">Tình trạng vé</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff5945] animate-pulse" />
                  <span className="text-sm font-bold text-[#ffb4a8]">Mở bán chính thức</span>
                </div>
                <span className="text-xs text-[#aa8984]">Chỉ còn 18% lượt mua VIP</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              to={`/storefront/event/${event.id}/select-seat`}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#ff5945] hover:bg-[#ff7252] text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_36px_rgba(255,89,69,0.45)] group"
            >
              <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">
                confirmation_number
              </span>
              <span className="tracking-wide">CHỌN HẠNG VÉ & MUA NGAY</span>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#282a32]/60 hover:bg-[#33343d] backdrop-blur-md text-white text-sm font-semibold transition-all group"
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-colors ${
                  isFavorite ? 'text-[#ff5945]' : 'text-[#aa8984] group-hover:text-[#ff5945]'
                }`}
              >
                {isFavorite ? 'favorite' : 'favorite_border'}
              </span>
              <span>{isFavorite ? 'Đã lưu yêu thích' : 'Lưu vào yêu thích'}</span>
            </button>

            <div className="hidden xl:flex items-center gap-2 ml-auto text-xs text-[#aa8984]">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">lock</span>
              <span>Bảo vệ quyền giao dịch trực tuyến qua TicketShield Cyber-Escrow</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LINEUP SHOWCASE */}
      {event.artists && event.artists.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-16 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs text-[#d0bcff] uppercase tracking-[0.2em] font-bold">
                Official All-Star Lineup
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mt-1">
                DÀN NGHỆ SĨ TRÌNH DIỄN
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#aa8984] max-w-md">
              Hội tụ hơn 30 nghệ sĩ giải trí hàng đầu Việt Nam, mang đến màn kết hợp đa vũ trụ âm nhạc thị giác đỉnh cao độc quyền.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {event.artists.map((artist, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl overflow-hidden bg-[#191b23] border border-[#33343d]/40 transition-all duration-300 hover:-translate-y-1.5 shadow-lg hover:shadow-[0_0_24px_-4px_rgba(255,89,69,0.3)]"
              >
                <div className="aspect-[3/4] w-full overflow-hidden relative">
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16] via-[#0c0e16]/30 to-transparent" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#ff5945] text-white text-[10px] font-bold font-mono">
                    {artist.tag}
                  </span>
                </div>
                <div className="p-3 flex flex-col">
                  <span className="font-display font-bold text-sm text-white group-hover:text-[#ffb4a8] transition-colors truncate">
                    {artist.name}
                  </span>
                  <span className="text-[11px] text-[#aa8984] truncate">{artist.role}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-[#191b23] border border-[#33343d]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#d0bcff] text-[20px]">auto_awesome</span>
              <span className="text-[#e3beb8]">
                Cùng dàn khách mời đặc biệt: Đức Phúc, Erik, Isaac, Song Luân, Captain Boy và hơn 20 vũ đoàn danh tiếng.
              </span>
            </div>
            <span className="text-[#4cd7f6] uppercase tracking-wider font-bold shrink-0 font-mono">
              30+ Tiết Mục Sân Khấu
            </span>
          </div>
        </section>
      )}

      {/* 3. PRODUCTION & STAGE CONCEPT */}
      <section className="w-full bg-[#191b23] border-y border-[#33343d]/30 py-16 my-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[#ff5945] text-xs uppercase tracking-widest font-bold">
              <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
              <span>Tiêu Chuẩn Sản Xuất Quốc Tế</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
              SÂN KHẤU 360 ĐỘ KHÔNG GIAN KẾT NỐI VÔ CỰC
            </h2>
            <p className="text-sm text-[#aa8984] leading-relaxed">
              Được thiết kế bởi đạo diễn âm nhạc hàng đầu, <strong className="text-white">{event.title}</strong> phá vỡ mọi giới hạn về trải nghiệm nghe nhìn tại Việt Nam. Hệ thống âm thanh vòm ma trận <strong className="text-[#4cd7f6]">d&b audiotechnik KSL System</strong> phủ trọn vẹn từng thính giác tại {event.venueName}.
            </p>

            {/* Metric Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#1d1f28] border border-white/5 flex flex-col">
                <span className="font-display font-extrabold text-3xl text-[#ff5945]">360°</span>
                <span className="font-bold text-white text-sm mt-1">Sân khấu mở</span>
                <span className="text-xs text-[#aa8984] mt-1">Tầm nhìn mãn nhãn từ mọi khán đài Tribune và GA.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1d1f28] border border-white/5 flex flex-col">
                <span className="font-display font-extrabold text-3xl text-[#d0bcff]">180'</span>
                <span className="font-bold text-white text-sm mt-1">3 giờ trình diễn</span>
                <span className="text-xs text-[#aa8984] mt-1">Hơn 30 ca khúc phối khí mới, choreography độc quyền.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1d1f28] border border-white/5 flex flex-col">
                <span className="font-display font-extrabold text-3xl text-[#4cd7f6]">40K+</span>
                <span className="font-bold text-white text-sm mt-1">Biển Lightstick</span>
                <span className="text-xs text-[#aa8984] mt-1">Đồng bộ tín hiệu tần số sóng RF theo từng nhịp beat.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#1d1f28] shadow-2xl border border-white/10">
              <img
                src={event.stageLayoutImage}
                alt="Sân khấu 360 độ"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#282a32]/85 backdrop-blur-xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00a0bb]/30 text-[#4cd7f6] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">surround_sound</span>
                </div>
                <div className="flex flex-col min-w-0 text-xs">
                  <span className="font-bold text-white">Công nghệ Dolby Atmos Live</span>
                  <span className="text-[#aa8984] truncate">Âm thanh nguyên bản chuẩn phòng thu trên quy mô sân vận động.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CINEMATIC GALLERY */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-16 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-[#ff5945] uppercase tracking-[0.2em] font-bold">
              Atmosphere & Visuals
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mt-1">
              KHOẢNH KHẮC ĐỈNH CAO
            </h2>
          </div>
          <span className="text-xs text-[#aa8984]">
            Những hình ảnh rực cháy từ đêm tổng duyệt và các trạm tour tiền nhiệm.
          </span>
        </div>

        {/* Asymmetric Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 rounded-2xl overflow-hidden relative group aspect-[16/10] bg-[#1d1f28] border border-white/10">
            <img
              src="/images/storefront/gallery-finale.jpg"
              alt="Finale confetti"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/90 via-transparent to-transparent flex items-end p-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#ff5945] font-bold">
                  Cơn mưa kim tuyến Finale
                </span>
                <p className="text-sm sm:text-base font-bold text-white">
                  Khoảnh khắc gắn kết của hơn 40.000 khán giả chung nhịp đập
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-2xl overflow-hidden relative group aspect-[16/10] md:aspect-auto bg-[#1d1f28] border border-white/10">
            <img
              src="/images/storefront/gallery-fire.jpg"
              alt="Pyrotechnics FX"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/90 via-transparent to-transparent flex items-end p-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#d0bcff] font-bold">
                  Pyrotechnics FX
                </span>
                <p className="text-sm sm:text-base font-bold text-white">
                  Hệ thống hiệu ứng lửa và pháo sáng chuẩn quốc tế
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 rounded-2xl overflow-hidden relative group aspect-[4/3] bg-[#1d1f28] border border-white/10">
            <img
              src="/images/storefront/gallery-lasers.jpg"
              alt="Laser 3D Mapping"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/90 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs sm:text-sm font-bold text-white">Công nghệ Laser 3D Mapping</span>
            </div>
          </div>

          <div className="md:col-span-4 rounded-2xl overflow-hidden relative group aspect-[4/3] bg-[#1d1f28] border border-white/10">
            <img
              src="/images/storefront/gallery-sing.jpg"
              alt="Interaction"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/90 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs sm:text-sm font-bold text-white">Tương tác trực tiếp không rào cản</span>
            </div>
          </div>

          <div className="md:col-span-4 rounded-2xl overflow-hidden relative group aspect-[4/3] bg-[#1d1f28] border border-white/10">
            <img
              src="/images/storefront/gallery-lightsticks.jpg"
              alt="DMX Lightstick"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e16]/90 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs sm:text-sm font-bold text-white">Đồng bộ Lightstick DMX</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VENUE INFORMATION & STADIUM GATES */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-16">
        <div className="p-6 lg:p-10 rounded-3xl bg-[#191b23] border border-[#33343d]/40 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[#4cd7f6] text-xs uppercase tracking-wider font-bold mb-1">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span>Sơ đồ chỉ dẫn sân vận động</span>
                </div>
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase">
                  {event.venueName}
                </h2>
                <p className="text-xs sm:text-sm text-[#aa8984] mt-1">{event.venueAddress}</p>
              </div>

              {/* Gates Architecture */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#1d1f28] border border-white/5">
                  <div className="flex items-center gap-1.5 text-[#ff5945] font-bold text-xs mb-1">
                    <span className="material-symbols-outlined text-[18px]">stars</span>
                    <span>CỔNG 1 (VIP)</span>
                  </div>
                  <p className="text-xs text-[#aa8984] leading-relaxed">
                    Dành riêng cho vé Diamond VIP, SVIP Lounge & Lối đi Soundcheck độc quyền.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#1d1f28] border border-white/5">
                  <div className="flex items-center gap-1.5 text-[#d0bcff] font-bold text-xs mb-1">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    <span>CỔNG 2 & 3 (GA)</span>
                  </div>
                  <p className="text-xs text-[#aa8984] leading-relaxed">
                    Dành cho các khu vực Fanzone đứng (GA A, GA B) và khu vực sân cỏ tự do.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#1d1f28] border border-white/5">
                  <div className="flex items-center gap-1.5 text-[#4cd7f6] font-bold text-xs mb-1">
                    <span className="material-symbols-outlined text-[18px]">chair</span>
                    <span>CỔNG 4 (TRIBUNE)</span>
                  </div>
                  <p className="text-xs text-[#aa8984] leading-relaxed">
                    Khán đài tầng A1, A2, B và C có số ghế cố định, lối thang cuốn riêng.
                  </p>
                </div>
              </div>

              {/* Transport & Parking Advice */}
              <div className="space-y-2 pt-2 text-xs text-[#aa8984]">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#aa8984] text-[18px]">directions_car</span>
                  <span>Bãi gửi xe & Di chuyển</span>
                </h3>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-[#4cd7f6] font-bold">✓</span>
                    <span><strong className="text-white">Phương tiện cá nhân:</strong> Bãi giữ xe máy tại Cổng Hoàng Văn Thụ (sức chứa 15.000 xe).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4cd7f6] font-bold">✓</span>
                    <span><strong className="text-white">Xe công nghệ / Taxi:</strong> Khuyến nghị điểm trả khách tại góc đường Phan Đình Phùng - Hoàng Văn Thụ.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4cd7f6] font-bold">✓</span>
                    <span><strong className="text-white">Mở cổng check-in:</strong> Bắt đầu từ <strong className="text-[#ff5945] font-mono">{event.gateOpenTime}</strong>. Vui lòng đến trước ít nhất 90 phút.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Venue Static Map */}
            <div className="lg:col-span-5 flex flex-col">
              <div
                className="w-full h-72 lg:h-full min-h-[280px] rounded-2xl bg-[#1d1f28] relative overflow-hidden shadow-inner flex items-end p-4 border border-white/10"
                style={{
                  backgroundImage: "url('/images/storefront/venue-map.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="w-full p-4 rounded-xl bg-[#191b23]/90 backdrop-blur-md flex items-center justify-between border border-white/10">
                  <div>
                    <span className="font-bold text-white text-xs">{event.venueName}</span>
                    <p className="text-[11px] text-[#aa8984]">Mở Google Maps chỉ đường</p>
                  </div>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#282a32] text-white hover:text-[#ffb4a8] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Chỉ đường</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. POLICY & SECURITY ESCROW */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-16 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-[#ff5945] uppercase tracking-[0.2em] font-bold">
              Guidelines & Regulations
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mt-1">
              LƯU Ý THAM DỰ & BẢO MẬT VÉ
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[#4cd7f6] text-xs font-bold">
            <span className="material-symbols-outlined text-[20px]">shield</span>
            <span>TicketShield Escrow Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-[#191b23] border border-[#33343d]/30 flex flex-col space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center text-[#ff5945]">
              <span className="material-symbols-outlined text-[24px]">policy</span>
            </div>
            <h3 className="font-bold text-white text-sm">Độ tuổi & Quy chế tham dự</h3>
            <p className="text-xs text-[#aa8984] leading-relaxed">
              Sự kiện dành cho khán giả từ <strong className="text-white">12 tuổi trở lên</strong> (khán giả dưới 16 tuổi cần có người giám hộ đi kèm tại khu khán đài Tribune). Phụ nữ mang thai không khuyến khích vào khu GA đứng.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#191b23] border border-[#33343d]/30 flex flex-col space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center text-[#d0bcff]">
              <span className="material-symbols-outlined text-[24px]">no_photography</span>
            </div>
            <h3 className="font-bold text-white text-sm">Vật dụng bị cấm mang vào</h3>
            <p className="text-xs text-[#aa8984] leading-relaxed">
              Nghiêm cấm mang theo máy ảnh chuyên nghiệp (ống kính rời), tripod, flycam, vũ khí, vật liệu cháy nổ, đồ ăn nước uống từ ngoài và banner có kích thước vượt quá 40x40cm.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#191b23] border border-[#33343d]/30 flex flex-col space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#282a32] flex items-center justify-center text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[24px]">security_update_good</span>
            </div>
            <h3 className="font-bold text-white text-sm">Bảo vệ vé chống lừa đảo</h3>
            <p className="text-xs text-[#aa8984] leading-relaxed">
              Vé điện tử tích hợp mã <strong className="text-[#4cd7f6]">Dynamic QR đổi mới mỗi 60 giây</strong>. Nghiêm cấm chụp màn hình chia sẻ mã QR lên mạng xã hội. Giao dịch mua lại chỉ an toàn qua nền tảng TicketShield Marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* 7. PRE-FOOTER CTA CARD */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#191b23] via-[#282a32] to-[#191b23] p-8 lg:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xl border border-[#33343d]/40">
          <div className="w-14 h-14 rounded-full bg-[#ff5945]/20 text-[#ff5945] flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">event_seat</span>
          </div>
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Sẵn sàng hòa mình vào đêm nhạc lớn nhất 2025?
            </h2>
            <p className="text-xs sm:text-sm text-[#aa8984] leading-relaxed">
              Các hạng vé Fanzone và VVIP đang được săn đón với tốc độ kỷ lục. Nhấn bên dưới để xem chi tiết bảng giá và tiến hành chọn hạng vé ngay bây giờ.
            </p>
          </div>
          <Link
            to={`/storefront/event/${event.id}/select-seat`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#ff5945] hover:bg-[#ff7252] text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_32px_rgba(255,89,69,0.4)]"
          >
            <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            <span className="tracking-wide">CHỌN HẠNG VÉ & MUA NGAY</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </Link>
        </div>
      </section>
    </StorefrontLayout>
  );
};
