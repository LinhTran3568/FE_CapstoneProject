import React from 'react';
import { StorefrontTier } from '../../data/storefrontCatalog';

interface OrderSummaryProps {
  tiers: StorefrontTier[];
  selectedQuantities: Record<string, number>;
  onProceedToCheckout: () => void;
  isSubmitting?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  tiers,
  selectedQuantities,
  onProceedToCheckout,
  isSubmitting = false,
}) => {
  const selectedItems = tiers
    .map((tier) => ({
      tier,
      quantity: selectedQuantities[tier.id] || 0,
      subtotal: tier.price * (selectedQuantities[tier.id] || 0),
    }))
    .filter((item) => item.quantity > 0);

  const totalTickets = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selectedItems.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <>
      {/* Desktop Sticky Panel */}
      <div className="bg-[#131B26] border border-white/[0.08] rounded-2xl p-6 sticky top-24 space-y-6 shadow-xl">
        <div className="border-b border-white/[0.08] pb-4">
          <h3 className="font-display font-bold text-lg text-white">
            Tóm tắt đơn hàng
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Vé phát hành trực tiếp từ Ban Tổ Chức
          </p>
        </div>

        {/* Selected Items Breakdown */}
        {selectedItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#94A3B8] space-y-2">
            <svg
              className="w-8 h-8 text-[#64748B] mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <p>Chưa có hạng vé nào được chọn.</p>
            <p className="text-[11px] text-[#64748B]">
              Vui lòng chọn số lượng vé ở danh sách bên trái để tiếp tục.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {selectedItems.map(({ tier, quantity, subtotal }) => (
                <div
                  key={tier.id}
                  className="flex items-start justify-between text-xs gap-3 pb-3 border-b border-white/5"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-white truncate">{tier.tierName}</div>
                    <div className="text-[#94A3B8] font-mono">
                      {quantity} vé × {tier.price.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white shrink-0">
                    {subtotal.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Tổng số lượng vé:</span>
                <span className="font-mono text-white font-medium">{totalTickets} vé</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Phí phát hành vé điện tử:</span>
                <span className="font-mono text-emerald-400 font-medium">0 ₫ (Miễn phí)</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Thuế giá trị gia tăng (VAT):</span>
                <span className="font-mono text-[#CBD5E1]">Đã bao gồm</span>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Total Amount */}
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-white">Tổng thanh toán:</span>
              <div className="text-right">
                <div className="font-display font-extrabold text-2xl text-white tracking-tight">
                  {totalAmount.toLocaleString('vi-VN')}{' '}
                  <span className="text-sm font-sans font-normal text-[#94A3B8]">₫</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              disabled={totalTickets === 0 || isSubmitting}
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-[#E11D48]/20 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              {isSubmitting ? (
                <span>Đang xử lý đơn hàng...</span>
              ) : (
                <>
                  <span>Xác nhận thông tin & Checkout</span>
                  <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
                    {totalTickets} vé
                  </span>
                </>
              )}
            </button>

            <div className="text-[11px] text-[#64748B] text-center leading-relaxed">
              Bằng việc bấm xác nhận, bạn xác nhận đã đọc và đồng ý với điều khoản phát hành vé sơ cấp của BTC.
            </div>
          </div>
        )}
      </div>

      {/* Mobile Floating Sticky Bar */}
      {totalTickets > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#131B26] border-t border-white/10 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#94A3B8] font-mono">
                {totalTickets} vé đã chọn
              </div>
              <div className="font-display font-bold text-lg text-white">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onProceedToCheckout}
              className="py-3 px-5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-semibold text-xs transition-colors shrink-0 shadow-lg shadow-[#E11D48]/20 focus-visible:outline-2 focus-visible:outline-white"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Checkout ngay →'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
