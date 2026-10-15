import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { InteractiveStadiumMap } from '../../components/storefront/InteractiveStadiumMap';
import { getStorefrontEventById } from '../../data/storefrontCatalog';

export const StorefrontTicketSelectPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();
  const event = getStorefrontEventById(eventId);

  // Countdown timer in header
  const [totalSeconds, setTotalSeconds] = useState(594); // 09:54

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  // Ticket quantities state
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({
    diamond: 2,
    vipa: 0,
    ga: 0,
  });

  const [activeTierKey, setActiveTierKey] = useState<'diamond' | 'vipa' | 'ga' | 'tribune'>('diamond');

  const tierPrices: Record<'diamond' | 'vipa' | 'ga' | 'tribune', number> = {
    diamond: 4500000,
    vipa: 2800000,
    ga: 1200000,
    tribune: 800000,
  };

  const tierNames: Record<'diamond' | 'vipa' | 'ga' | 'tribune', string> = {
    diamond: 'Diamond Lounge VIP',
    vipa: 'VIP Zone A (Seated)',
    ga: 'GA Standing Zone',
    tribune: 'Tribune Upper CAT 3',
  };

  const updateQty = (key: 'diamond' | 'vipa' | 'ga', delta: number) => {
    setTicketQuantities((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, Math.min(8, current + delta));
      return { ...prev, [key]: next };
    });
    setActiveTierKey(key);
  };

  const handleSelectTierFromMap = (tierKey: 'diamond' | 'vipa' | 'ga' | 'tribune') => {
    setActiveTierKey(tierKey);
    const cardElement = document.getElementById(`card-${tierKey}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardElement.classList.add('scale-[1.01]');
      setTimeout(() => cardElement.classList.remove('scale-[1.01]'), 200);
    }
  };

  // Calculations
  const rawSubtotal =
    (ticketQuantities.diamond || 0) * tierPrices.diamond +
    (ticketQuantities.vipa || 0) * tierPrices.vipa +
    (ticketQuantities.ga || 0) * tierPrices.ga;

  const totalQty =
    (ticketQuantities.diamond || 0) +
    (ticketQuantities.vipa || 0) +
    (ticketQuantities.ga || 0);

  const fee = Math.round(rawSubtotal * 0.02); // 2% Cyber-Escrow fee
  const grandTotal = rawSubtotal + fee;

  const activeNames = Object.entries(ticketQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([key, qty]) => `${qty}x ${tierNames[key as 'diamond' | 'vipa' | 'ga']}`);

  const handleProceed = () => {
    if (totalQty === 0) return;
    navigate(`/storefront/event/${event.id}/checkout`, {
      state: {
        ticketQuantities,
        grandTotal,
        rawSubtotal,
        fee,
      },
    });
  };

  return (
    <StorefrontLayout activeTab="kham-pha">
      {/* Top Progress Bar Glow */}
      <div className="w-full h-1 bg-[#282a32] relative overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#ff5945] via-[#4cd7f6] to-[#d0bcff] w-2/3 transition-all duration-700" />
      </div>

      {/* CONTEXT HEADER BAR */}
      <section className="w-full px-4 lg:px-12 py-3 bg-[#0c0e16]/80 backdrop-blur-md border-b border-[#33343d]/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Breadcrumb & Event Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-lg ring-1 ring-white/10">
              <img
                src={event.posterImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#aa8984] truncate">
                <Link to="/storefront" className="hover:text-white transition-colors">
                  Khám phá
                </Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <Link to={`/storefront/event/${event.id}`} className="text-[#e3beb8] hover:text-white truncate">
                  {event.title}
                </Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span className="text-[#ffb4a8] font-bold">Chọn hạng vé</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="font-display font-bold text-base sm:text-lg text-white truncate tracking-tight">
                  {event.title}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] text-[10px] font-bold font-mono">
                  STADIUM PASS
                </span>
              </div>
            </div>
          </div>

          {/* Realtime Ticker & Venue Meta */}
          <div className="flex items-center gap-4 self-start md:self-auto shrink-0">
            <div className="flex items-center gap-2 text-xs bg-[#191b23] px-3.5 py-1.5 rounded-xl border border-[#33343d]/40">
              <span className="material-symbols-outlined text-[#ff5945] text-[18px]">calendar_month</span>
              <span className="font-medium text-white">{event.dateDisplay}</span>
              <span className="text-[#aa8984]">•</span>
              <span className="text-[#aa8984] truncate max-w-[150px] sm:max-w-none">{event.venueName}</span>
            </div>

            {/* Hold Timer */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#282a32] text-[#4cd7f6] shadow-sm border border-[#33343d]/50">
              <span className="material-symbols-outlined text-[16px] animate-pulse">timer</span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-widest text-[#aa8984] font-bold">
                  Thời gian giữ vé
                </span>
                <span className="font-display text-sm font-bold text-[#4cd7f6] leading-none font-mono">
                  {formatTimer(totalSeconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SPLIT WORKSPACE */}
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-12 py-8 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT: CINEMATIC INTERACTIVE STAGE MAP (Col 1-7) */}
          <section className="xl:col-span-7 flex flex-col gap-4">
            <InteractiveStadiumMap
              selectedTierKey={activeTierKey}
              onSelectTier={handleSelectTierFromMap}
            />

            {/* Venue Advisory Card */}
            <div className="p-4 rounded-2xl bg-[#191b23] border border-[#33343d]/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#282a32] flex items-center justify-center shrink-0 text-[#ff5945]">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-white text-xs">Lưu ý phân khu & Độ tuổi</h4>
                <p className="text-xs text-[#aa8984] leading-relaxed">
                  Khu vực GA Standing không dành cho trẻ em dưới 12 tuổi. Hạng vé Diamond Lounge VIP có lối check-in Priority riêng tại Cổng số 2 từ 16:30 để tham dự Soundcheck độc quyền cùng nghệ sĩ.
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT: TICKET TIER SELECTION (Col 8-12) */}
          <section className="xl:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ff5945] text-[20px]">
                  confirmation_number
                </span>
                <h2 className="font-display font-bold text-lg text-white">Danh sách hạng vé</h2>
              </div>
              <span className="text-[11px] font-mono text-[#aa8984] uppercase tracking-wider">
                Đơn vị: VNĐ
              </span>
            </div>

            {/* TIER CARDS LIST */}
            <div className="flex flex-col gap-3">
              {/* CARD 1: DIAMOND LOUNGE VIP */}
              <div
                id="card-diamond"
                className={`p-5 rounded-2xl transition-all duration-300 flex flex-col gap-3 border ${
                  ticketQuantities.diamond > 0 || activeTierKey === 'diamond'
                    ? 'bg-[#282a32]/95 border-[#ff5945] shadow-[0_0_28px_-6px_rgba(255,89,69,0.35)]'
                    : 'bg-[#191b23] border-[#33343d]/40 hover:bg-[#282a32]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#571bc1]/30 text-[#d0bcff] text-[11px] font-bold tracking-wider uppercase border border-[#571bc1]/40">
                    <span className="w-2 h-2 rounded-full bg-[#d0bcff] animate-pulse" />
                    <span>Diamond Lounge VIP</span>
                  </div>
                  <span className="text-[11px] text-[#4cd7f6] bg-[#1d1f28] px-2.5 py-0.5 rounded font-mono font-bold">
                    Chỉ còn 18 vé
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="font-display font-extrabold text-2xl text-white tracking-tight">
                    4.500.000 <span className="text-xs text-[#aa8984] font-normal">đ / vé</span>
                  </h3>
                  <span className="text-xs text-[#aa8984]">Khu Sát Sân Khấu</span>
                </div>

                <ul className="flex flex-col gap-1 text-xs text-[#e3beb8]">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>Lối đi riêng VIP, check-in đặc quyền từ 16:30</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>F&B Lounge cao cấp, Soundcheck Pass độc quyền</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>Bộ quà tặng Limited Merch Box + Lightstick 2025</span>
                  </li>
                </ul>

                <div className="pt-3 flex items-center justify-between border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#aa8984] uppercase font-bold">Số lượng vé</span>
                    <span className="text-xs text-[#ff5945] font-bold">
                      {ticketQuantities.diamond > 0
                        ? `${(ticketQuantities.diamond * tierPrices.diamond).toLocaleString('vi-VN')} đ (${ticketQuantities.diamond} vé)`
                        : 'Chưa chọn'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#11131b] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => updateQty('diamond', -1)}
                      className="w-8 h-8 rounded-lg bg-[#282a32] hover:bg-[#33343d] text-white flex items-center justify-center font-bold text-base transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-display font-bold text-sm text-white">
                      {ticketQuantities.diamond}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty('diamond', 1)}
                      className="w-8 h-8 rounded-lg bg-[#ff5945] text-white flex items-center justify-center font-bold text-base hover:opacity-90 transition-opacity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: VIP ZONE A */}
              <div
                id="card-vipa"
                className={`p-5 rounded-2xl transition-all duration-300 flex flex-col gap-3 border ${
                  ticketQuantities.vipa > 0 || activeTierKey === 'vipa'
                    ? 'bg-[#282a32]/95 border-[#ff5945] shadow-[0_0_28px_-6px_rgba(255,89,69,0.35)]'
                    : 'bg-[#191b23] border-[#33343d]/40 hover:bg-[#282a32]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff5945]/20 text-[#ffb4a8] text-[11px] font-bold tracking-wider uppercase border border-[#ff5945]/30">
                    <span>VIP Zone A (Seated)</span>
                  </div>
                  <span className="text-[11px] text-[#aa8984] bg-[#1d1f28] px-2 py-0.5 rounded font-mono">
                    Còn 45 vé
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="font-display font-extrabold text-2xl text-white tracking-tight">
                    2.800.000 <span className="text-xs text-[#aa8984] font-normal">đ / vé</span>
                  </h3>
                  <span className="text-xs text-[#aa8984]">Ghế ngồi cố định</span>
                </div>

                <ul className="flex flex-col gap-1 text-xs text-[#e3beb8]">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>Ghế ngồi trực diện tầm nhìn sân khấu hoàn hảo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>Bộ quà tặng Banner cổ vũ & Glowstick chính thức</span>
                  </li>
                </ul>

                <div className="pt-3 flex items-center justify-between border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#aa8984] uppercase font-bold">Số lượng vé</span>
                    <span className="text-xs text-[#ff5945] font-bold">
                      {ticketQuantities.vipa > 0
                        ? `${(ticketQuantities.vipa * tierPrices.vipa).toLocaleString('vi-VN')} đ (${ticketQuantities.vipa} vé)`
                        : 'Chưa chọn'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#11131b] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => updateQty('vipa', -1)}
                      className="w-8 h-8 rounded-lg bg-[#282a32] hover:bg-[#33343d] text-white flex items-center justify-center font-bold text-base transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-display font-bold text-sm text-white">
                      {ticketQuantities.vipa}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty('vipa', 1)}
                      className="w-8 h-8 rounded-lg bg-[#ff5945] text-white flex items-center justify-center font-bold text-base hover:opacity-90 transition-opacity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 3: GA STANDING */}
              <div
                id="card-ga"
                className={`p-5 rounded-2xl transition-all duration-300 flex flex-col gap-3 border ${
                  ticketQuantities.ga > 0 || activeTierKey === 'ga'
                    ? 'bg-[#282a32]/95 border-[#ff5945] shadow-[0_0_28px_-6px_rgba(255,89,69,0.35)]'
                    : 'bg-[#191b23] border-[#33343d]/40 hover:bg-[#282a32]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00a0bb]/30 text-[#4cd7f6] text-[11px] font-bold tracking-wider uppercase border border-[#00a0bb]/40">
                    <span>GA Standing Zone</span>
                  </div>
                  <span className="text-[11px] text-[#aa8984] bg-[#1d1f28] px-2 py-0.5 rounded font-mono">
                    Còn 120 vé
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="font-display font-extrabold text-2xl text-white tracking-tight">
                    1.200.000 <span className="text-xs text-[#aa8984] font-normal">đ / vé</span>
                  </h3>
                  <span className="text-xs text-[#aa8984]">Khu đứng tự do</span>
                </div>

                <ul className="flex flex-col gap-1 text-xs text-[#e3beb8]">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>Khu vực đứng fanzone nhiệt huyết, âm thanh bao trùm</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">check_circle</span>
                    <span>Wristband vải phát sáng lưu niệm</span>
                  </li>
                </ul>

                <div className="pt-3 flex items-center justify-between border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#aa8984] uppercase font-bold">Số lượng vé</span>
                    <span className="text-xs text-[#ff5945] font-bold">
                      {ticketQuantities.ga > 0
                        ? `${(ticketQuantities.ga * tierPrices.ga).toLocaleString('vi-VN')} đ (${ticketQuantities.ga} vé)`
                        : 'Chưa chọn'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-[#11131b] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => updateQty('ga', -1)}
                      className="w-8 h-8 rounded-lg bg-[#282a32] hover:bg-[#33343d] text-white flex items-center justify-center font-bold text-base transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-display font-bold text-sm text-white">
                      {ticketQuantities.ga}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty('ga', 1)}
                      className="w-8 h-8 rounded-lg bg-[#ff5945] text-white flex items-center justify-center font-bold text-base hover:opacity-90 transition-opacity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 4: TRIBUNE (SOLD OUT) */}
              <div className="p-5 rounded-2xl bg-[#191b23]/50 opacity-60 flex flex-col gap-3 border border-[#33343d]/20 select-none">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#282a32] text-[#aa8984] text-[11px] font-semibold uppercase">
                    <span>Tribune Upper CAT 3</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#ffb4ab] bg-[#93000a]/40 px-2 py-0.5 rounded">
                    HẾT VÉ
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <h3 className="font-display font-extrabold text-2xl text-[#aa8984] line-through tracking-tight">
                    800.000 <span className="text-xs font-normal">đ</span>
                  </h3>
                  <span className="text-xs text-[#aa8984]">Tầng 2 Khán đài</span>
                </div>
                <p className="text-xs text-[#aa8984]">
                  Khu vực khán đài trên cao có ghế ngồi định danh. Toàn bộ vé đợt mở bán chính thức đã hết.
                </p>
                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                  <span className="text-[11px] text-[#aa8984]">Đã bán hết 1.500 vé</span>
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1 rounded-lg bg-[#282a32] text-[#aa8984] text-xs cursor-not-allowed"
                  >
                    Đăng ký vé Resale
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* DOCK / FLOATING ORDER SUMMARY PANEL (Sticky Bottom) */}
      <aside className="sticky bottom-0 z-40 w-full bg-[#0c0e16]/95 backdrop-blur-xl border-t border-[#33343d]/40 shadow-[0_-10px_35px_rgba(0,0,0,0.7)] px-4 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Breakdown */}
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#4cd7f6] font-bold uppercase tracking-wider">
                  Đơn hàng hiện tại
                </span>
                <span className="text-[#aa8984]">•</span>
                <span className="text-xs text-white font-semibold font-mono">
                  {totalQty > 0 ? `${totalQty} vé` : '0 vé'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-display font-bold text-sm sm:text-base text-white truncate max-w-[240px] sm:max-w-xs">
                  {activeNames.length > 0 ? activeNames.join(', ') : 'Chưa có vé nào được chọn'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#282a32] text-[#aa8984] text-[10px] font-mono">
                  Khu A-1 Sát Stage
                </span>
              </div>
            </div>

            {/* Subtotal & Fee Details */}
            <div className="hidden lg:flex flex-col text-right pl-6 border-l border-[#33343d]/30 text-xs">
              <div className="flex items-center justify-between gap-4 text-[#aa8984]">
                <span>Tạm tính:</span>
                <span className="text-white font-medium">{rawSubtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[#aa8984]">
                <span className="flex items-center gap-1">
                  Phí Cyber-Escrow & BH:
                  <span className="material-symbols-outlined text-[13px] text-[#4cd7f6]">security</span>
                </span>
                <span className="text-white font-medium">{fee.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* Right: Total Amount & Checkout Button */}
          <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0">
            <div className="flex flex-col text-left md:text-right">
              <span className="text-[10px] text-[#aa8984] uppercase font-bold">Tổng thanh toán</span>
              <div className="flex items-baseline gap-1 font-display">
                <span className="text-2xl font-extrabold text-[#ffb4a8] tracking-tight">
                  {grandTotal.toLocaleString('vi-VN')}
                </span>
                <span className="text-sm font-semibold text-[#ffb4a8]">VNĐ</span>
              </div>
            </div>

            <button
              type="button"
              disabled={totalQty === 0}
              onClick={handleProceed}
              className="h-12 px-8 rounded-xl bg-[#ff5945] hover:bg-[#ff7252] disabled:bg-[#282a32] disabled:text-[#aa8984] disabled:cursor-not-allowed transition-all shadow-[0_0_24px_rgba(255,89,69,0.45)] flex items-center justify-center gap-2 text-sm font-bold text-white shrink-0 active:scale-95"
            >
              <span>TIẾP TỤC THANH TOÁN</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-2 hidden md:flex items-center justify-between text-[#aa8984] text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[14px]">lock</span>
            Vé được giữ chỗ trong <strong className="text-white font-semibold">10:00 phút</strong> sau khi bấm thanh toán.
          </span>
          <span className="text-[#e3beb8] font-medium">
            Phương thức: VietQR tức thì • Thẻ Quốc Tế / Nội Địa • Ví Napas
          </span>
        </div>
      </aside>
    </StorefrontLayout>
  );
};
