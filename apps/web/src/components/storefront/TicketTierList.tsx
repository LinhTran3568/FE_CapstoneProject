import React from 'react';
import { StorefrontTier } from '../../data/storefrontCatalog';

interface TicketTierListProps {
  tiers: StorefrontTier[];
  selectedQuantities: Record<string, number>;
  onQuantityChange: (tierId: string, delta: number) => void;
}

export const TicketTierList: React.FC<TicketTierListProps> = ({
  tiers,
  selectedQuantities,
  onQuantityChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
            Chọn hạng vé & số lượng
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Giá niêm yết đã bao gồm thuế VAT. Mỗi khách hàng được đặt tối đa số vé quy định theo từng hạng.
          </p>
        </div>
        <div className="text-xs font-mono text-[#CBD5E1] bg-[#131B26] px-3 py-1.5 rounded-md border border-white/10 self-start sm:self-auto">
          Tối đa 4 - 6 vé / đơn
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tiers.map((tier) => {
          const qty = selectedQuantities[tier.id] || 0;
          const isSoldOut = tier.availableQuantity <= 0;
          const isLowStock = !isSoldOut && tier.availableQuantity <= 25;
          const isSelected = qty > 0;

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl bg-[#131B26] border transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'border-[#E11D48] shadow-lg shadow-[#E11D48]/10'
                  : 'border-white/[0.08] hover:border-white/20'
              } ${isSoldOut ? 'opacity-60 grayscale' : ''}`}
            >
              {/* Perforated Notches (Rãnh đục lỗ cuống vé bán nguyệt) */}
              <div className="hidden md:block absolute right-[230px] -top-3 w-6 h-6 rounded-full bg-[#0B0F17] border-b border-white/[0.08] z-20" />
              <div className="hidden md:block absolute right-[230px] -bottom-3 w-6 h-6 rounded-full bg-[#0B0F17] border-t border-white/[0.08] z-20" />

              <div className="flex flex-col md:flex-row">
                {/* Main Ticket Body (Thân vé chính) */}
                <div className="flex-1 p-5 sm:p-6 space-y-4">
                  {/* Top line: Tier Name & Stock Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-sm bg-[#E11D48] inline-block shrink-0" />
                      <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                        {tier.tierName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSoldOut ? (
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Hết vé
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">
                          Chỉ còn {tier.availableQuantity} vé
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          Còn vé ({tier.availableQuantity} chỗ)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Zone & Gate Meta */}
                  <div className="text-xs text-[#CBD5E1] space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94A3B8]">Khu vực chỗ ngồi:</span>
                      <strong className="text-white font-medium">{tier.seatZone}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#94A3B8]">Cửa soát vé:</span>
                      <span className="font-mono text-emerald-400">{tier.gateEntrance}</span>
                    </div>
                  </div>

                  {/* Perks Bullet Points */}
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[11px] font-mono uppercase text-[#94A3B8] mb-2 tracking-wider">
                      Đặc quyền của hạng vé
                    </div>
                    <ul className="space-y-1.5 text-xs text-[#CBD5E1]">
                      {tier.perks.map((perk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-[#E11D48] mt-0.5">•</span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Perforated Divider (Đường xé răng cưa) */}
                <div className="hidden md:block w-px border-r border-dashed border-white/15 relative z-10" />
                <div className="md:hidden h-px border-b border-dashed border-white/15" />

                {/* Ticket Stub: Price & Quantity Stepper (Cuống vé) */}
                <div className="w-full md:w-[230px] bg-[#16202E]/60 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  {/* Decorative Barcode Lines on the Stub */}
                  <div className="hidden md:flex justify-between items-center opacity-30 select-none pb-1">
                    <div className="h-6 flex items-center gap-0.5">
                      <span className="w-0.5 h-6 bg-white" />
                      <span className="w-1 h-6 bg-white" />
                      <span className="w-0.5 h-4 bg-white" />
                      <span className="w-1.5 h-6 bg-white" />
                      <span className="w-0.5 h-5 bg-white" />
                      <span className="w-1 h-6 bg-white" />
                      <span className="w-0.5 h-6 bg-white" />
                      <span className="w-1.5 h-6 bg-white" />
                      <span className="w-0.5 h-4 bg-white" />
                      <span className="w-1 h-6 bg-white" />
                    </div>
                    <span className="text-[10px] font-mono text-[#94A3B8]">ORIGIN PASS</span>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="text-[11px] font-mono uppercase text-[#94A3B8]">
                      Giá niêm yết
                    </div>
                    <div className="font-display font-extrabold text-2xl text-white tracking-tight mt-0.5">
                      {tier.price.toLocaleString('vi-VN')} <span className="text-sm font-sans font-normal text-[#94A3B8]">₫</span>
                    </div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5">
                      Đã gồm thuế VAT
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1.5">
                      <span>Số lượng:</span>
                      <span className="font-mono text-[11px]">Tối đa {tier.maxPerOrder} vé</span>
                    </div>

                    <div className="flex items-center border border-white/15 rounded-lg bg-[#0B0F17] overflow-hidden">
                      <button
                        type="button"
                        disabled={qty <= 0 || isSoldOut}
                        onClick={() => onQuantityChange(tier.id, -1)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[#E11D48]"
                        aria-label="Giảm số lượng vé"
                      >
                        <span className="text-base font-bold select-none">−</span>
                      </button>

                      <div className="flex-1 text-center font-display font-bold text-base text-white select-none">
                        {qty}
                      </div>

                      <button
                        type="button"
                        disabled={qty >= Math.min(tier.maxPerOrder, tier.availableQuantity) || isSoldOut}
                        onClick={() => onQuantityChange(tier.id, 1)}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-[#E11D48]"
                        aria-label="Tăng số lượng vé"
                      >
                        <span className="text-base font-bold select-none">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtotal for this tier */}
                  {qty > 0 && (
                    <div className="text-right text-xs pt-1 border-t border-white/5">
                      <span className="text-[#94A3B8]">Thành tiền: </span>
                      <span className="font-mono font-bold text-white">
                        {(tier.price * qty).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
