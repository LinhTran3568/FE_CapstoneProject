import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { CheckoutOrderResult } from './CheckoutForm';

interface OrderSuccessProps {
  orderResult: CheckoutOrderResult;
  onResetOrder: () => void;
}

export const OrderSuccess: React.FC<OrderSuccessProps> = ({
  orderResult,
  onResetOrder,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Success Status Header */}
      <div className="bg-[#131B26] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
          Đặt vé thành công!
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-lg mx-auto leading-relaxed">
          Đơn hàng <span className="font-mono font-semibold text-white">{orderResult.orderId}</span> đã được ghi nhận. Vé điện tử chính thức đã được gửi tới hòm thư <span className="font-semibold text-white">{orderResult.buyerEmail}</span>.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded bg-[#0B0F17] text-[#CBD5E1] border border-white/10">
            Tổng tiền: <strong className="text-white">{orderResult.totalAmount.toLocaleString('vi-VN')} ₫</strong>
          </span>
          <span className="px-3 py-1 rounded bg-[#0B0F17] text-[#CBD5E1] border border-white/10">
            Số lượng: <strong className="text-white">{orderResult.tickets.length} vé</strong>
          </span>
          <span className="px-3 py-1 rounded bg-[#0B0F17] text-[#CBD5E1] border border-white/10">
            Phương thức: {orderResult.paymentMethod}
          </span>
        </div>
      </div>

      {/* Official Issued Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-white">
            Danh sách vé vào cổng chính thức ({orderResult.tickets.length} vé)
          </h3>
          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#16202E] hover:bg-[#1A2433] text-white border border-white/15 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>In vé điện tử</span>
          </button>
        </div>

        <div className="space-y-6">
          {orderResult.tickets.map((ticket, index) => {
            const isCopied = copiedCode === ticket.ticketCode;
            const qrPayload = JSON.stringify({
              code: ticket.ticketCode,
              event: ticket.eventName,
              seat: ticket.seatZone,
              owner: ticket.ownerEmail,
              status: ticket.status,
            });

            return (
              <div
                key={ticket.id || index}
                className="relative rounded-2xl bg-[#131B26] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col md:flex-row"
              >
                {/* Official Stamp */}
                <div className="absolute top-4 right-4 md:right-56 z-20 pointer-events-none select-none">
                  <span className="inline-block px-3 py-1 rounded border-2 border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-extrabold uppercase tracking-widest transform -rotate-6 bg-[#0B0F17]/80 backdrop-blur-sm">
                    OFFICIAL ISSUED
                  </span>
                </div>

                {/* Main Pass Section */}
                <div className="flex-1 p-6 sm:p-7 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#E11D48] uppercase tracking-wider font-semibold">
                      Vé sơ cấp Ban Tổ Chức #{index + 1}
                    </span>
                    <h4 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                      {ticket.eventName}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-white/5">
                    <div>
                      <span className="text-[#94A3B8]">Khu vực / Số ghế:</span>
                      <div className="font-bold text-white text-sm mt-0.5">{ticket.seatZone}</div>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Chủ vé đăng ký:</span>
                      <div className="font-medium text-[#CBD5E1] mt-0.5">{ticket.ownerName || orderResult.buyerName}</div>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Email định danh:</span>
                      <div className="font-mono text-[#CBD5E1] truncate mt-0.5">{ticket.ownerEmail}</div>
                    </div>
                    <div>
                      <span className="text-[#94A3B8]">Số điện thoại:</span>
                      <div className="font-mono text-[#CBD5E1] mt-0.5">{ticket.ownerPhone || orderResult.buyerPhone}</div>
                    </div>
                  </div>

                  {/* Ticket Code and Copy Action */}
                  <div className="pt-2 flex items-center justify-between bg-[#0B0F17] p-3 rounded-xl border border-white/10">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#94A3B8]">Mã vé điện tử</div>
                      <div className="font-mono font-extrabold text-base sm:text-lg text-white tracking-wider">
                        {ticket.ticketCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(ticket.ticketCode)}
                      className="px-3 py-1.5 rounded-lg bg-[#16202E] hover:bg-[#1A2433] text-xs font-mono font-medium text-[#CBD5E1] hover:text-white transition-colors border border-white/10 focus-visible:outline-2 focus-visible:outline-[#E11D48]"
                    >
                      {isCopied ? 'Đã sao chép!' : 'Sao chép mã'}
                    </button>
                  </div>
                </div>

                {/* Perforated Divider */}
                <div className="hidden md:block w-px border-r border-dashed border-white/20" />
                <div className="md:hidden h-px border-b border-dashed border-white/20" />

                {/* QR Code Entrance Stub */}
                <div className="w-full md:w-52 bg-[#0E1520] p-6 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="p-2.5 bg-white rounded-xl shadow-lg">
                    <QRCodeCanvas
                      value={qrPayload}
                      size={120}
                      level="H"
                      marginSize={1}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-[#94A3B8] leading-tight">
                    Quét tại cửa kiểm soát
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    TRẠNG THÁI: HỢP LỆ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Useful Secondary Market & Navigation Shortcuts */}
      <div className="bg-[#131B26] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-4">
        <h4 className="font-display font-bold text-base text-white">
          Các thao tác quản lý tiếp theo
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: View in My Tickets on TicketShield */}
          <Link
            to="/my-tickets"
            className="p-4 rounded-xl bg-[#0B0F17] hover:bg-[#1A2433] border border-white/10 transition-colors block space-y-1 text-left group"
          >
            <div className="text-xs font-bold text-white group-hover:text-[#E11D48] transition-colors">
              Ví vé TicketShield →
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Truy cập ví vé cá nhân để xem tất cả vé đã mua và chuẩn bị check-in.
            </p>
          </Link>

          {/* Action 2: Secondary Resale */}
          <Link
            to="/sell-ticket"
            className="p-4 rounded-xl bg-[#0B0F17] hover:bg-[#1A2433] border border-white/10 transition-colors block space-y-1 text-left group"
          >
            <div className="text-xs font-bold text-[#FF5A36] group-hover:underline">
              Ký gửi bán lại an toàn →
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Nếu bạn bận đột xuất, chuyển nhượng lại vé an toàn qua hệ thống Escrow TicketShield.
            </p>
          </Link>

          {/* Action 3: Buy more tickets */}
          <button
            type="button"
            onClick={onResetOrder}
            className="p-4 rounded-xl bg-[#0B0F17] hover:bg-[#1A2433] border border-white/10 transition-colors text-left space-y-1 group w-full"
          >
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
              Mua vé sự kiện khác →
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Khám phá thêm các đêm nhạc và buổi hòa nhạc khác đang mở bán.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
