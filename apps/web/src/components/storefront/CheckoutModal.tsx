import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { StorefrontEvent } from '../../data/storefrontCatalog';
import { MockTicketDto } from '@ticketshield/types';

export interface SelectedTierItem {
  tier: {
    id: string;
    tierName: string;
    price: number;
    seatZone?: string;
  };
  quantity: number;
  subtotal: number;
}

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StorefrontEvent;
  selectedItems: SelectedTierItem[];
  grandTotal: number;
}

interface OrderResultData {
  orderId: string;
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  totalAmount: number;
  tickets: MockTicketDto[];
  createdAt: string;
}

import { organizerStoreApi } from '@ticketshield/api-client';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedItems,
  grandTotal,
}) => {
  // Form states - completely empty by default, no hardcoded accounts
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    terms?: string;
  }>({});

  // Backend error state
  const [apiError, setApiError] = useState<string | null>(null);

  // Loading and result states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResultData | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation logic
  const validateForm = (): boolean => {
    const errs: typeof errors = {};

    if (!buyerName.trim()) {
      errs.name = 'Vui lòng nhập họ và tên người nhận vé';
    } else if (buyerName.trim().length < 2) {
      errs.name = 'Họ và tên tối thiểu 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail.trim()) {
      errs.email = 'Vui lòng nhập email nhận vé điện tử';
    } else if (!emailRegex.test(buyerEmail.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng (vd: user@example.com)';
    }

    const phoneDigits = buyerPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!buyerPhone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại nhận vé';
    } else if (!phoneRegex.test(phoneDigits)) {
      errs.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số, ví dụ 0912345678)';
    }

    if (!agreedTerms) {
      errs.terms = 'Bạn phải đồng ý với điều khoản phát hành vé và nhận diện';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Checkout & Ticket Issuance
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setApiError(null);
    setIsSubmitting(true);

    const timestamp = new Date().toISOString();
    const finalBuyerEmail = buyerEmail.trim();
    const finalBuyerName = buyerName.trim();
    const finalBuyerPhone = buyerPhone.trim();

    let backendOrderId: string | null = null;
    const completedItems: SelectedTierItem[] = [];

    // 1. Call Backend Checkout for each selected tier
    for (const item of selectedItems) {
      try {
        const checkoutRes = await organizerStoreApi.checkout({
          tierId: item.tier.id,
          quantity: item.quantity,
          buyerEmail: finalBuyerEmail,
        });

        if (!backendOrderId && checkoutRes.orderId) {
          backendOrderId = checkoutRes.orderId;
        }
        completedItems.push(item);
      } catch (err: unknown) {
        setIsSubmitting(false);
        const errMsg = err instanceof Error ? err.message : `Lỗi hệ thống khi thanh toán hạng vé ${item.tier.tierName}`;
        setApiError(errMsg);
        return;
      }
    }

    const orderId = backendOrderId || `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Generate and persist official tickets to Ban Tổ Chức database
    const issuedTickets: MockTicketDto[] = [];
    let seatCounter = 1;

    for (const item of completedItems) {
      for (let i = 0; i < item.quantity; i++) {
        let prefix = 'ATSH-STD';
        if (item.tier.tierName.toLowerCase().includes('vip')) {
          prefix = 'ATSH-VIP';
        } else if (item.tier.tierName.toLowerCase().includes('ga') || item.tier.tierName.toLowerCase().includes('standing')) {
          prefix = 'ATSH-GA';
        }

        const seatLabel = item.tier.seatZone
          ? `${item.tier.seatZone} • Ghế #${seatCounter < 10 ? '0' + seatCounter : seatCounter}`
          : `${item.tier.tierName} • Ghế #${seatCounter < 10 ? '0' + seatCounter : seatCounter}`;

        // Generate unique ticket code with collision retry up to 3 attempts
        let confirmedTicketCode = '';
        let lastTicketError: Error | null = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          const randSuffix = `${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
          const candidateCode = `${prefix}-2026-${randSuffix}`;

          try {
            await organizerStoreApi.generateTicket({
              ticketCode: candidateCode,
              eventName: event.title,
              seatZone: seatLabel,
              originalPrice: item.tier.price,
              ownerEmail: finalBuyerEmail,
              ownerName: finalBuyerName,
              ownerPhone: finalBuyerPhone,
              eventId: event.id,
              tierId: item.tier.id,
            });
            confirmedTicketCode = candidateCode;
            break;
          } catch (err: unknown) {
            lastTicketError = err instanceof Error ? err : new Error('Không thể kết nối máy chủ phát hành');
          }
        }

        if (!confirmedTicketCode) {
          setIsSubmitting(false);
          setApiError(`Lỗi phát hành vé từ Ban Tổ Chức: ${lastTicketError?.message || 'Trùng mã vé hoặc máy chủ bận'}`);
          return;
        }

        issuedTickets.push({
          id: `tkt-${Date.now()}-${seatCounter}`,
          ticketCode: confirmedTicketCode,
          eventName: event.title,
          seatZone: seatLabel,
          originalPrice: item.tier.price,
          ownerEmail: finalBuyerEmail,
          ownerName: finalBuyerName,
          ownerPhone: finalBuyerPhone,
          status: 'VALID',
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        seatCounter++;
      }
    }

    // 3. Display congratulation screen with tickets and QR codes
    setIsSubmitting(false);
    setOrderResult({
      orderId,
      eventName: event.title,
      buyerName: finalBuyerName,
      buyerEmail: finalBuyerEmail,
      buyerPhone: finalBuyerPhone,
      totalAmount: grandTotal,
      tickets: issuedTickets,
      createdAt: timestamp,
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleReset = () => {
    setOrderResult(null);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPhone('');
    setAgreedTerms(false);
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#131620] border border-[#33343d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1a1d28] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5945] animate-pulse" />
            <h3 className="font-display font-bold text-base text-white">
              {orderResult ? 'Xác nhận phát hành vé thành công' : 'Thông tin người nhận vé (Bắt buộc)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={orderResult ? handleReset : onClose}
            className="w-8 h-8 rounded-lg bg-[#282a32] hover:bg-[#33343d] text-[#aa8984] hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!orderResult ? (
            /* =================== STEP 1: BUYER INFORMATION FORM =================== */
            <form onSubmit={handleSubmitCheckout} className="space-y-5">
              {/* Selected tickets summary card */}
              <div className="p-4 rounded-xl bg-[#0c0e16] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#aa8984]">
                  <span className="font-semibold text-white">{event.title}</span>
                  <span className="text-[#ffb4a8] font-bold">
                    {selectedItems.reduce((sum, i) => sum + i.quantity, 0)} vé
                  </span>
                </div>
                <div className="space-y-1 pt-1 border-t border-white/5">
                  {selectedItems.map((item) => (
                    <div key={item.tier.id} className="flex justify-between text-xs">
                      <span className="text-[#CBD5E1]">
                        {item.quantity}x {item.tier.tierName}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {item.subtotal.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-[#aa8984] uppercase">Tổng tiền:</span>
                  <span className="font-display font-extrabold text-xl text-[#ffb4a8]">
                    {grandTotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* Input: Họ và tên */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aa8984] flex items-center justify-between">
                  <span>
                    Họ và tên người nhận vé <span className="text-[#ff5945]">*</span>
                  </span>
                  {errors.name && <span className="text-[11px] text-[#ff5945] font-bold">{errors.name}</span>}
                </label>
                <input
                  type="text"
                  id="buyer-name-input"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Nhập họ và tên đầy đủ (vd: Nguyễn Văn A)"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#0e1017] border text-white text-sm placeholder:text-[#64748b] transition-all focus:outline-none ${
                    errors.name
                      ? 'border-[#ff5945] ring-1 ring-[#ff5945]'
                      : 'border-white/10 focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]'
                  }`}
                  autoFocus
                />
              </div>

              {/* Input: Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aa8984] flex items-center justify-between">
                  <span>
                    Email nhận mã vé điện tử <span className="text-[#ff5945]">*</span>
                  </span>
                  {errors.email && <span className="text-[11px] text-[#ff5945] font-bold">{errors.email}</span>}
                </label>
                <input
                  type="email"
                  id="buyer-email-input"
                  value={buyerEmail}
                  onChange={(e) => {
                    setBuyerEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Địa chỉ email hợp lệ (vd: nguyen.a@gmail.com)"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#0e1017] border text-white text-sm placeholder:text-[#64748b] transition-all focus:outline-none ${
                    errors.email
                      ? 'border-[#ff5945] ring-1 ring-[#ff5945]'
                      : 'border-white/10 focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]'
                  }`}
                />
                <p className="text-[11px] text-[#64748b]">
                  Mã vé gốc và mã QR vào cổng sẽ được gửi trực tiếp đến địa chỉ email này.
                </p>
              </div>

              {/* Input: Số điện thoại */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aa8984] flex items-center justify-between">
                  <span>
                    Số điện thoại nhận vé <span className="text-[#ff5945]">*</span>
                  </span>
                  {errors.phone && <span className="text-[11px] text-[#ff5945] font-bold">{errors.phone}</span>}
                </label>
                <input
                  type="tel"
                  id="buyer-phone-input"
                  value={buyerPhone}
                  onChange={(e) => {
                    setBuyerPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Số điện thoại di động (vd: 0912345678)"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#0e1017] border text-white text-sm placeholder:text-[#64748b] transition-all focus:outline-none ${
                    errors.phone
                      ? 'border-[#ff5945] ring-1 ring-[#ff5945]'
                      : 'border-white/10 focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]'
                  }`}
                />
              </div>

              {/* Checkbox: Đồng ý điều khoản */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="buyer-terms-checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded bg-[#0e1017] border border-white/20 text-[#ff5945] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#aa8984] leading-relaxed">
                    Tôi xác nhận thông tin trên là chính xác và đồng ý với điều khoản phát hành vé điện tử chính hãng từ Ban Tổ Chức.
                  </span>
                </label>
                {errors.terms && <p className="text-[11px] text-[#ff5945] mt-1 font-bold pl-6">{errors.terms}</p>}
              </div>

              {/* Error Alert from API if any */}
              {apiError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-red-400 text-lg shrink-0">error</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Không thể hoàn tất đặt vé</p>
                    <p className="mt-0.5 text-red-200 leading-relaxed">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/3 py-3 rounded-xl bg-[#282a32] hover:bg-[#33343d] text-white text-xs font-semibold transition-all text-center cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  id="btn-confirm-checkout"
                  disabled={isSubmitting}
                  className="w-full sm:w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      <span>Đang xử lý đặt vé & phát hành...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      <span>Xác nhận & Mua vé</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* =================== STEP 2: TICKET ISSUANCE CONGRATULATION SCREEN =================== */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Success Badge */}
              <div className="text-center space-y-2 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <h4 className="font-display font-bold text-xl text-white">
                  Đặt vé thành công!
                </h4>
                <p className="text-xs text-[#CBD5E1] max-w-md mx-auto">
                  Đơn hàng <span className="font-mono font-bold text-white">{orderResult.orderId}</span> đã được ghi nhận. Mã vé điện tử chính thức đã được gửi tới hòm thư <span className="font-bold text-emerald-300">{orderResult.buyerEmail}</span>.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-[11px] pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-[#0c0e16] text-[#CBD5E1] border border-white/5">
                    Người nhận: <strong className="text-white">{orderResult.buyerName}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0c0e16] text-[#CBD5E1] border border-white/5">
                    SĐT: <strong className="text-white">{orderResult.buyerPhone}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0c0e16] text-[#CBD5E1] border border-white/5">
                    Tổng tiền: <strong className="text-white">{orderResult.totalAmount.toLocaleString('vi-VN')} ₫</strong>
                  </span>
                </div>
              </div>

              {/* Official Issued Tickets List with QR */}
              <div className="space-y-3">
                <h5 className="font-display font-bold text-sm text-white flex items-center justify-between">
                  <span>Mã vé gốc & QR vào cổng ({orderResult.tickets.length} vé)</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    VÉ CHÍNH THỨC
                  </span>
                </h5>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {orderResult.tickets.map((ticket, index) => {
                    const isCopied = copiedCode === ticket.ticketCode;
                    const qrData = JSON.stringify({
                      code: ticket.ticketCode,
                      event: ticket.eventName,
                      seat: ticket.seatZone,
                      owner: ticket.ownerEmail,
                      status: ticket.status,
                    });

                    return (
                      <div
                        key={ticket.id || index}
                        className="p-4 rounded-xl bg-[#0e1017] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        {/* Info */}
                        <div className="space-y-1.5 flex-1 min-w-0 text-left w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[#ff5945] bg-[#ff5945]/10 px-2 py-0.5 rounded uppercase">
                              Vé #{index + 1}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{ticket.seatZone}</span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#161822] p-2.5 rounded-lg border border-white/5">
                            <div className="font-mono font-extrabold text-sm sm:text-base text-white tracking-wider">
                              {ticket.ticketCode}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(ticket.ticketCode)}
                              className="px-2.5 py-1 rounded bg-[#282a32] hover:bg-[#33343d] text-[11px] font-mono text-[#CBD5E1] hover:text-white transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span className="material-symbols-outlined text-[14px]">content_copy</span>
                              <span>{isCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
                            </button>
                          </div>
                        </div>

                        {/* QR Canvas */}
                        <div className="p-2 bg-white rounded-lg shadow-md shrink-0 flex flex-col items-center">
                          <QRCodeCanvas value={qrData} size={84} level="H" marginSize={1} />
                          <span className="text-[8px] font-bold text-gray-800 tracking-wider mt-0.5">
                            QUÉT VÀO CỔNG
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nút chuyển sang sàn TicketShield */}
              <div className="p-3.5 rounded-xl bg-[#161822] border border-white/5">
                <Link
                  to="/"
                  id="btn-goto-marketplace-modal"
                  className="w-full p-3.5 rounded-xl bg-gradient-to-r from-[#191b26] to-[#202336] hover:from-[#202336] hover:to-[#2c3148] border border-[#4cd7f6]/30 hover:border-[#4cd7f6]/60 flex items-center justify-between transition-all group shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4cd7f6]/15 flex items-center justify-center text-[#4cd7f6] group-hover:bg-[#4cd7f6] group-hover:text-black transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white group-hover:text-[#4cd7f6] transition-colors flex items-center gap-1.5">
                        <span>Chuyển sang sàn đối tác TicketShield</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] border border-[#4cd7f6]/30 uppercase font-bold">
                          Marketplace
                        </span>
                      </div>
                      <div className="text-[11px] text-[#aa8984] mt-0.5">
                        Khám phá các sự kiện âm nhạc & mua bán lại vé được bảo hộ Escrow
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#4cd7f6] group-hover:translate-x-1 transition-transform text-[20px] shrink-0">
                    arrow_forward
                  </span>
                </Link>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-[#282a32] hover:bg-[#33343d] text-white text-xs font-bold transition-all text-center cursor-pointer"
              >
                Đóng và hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
