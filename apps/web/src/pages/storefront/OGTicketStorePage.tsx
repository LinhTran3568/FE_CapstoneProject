import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { StageLayoutModal } from '../../components/storefront/StageLayoutModal';
import { CheckoutModal } from '../../components/storefront/CheckoutModal';
import {
  getStorefrontEventById,
  StorefrontEvent,
  StorefrontTier,
} from '../../data/storefrontCatalog';

// Backend BE-MOCK-7.1.1 API configuration
const ORGANIZER_API_BASE = 'http://localhost:5001/api/organizer';

export interface BackendTier {
  id: string;
  eventId: string;
  tierName: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  createdAt?: string;
}

export interface EnrichedTier extends StorefrontTier {
  category: 'vip' | 'standard' | 'ga';
  backendSynced: boolean;
}

export const OGTicketStorePage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();

  // 1. Resolve event metadata from catalog
  const event: StorefrontEvent = getStorefrontEventById(eventId);

  // 2. State management
  const [tiers, setTiers] = useState<EnrichedTier[]>(() =>
    event.tiers.map((t) => ({
      ...t,
      category: t.tierName.toLowerCase().includes('vip') || t.tierName.toLowerCase().includes('diamond')
        ? 'vip'
        : t.tierName.toLowerCase().includes('ga') || t.tierName.toLowerCase().includes('standing')
        ? 'ga'
        : 'standard',
      backendSynced: false,
    }))
  );

  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [isBackendLoading, setIsBackendLoading] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline'>('offline');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'vip' | 'standard' | 'available'>('all');
  const [isStageModalOpen, setIsStageModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // 3. Connect to BE-MOCK-7.1.1 (GET /api/organizer/events/{id}/tiers)
  const fetchBackendTiers = useCallback(async () => {
    setIsBackendLoading(true);
    try {
      const res = await fetch(`${ORGANIZER_API_BASE}/events/${event.id}/tiers`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const liveTiers: BackendTier[] = await res.json();
        if (Array.isArray(liveTiers) && liveTiers.length > 0) {
          // Merge live backend inventory with rich frontend metadata
          setTiers((prev) => {
            return liveTiers.map((live) => {
              const matchedCatalog = prev.find(
                (p) =>
                  p.id === live.id ||
                  p.tierName.trim().toLowerCase() === live.tierName.trim().toLowerCase()
              );

              const category: 'vip' | 'standard' | 'ga' =
                live.tierName.toLowerCase().includes('vip') || live.tierName.toLowerCase().includes('diamond')
                  ? 'vip'
                  : live.tierName.toLowerCase().includes('ga') || live.tierName.toLowerCase().includes('standing')
                  ? 'ga'
                  : 'standard';

              if (matchedCatalog) {
                return {
                  ...matchedCatalog,
                  id: live.id,
                  price: live.price,
                  availableQuantity: live.availableQuantity,
                  totalQuantity: live.totalQuantity,
                  isSoldOut: live.availableQuantity <= 0,
                  category,
                  backendSynced: true,
                };
              }

              // Fallback tier generated from live backend data
              return {
                id: live.id,
                tierKey: 'diamond',
                tierName: live.tierName,
                price: live.price,
                totalQuantity: live.totalQuantity,
                availableQuantity: live.availableQuantity,
                maxPerOrder: 4,
                seatZone: `${live.tierName} - Khu vực chính thức BTC`,
                gateEntrance: 'Cổng 1 & 2 (Kiểm soát điện tử)',
                isSoldOut: live.availableQuantity <= 0,
                perks: [
                  'Vé điện tử chính thức phát hành từ Ban Tổ Chức',
                  'Mã QR Cyber-Escrow bảo mật chống làm giả',
                  'Kèm quà tặng lưu niệm concert chính hãng',
                ],
                category,
                backendSynced: true,
              };
            });
          });

          setBackendStatus('connected');
          setLastSyncedTime(new Date().toLocaleTimeString('vi-VN'));
          setAlertNotice('Đã đồng bộ trực tiếp với hệ thống máy chủ Ban Tổ Chức (BE-MOCK-7.1.1)');
          setTimeout(() => setAlertNotice(null), 4000);
          return;
        }
      }
      // If 404 or non-ok, fallback to seed catalog
      setBackendStatus('offline');
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsBackendLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    fetchBackendTiers();
  }, [fetchBackendTiers]);

  // 4. Quantity modification handlers
  const handleQuantityChange = (tierId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[tierId] || 0;
      const targetTier = tiers.find((t) => t.id === tierId);
      if (!targetTier) return prev;

      const maxLimit = Math.min(targetTier.maxPerOrder || 4, targetTier.availableQuantity);
      const next = Math.max(0, Math.min(maxLimit, current + delta));

      if (next === 0) {
        const copy = { ...prev };
        delete copy[tierId];
        return copy;
      }
      return { ...prev, [tierId]: next };
    });
  };

  // 5. Order calculations
  const selectedItems = tiers
    .map((tier) => ({
      tier,
      quantity: selectedQuantities[tier.id] || 0,
      subtotal: tier.price * (selectedQuantities[tier.id] || 0),
    }))
    .filter((item) => item.quantity > 0);

  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const serviceFee = 0; // 0₫ fee for direct organizer sale
  const grandTotal = rawSubtotal + serviceFee;

  // 6. Open Checkout Modal Buyer Information Form (FE-7.2.2)
  const handleProceedToCheckout = () => {
    if (totalQuantity === 0) return;
    setIsCheckoutModalOpen(true);
  };

  // Filtered tier list
  const filteredTiers = tiers.filter((tier) => {
    if (activeFilter === 'vip') return tier.category === 'vip';
    if (activeFilter === 'standard') return tier.category === 'standard' || tier.category === 'ga';
    if (activeFilter === 'available') return tier.availableQuantity > 0;
    return true;
  });

  return (
    <StorefrontLayout activeTab="kham-pha">
      {/* Top Progress / Context Glow */}
      <div className="w-full h-1 bg-[#282a32] relative overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#ff5945] via-[#4cd7f6] to-[#571bc1] w-1/3 transition-all duration-700" />
      </div>

      {/* ALERT BANNER IF LIVE CONNECTED */}
      {alertNotice && (
        <div className="w-full bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
              <span>{alertNotice}</span>
            </div>
            <button
              onClick={() => setAlertNotice(null)}
              className="text-emerald-400/70 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* BREADCRUMB & HEADER CONTEXT */}
      <section className="w-full px-4 lg:px-12 py-3 bg-[#0c0e16]/80 backdrop-blur-md border-b border-[#33343d]/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#aa8984]">
            <Link to="/storefront" className="hover:text-white transition-colors">
              Khám phá
            </Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <Link to={`/storefront/event/${event.id}`} className="hover:text-white transition-colors truncate max-w-[200px]">
              {event.title}
            </Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-[#ffb4a8] font-bold">Đặt vé chính thức BTC (FE-7.2.1)</span>
          </div>

          {/* Sync indicator */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            {backendStatus === 'connected' ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>BE-MOCK-7.1.1 LIVE SYNC</span>
                {lastSyncedTime && <span className="text-emerald-400/60 hidden sm:inline">({lastSyncedTime})</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DEMO CATALOG</span>
              </div>
            )}

            <button
              onClick={fetchBackendTiers}
              disabled={isBackendLoading}
              title="Làm mới tồn kho vé từ backend"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e2029] hover:bg-[#282a32] text-[#e1e1ed] text-xs border border-white/10 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[14px] ${isBackendLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>
      </section>

      {/* EVENT SHOWCASE HERO & POSTER SECTION */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#13151f] via-[#0e1017] to-[#090a0f] border-b border-white/[0.06] py-8 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#ff5945]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Event Poster Card with glowing border */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ff5945] via-[#4cd7f6] to-[#571bc1] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative w-48 sm:w-64 aspect-[3/4] rounded-2xl overflow-hidden bg-[#191b23] border border-white/10 shadow-2xl">
                <img
                  src={event.posterImage}
                  alt={event.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#ffb4a8] border border-white/10">
                    OFFICIAL POSTER
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#4cd7f6]/20 backdrop-blur-md text-[10px] font-bold text-[#4cd7f6] border border-[#4cd7f6]/30">
                    VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Event Metadata & Organizer Details */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#ff5945]/15 text-[#ff5945] text-xs font-bold font-mono tracking-wider uppercase border border-[#ff5945]/30">
                  {event.tourName || 'OFFICIAL ORIGIN TOUR'}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#4cd7f6]/10 text-[#4cd7f6] text-xs font-mono font-medium border border-[#4cd7f6]/20 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {event.organizerName}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              <p className="text-sm text-[#aa8984] max-w-2xl leading-relaxed">
                {event.subtitle || event.description}
              </p>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#191b23]/80 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#ff5945]/10 border border-[#ff5945]/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ff5945] text-[20px]">calendar_today</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[11px] text-[#aa8984] uppercase tracking-wider font-mono">Thời gian</div>
                    <div className="text-xs font-bold text-white truncate">{event.dateDisplay}</div>
                    <div className="text-[11px] text-[#4cd7f6]">{event.timeDisplay}</div>
                  </div>
                </div>

                <div className="bg-[#191b23]/80 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">location_on</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[11px] text-[#aa8984] uppercase tracking-wider font-mono">Địa điểm</div>
                    <div className="text-xs font-bold text-white truncate">{event.venueName}</div>
                    <div className="text-[11px] text-[#aa8984] truncate">{event.venueAddress}</div>
                  </div>
                </div>

                <div className="bg-[#191b23]/80 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-emerald-400 text-[20px]">shield</span>
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-[11px] text-[#aa8984] uppercase tracking-wider font-mono">Bảo chứng</div>
                    <div className="text-xs font-bold text-white">Cyber-Escrow BTC</div>
                    <div className="text-[11px] text-emerald-400">100% Vé chính ngạch</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => setIsStageModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#282a32] hover:bg-[#333540] text-white text-xs font-medium border border-white/10 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">map</span>
                  <span>Xem sơ đồ sân khấu & khán đài</span>
                </button>

                <a
                  href="#tier-selection"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff5945] to-[#d03724] hover:opacity-95 text-white text-xs font-bold transition-all shadow-lg shadow-[#ff5945]/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                  <span>Chọn hạng vé ngay</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT: TICKET TIERS SELECTION & ORDER SUMMARY */}
      <div id="tier-selection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT 8 COLUMNS: TICKET TIER LIST & COUNTERS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Filter Bar & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#33343d]/40">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-white flex items-center gap-2.5">
                  <span>Danh sách hạng vé phát hành</span>
                  <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-[#1e2029] text-[#aa8984] border border-white/5">
                    {tiers.length} hạng vé
                  </span>
                </h2>
                <p className="text-xs text-[#aa8984] mt-1">
                  Giá đã bao gồm VAT. Vé được liên kết mã QR động chống gian lận thương mại.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#151720] rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[#ff5945] text-white font-bold shadow'
                      : 'text-[#aa8984] hover:text-white'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setActiveFilter('vip')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'vip'
                      ? 'bg-[#ff5945] text-white font-bold shadow'
                      : 'text-[#aa8984] hover:text-white'
                  }`}
                >
                  Hạng VIP
                </button>
                <button
                  onClick={() => setActiveFilter('standard')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'standard'
                      ? 'bg-[#ff5945] text-white font-bold shadow'
                      : 'text-[#aa8984] hover:text-white'
                  }`}
                >
                  Standard / GA
                </button>
                <button
                  onClick={() => setActiveFilter('available')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'available'
                      ? 'bg-[#ff5945] text-white font-bold shadow'
                      : 'text-[#aa8984] hover:text-white'
                  }`}
                >
                  Còn vé
                </button>
              </div>
            </div>

            {/* List of Tiers */}
            <div className="space-y-4">
              {filteredTiers.map((tier) => {
                const qty = selectedQuantities[tier.id] || 0;
                const isSoldOut = tier.availableQuantity <= 0;
                const isLowStock = !isSoldOut && tier.availableQuantity <= 35;
                const isSelected = qty > 0;
                const maxAllowed = Math.min(tier.maxPerOrder || 4, tier.availableQuantity);
                const stockPercent = tier.totalQuantity > 0 
                  ? Math.round((tier.availableQuantity / tier.totalQuantity) * 100) 
                  : 50;

                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl bg-[#151720] border transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? 'border-[#ff5945] shadow-xl shadow-[#ff5945]/10 bg-[#191b26]'
                        : isSoldOut
                        ? 'border-white/5 opacity-60 bg-[#12131a]'
                        : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    {/* Top Accent Strip */}
                    {isSelected && (
                      <div className="h-1 w-full bg-gradient-to-r from-[#ff5945] to-[#4cd7f6]" />
                    )}

                    <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Left: Tier Information */}
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {tier.category === 'vip' ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono uppercase tracking-wider">
                              VIP PASS
                            </span>
                          ) : tier.category === 'ga' ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 text-[10px] font-bold font-mono uppercase tracking-wider">
                              GA STANDING
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold font-mono uppercase tracking-wider">
                              STANDARD SEATED
                            </span>
                          )}

                          <h3 className="font-display font-bold text-lg sm:text-xl text-white truncate">
                            {tier.tierName}
                          </h3>

                          {/* Inventory Status Badge */}
                          {isSoldOut ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-mono font-medium">
                              Hết vé
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              Chỉ còn {tier.availableQuantity} vé
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium">
                              Còn {tier.availableQuantity} vé
                            </span>
                          )}
                        </div>

                        {/* Zone & Gate Meta */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#aa8984]">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-[#ff5945]">event_seat</span>
                            <span>Khu vực: <strong className="text-[#e1e1ed]">{tier.seatZone}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-[#4cd7f6]">meeting_room</span>
                            <span>Cửa vào: <strong className="text-[#e1e1ed]">{tier.gateEntrance}</strong></span>
                          </div>
                        </div>

                        {/* Perks Bullets */}
                        {tier.perks && tier.perks.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#CBD5E1]">
                              {tier.perks.slice(0, 3).map((perk, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
                                  <span className="truncate">{perk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Stock Progress Bar */}
                        {!isSoldOut && (
                          <div className="pt-1 flex items-center gap-2 text-[11px] text-[#aa8984]">
                            <div className="w-28 sm:w-36 h-1.5 bg-[#282a32] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isLowStock ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, stockPercent))}%` }}
                              />
                            </div>
                            <span>Tồn kho {tier.availableQuantity} / {tier.totalQuantity || 100}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Price & Quantity Counter */}
                      <div className="flex flex-col sm:items-end justify-between gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <div className="text-[11px] text-[#aa8984] uppercase font-mono tracking-wider">Đơn giá</div>
                          <div className="font-display font-extrabold text-xl sm:text-2xl text-white">
                            {tier.price.toLocaleString('vi-VN')} <span className="text-sm font-normal text-[#ffb4a8]">₫</span>
                          </div>
                        </div>

                        {/* QUANTITY SELECTOR COUNTER */}
                        <div className="flex items-center gap-3">
                          {isSoldOut ? (
                            <button
                              disabled
                              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-mono font-medium cursor-not-allowed"
                            >
                              Tạm hết vé
                            </button>
                          ) : (
                            <div className="flex items-center bg-[#1e2029] border border-white/10 rounded-xl p-1 shadow-inner">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(tier.id, -1)}
                                disabled={qty === 0}
                                title="Giảm số lượng"
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all cursor-pointer ${
                                  qty === 0
                                    ? 'opacity-30 cursor-not-allowed'
                                    : 'hover:bg-[#282a32] active:scale-95'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                              </button>

                              <div className="w-12 text-center font-display font-bold text-lg text-white">
                                {qty}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuantityChange(tier.id, 1)}
                                disabled={qty >= maxAllowed}
                                title="Tăng số lượng"
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                  qty >= maxAllowed
                                    ? 'opacity-30 cursor-not-allowed text-zinc-500'
                                    : 'bg-[#ff5945] hover:bg-[#ff6c5b] text-white active:scale-95 shadow-md shadow-[#ff5945]/20'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Subtotal note if selected */}
                        {qty > 0 && (
                          <div className="text-xs font-mono text-[#ffb4a8] text-right">
                            = {(tier.price * qty).toLocaleString('vi-VN')} ₫
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admission Rules Notice */}
            <div className="bg-[#151720] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff5945] text-[18px]">policy</span>
                <h4 className="font-display font-bold text-sm text-white">
                  Quy chế nhận vé & vào cổng của Ban Tổ Chức
                </h4>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#aa8984]">
                {event.admissionPolicy.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-[#0e1017] p-2.5 rounded-lg border border-white/5">
                    <span className="text-[#ff5945] font-mono">0{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: ORDER SUMMARY SIDEBAR (FE-7.2.2 UNLOCK) */}
          <div className="lg:col-span-4">
            <div className="bg-[#151720] border border-white/10 rounded-2xl p-6 sticky top-24 space-y-6 shadow-2xl">
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-display font-bold text-lg text-white">
                  Chi tiết đơn đặt vé
                </h3>
                <p className="text-xs text-[#aa8984] mt-0.5">
                  Phát hành trực tiếp từ hệ thống đối tác
                </p>
              </div>

              {selectedItems.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1e2029] border border-white/5 flex items-center justify-center mx-auto text-[#aa8984]">
                    <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
                  </div>
                  <p className="text-xs text-[#aa8984]">
                    Chưa có hạng vé nào được chọn.
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Chọn số lượng ở danh sách bên trái để mở khóa thanh toán.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Tiers List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {selectedItems.map(({ tier, quantity, subtotal }) => (
                      <div
                        key={tier.id}
                        className="flex items-start justify-between text-xs pb-3 border-b border-white/5"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {tier.tierName}
                          </div>
                          <div className="text-[11px] text-[#aa8984] font-mono">
                            {quantity} vé × {tier.price.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                        <div className="font-mono font-bold text-white shrink-0">
                          {subtotal.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculations Breakdown */}
                  <div className="space-y-2 text-xs pt-2">
                    <div className="flex justify-between text-[#aa8984]">
                      <span>Tổng số lượng:</span>
                      <span className="font-mono text-white font-bold">{totalQuantity} vé</span>
                    </div>
                    <div className="flex justify-between text-[#aa8984]">
                      <span>Phí dịch vụ & xuất vé:</span>
                      <span className="font-mono text-emerald-400 font-medium">0 ₫ (Miễn phí)</span>
                    </div>
                    <div className="flex justify-between text-[#aa8984]">
                      <span>Thuế giá trị gia tăng (VAT):</span>
                      <span className="font-mono text-[#aa8984]">Đã bao gồm 10%</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* Grand Total */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-[#aa8984]">Tổng tiền thanh toán</div>
                      <div className="text-[10px] text-[#4cd7f6] font-mono">Đã bảo vệ Cyber-Escrow</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-extrabold text-2xl text-white">
                        {grandTotal.toLocaleString('vi-VN')}{' '}
                        <span className="text-sm font-normal text-[#ffb4a8]">₫</span>
                      </div>
                    </div>
                  </div>

                  {/* Escrow Guarantee Pill */}
                  <div className="p-3 rounded-xl bg-[#1e2029] border border-white/5 flex items-start gap-2.5 text-xs text-[#aa8984]">
                    <span className="material-symbols-outlined text-[#ff5945] text-[18px] shrink-0 mt-0.5">verified_user</span>
                    <span className="leading-relaxed">
                      Vé có định danh bất biến trên sổ cái TicketShield. Trường hợp không thể tham gia, bạn được quyền ký gửi bán lại P2P an toàn.
                    </span>
                  </div>

                  {/* CTA BUTTON: UNLOCKS FE-7.2.2 */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff5945] to-[#d03724] hover:opacity-95 text-white font-bold text-sm transition-all shadow-xl shadow-[#ff5945]/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Tiếp tục thanh toán (FE-7.2.2)</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BAR WHEN AT LEAST 1 TICKET SELECTED */}
      {totalQuantity > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0e1017]/95 backdrop-blur-md border-t border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#aa8984]">Đã chọn {totalQuantity} vé</div>
              <div className="font-display font-extrabold text-lg text-white">
                {grandTotal.toLocaleString('vi-VN')} <span className="text-xs text-[#ffb4a8]">₫</span>
              </div>
            </div>
            <button
              onClick={handleProceedToCheckout}
              className="py-2.5 px-5 rounded-xl bg-[#ff5945] hover:bg-[#ff6c5b] text-white text-xs font-bold transition-all shadow-lg shadow-[#ff5945]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Thanh toán</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE LAYOUT MODAL */}
      <StageLayoutModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        event={event}
      />

      {/* CHECKOUT MODAL (FE-7.2.2 - BUYER INFO FORM & TICKET ISSUANCE) */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        event={event}
        selectedItems={selectedItems}
        grandTotal={grandTotal}
      />
    </StorefrontLayout>
  );
};
