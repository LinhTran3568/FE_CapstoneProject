import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { StorefrontEvent, StorefrontTier } from '../../data/storefrontCatalog';
import { MockTicketDto } from '@ticketshield/types';

export interface CheckoutOrderResult {
  orderId: string;
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  paymentMethod: string;
  totalAmount: number;
  tickets: MockTicketDto[];
  createdAt: string;
}

interface CheckoutFormProps {
  event: StorefrontEvent;
  tiers: StorefrontTier[];
  selectedQuantities: Record<string, number>;
  onBackToSelection: () => void;
  onCheckoutSuccess: (result: CheckoutOrderResult) => void;
}

const ORGANIZER_API_BASE = 'http://localhost:5001/api/organizer';

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  event,
  tiers,
  selectedQuantities,
  onBackToSelection,
  onCheckoutSuccess,
}) => {
  // Buyer form states
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'card' | 'sandbox'>('vietqr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculations
  const selectedItems = tiers
    .map((tier) => ({
      tier,
      quantity: selectedQuantities[tier.id] || 0,
      subtotal: tier.price * (selectedQuantities[tier.id] || 0),
    }))
    .filter((item) => item.quantity > 0);

  const totalTickets = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = selectedItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Form Validation
  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (!ownerName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên người nhận vé.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail.trim())) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ để nhận vé điện tử.');
      return false;
    }

    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(ownerPhone.trim())) {
      setErrorMessage('Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 chữ số).');
      return false;
    }

    if (!agreedTerms) {
      setErrorMessage('Vui lòng đồng ý với điều khoản phát hành vé của Ban Tổ Chức.');
      return false;
    }

    return true;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const generatedTickets: MockTicketDto[] = [];
    const timestamp = new Date().toISOString();
    const orderId = `OT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Create ticket for each selected seat/tier
      for (const { tier, quantity } of selectedItems) {
        // Try calling MockOrganizer API if running
        for (let i = 0; i < quantity; i++) {
          const randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
          let prefix = 'TKT';
          if (event.id.includes('atsh')) {
            prefix = tier.tierName.includes('VIP') ? 'ATSH-VIP' : 'ATSH-GA';
          } else if (event.id.includes('mixtape')) {
            prefix = tier.tierName.includes('VIP') ? 'SS-VIP' : 'SS-GA';
          } else if (event.id.includes('westlife')) {
            prefix = tier.tierName.includes('VIP') ? 'LN-VIP' : 'LN-GA';
          }
          const ticketCode = `${prefix}-${randSuffix}`;

          let issuedTicket: MockTicketDto | null = null;

          try {
            const res = await fetch(`${ORGANIZER_API_BASE}/tickets/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ticketCode,
                eventName: event.title,
                seatZone: `${tier.seatZone} (Số ghế #${i + 1})`,
                originalPrice: tier.price,
                ownerEmail: ownerEmail.trim(),
                organizerId: event.organizerId,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              issuedTicket = {
                id: data.id || `ticket-${Date.now()}-${i}`,
                ticketCode: data.ticketCode || ticketCode,
                eventName: event.title,
                seatZone: data.seatZone || `${tier.seatZone} (Số ghế #${i + 1})`,
                originalPrice: tier.price,
                ownerEmail: ownerEmail.trim(),
                ownerPhone: ownerPhone.trim(),
                ownerName: ownerName.trim(),
                status: 'VALID',
                createdAt: data.createdAt || timestamp,
                updatedAt: data.updatedAt || timestamp,
              };
            }
          } catch {
            // Backend offline, fallback to simulation ticket
          }

          if (!issuedTicket) {
            issuedTicket = {
              id: `ot-ticket-${Date.now()}-${i}-${randSuffix}`,
              ticketCode,
              eventName: event.title,
              seatZone: `${tier.seatZone} (Ghế #${i + 1})`,
              originalPrice: tier.price,
              ownerEmail: ownerEmail.trim(),
              ownerPhone: ownerPhone.trim(),
              ownerName: ownerName.trim(),
              status: 'VALID',
              createdAt: timestamp,
              updatedAt: timestamp,
            };
          }

          generatedTickets.push(issuedTicket);
        }
      }

      // Complete order
      const result: CheckoutOrderResult = {
        orderId,
        eventName: event.title,
        buyerName: ownerName.trim(),
        buyerEmail: ownerEmail.trim(),
        buyerPhone: ownerPhone.trim(),
        paymentMethod:
          paymentMethod === 'vietqr'
            ? 'Chuyển khoản VietQR tức thì'
            : paymentMethod === 'card'
            ? 'Thẻ thanh toán quốc tế / Napas'
            : 'Xác nhận thanh toán tức thời (Sandbox)',
        totalAmount,
        tickets: generatedTickets,
        createdAt: timestamp,
      };

      onCheckoutSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const transferMemo = `OT ${event.id.toUpperCase().slice(0, 4)} ${ownerPhone || '0901234567'}`;
  const vietQrPayload = `00020101021238580010A00000072701260006970422011203299521270208QRIBFTTA520460115303704540${totalAmount}5802VN62${transferMemo.length}${transferMemo}6304`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <button
          type="button"
          onClick={onBackToSelection}
          className="inline-flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#E11D48] rounded px-2 py-1"
        >
          <span>← Quay lại chọn hạng vé</span>
        </button>
        <div className="text-xs font-mono text-[#CBD5E1]">
          Đang thanh toán: <strong className="text-white">{totalTickets} vé</strong> ({totalAmount.toLocaleString('vi-VN')} ₫)
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center gap-3">
          <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit} className="space-y-8">
        {/* Section 1: Buyer Information */}
        <div className="bg-[#131B26] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-white">
              1. Thông tin người nhận vé điện tử
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Vé điện tử và mã QR vào cổng sẽ được gửi trực tiếp đến địa chỉ email này. Vui lòng kiểm tra chính xác.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="ownerName" className="block text-xs font-semibold text-[#CBD5E1]">
                Họ và tên người nhận vé <span className="text-[#E11D48]">*</span>
              </label>
              <input
                id="ownerName"
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-xl bg-[#0B0F17] border border-white/15 text-white text-sm focus:border-[#E11D48] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ownerEmail" className="block text-xs font-semibold text-[#CBD5E1]">
                Email nhận vé điện tử <span className="text-[#E11D48]">*</span>
              </label>
              <input
                id="ownerEmail"
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="tennguoidung@gmail.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0B0F17] border border-white/15 text-white text-sm focus:border-[#E11D48] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ownerPhone" className="block text-xs font-semibold text-[#CBD5E1]">
                Số điện thoại liên hệ <span className="text-[#E11D48]">*</span>
              </label>
              <input
                id="ownerPhone"
                type="tel"
                required
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="0901234567"
                maxLength={11}
                className="w-full px-4 py-3 rounded-xl bg-[#0B0F17] border border-white/15 text-white text-sm focus:border-[#E11D48] focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Payment Method */}
        <div className="bg-[#131B26] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-white">
              2. Phương thức thanh toán sơ cấp
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Giao dịch an toàn và xuất hóa đơn trực tiếp từ cổng bán vé của Ban Tổ Chức.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: VietQR */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between gap-3 ${
                paymentMethod === 'vietqr'
                  ? 'bg-[#1A2433] border-[#E11D48] shadow-md shadow-[#E11D48]/10'
                  : 'bg-[#0B0F17] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Chuyển khoản VietQR</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="vietqr"
                  checked={paymentMethod === 'vietqr'}
                  onChange={() => setPaymentMethod('vietqr')}
                  className="accent-[#E11D48]"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Quét mã QR từ mọi ứng dụng ngân hàng di động Việt Nam.
              </p>
            </label>

            {/* Option 2: Card */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between gap-3 ${
                paymentMethod === 'card'
                  ? 'bg-[#1A2433] border-[#E11D48] shadow-md shadow-[#E11D48]/10'
                  : 'bg-[#0B0F17] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Thẻ Napas / Visa</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="accent-[#E11D48]"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Thẻ ATM nội địa hoặc thẻ tín dụng quốc tế Visa/Mastercard.
              </p>
            </label>

            {/* Option 3: Sandbox Direct */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-colors flex flex-col justify-between gap-3 ${
                paymentMethod === 'sandbox'
                  ? 'bg-[#1A2433] border-[#E11D48] shadow-md shadow-[#E11D48]/10'
                  : 'bg-[#0B0F17] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Xác nhận ngay (Demo)</span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="sandbox"
                  checked={paymentMethod === 'sandbox'}
                  onChange={() => setPaymentMethod('sandbox')}
                  className="accent-[#E11D48]"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Cấp vé ngay lập tức không cần chuyển khoản thật.
              </p>
            </label>
          </div>

          {/* VietQR Dynamic Preview Box */}
          {paymentMethod === 'vietqr' && (
            <div className="p-5 rounded-xl bg-[#0B0F17] border border-white/10 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-xl shrink-0 shadow-lg">
                <QRCodeCanvas
                  value={vietQrPayload}
                  size={140}
                  level="M"
                  marginSize={1}
                />
              </div>
              <div className="space-y-2 text-xs w-full">
                <div className="font-semibold text-white">
                  Thông tin chuyển khoản thanh toán tự động:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#94A3B8]">Ngân hàng: </span>
                    <span className="text-white font-mono">MB Bank (Quân Đội)</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">Số tài khoản: </span>
                    <span className="text-white font-mono font-bold">0329952127</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">Chủ tài khoản: </span>
                    <span className="text-white font-mono">ORIGIN TICKETING BTC</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">Số tiền: </span>
                    <span className="text-white font-mono font-bold">
                      {totalAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-[#94A3B8]">Nội dung: </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
                    {transferMemo}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] pt-1">
                  Mở ứng dụng ngân hàng của bạn để quét mã QR trên hoặc bấm Hoàn tất để hoàn thành đơn hàng.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Terms & Submit Button */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-[#CBD5E1]">
            <input
              type="checkbox"
              required
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 accent-[#E11D48] cursor-pointer"
            />
            <span>
              Tôi cam kết thông tin người nhận vé là chính xác, đồng ý với{' '}
              <span className="text-white underline">quy chế kiểm soát cửa soát vé</span> của Ban Tổ Chức{' '}
              và hiểu rằng mỗi mã vé chỉ được cấp quyền vào cổng 01 lần duy nhất.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={onBackToSelection}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/15 text-white hover:bg-white/5 text-xs font-semibold transition-colors"
            >
              ← Quay lại
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-[#E11D48]/25 flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang khởi tạo vé điện tử...</span>
                </>
              ) : (
                <span>Thanh toán & Nhận vé điện tử ({totalAmount.toLocaleString('vi-VN')} ₫)</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
