import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  ShieldCheck,
  X,
  Copy,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  User,
  Clock,
  Lock,
} from 'lucide-react';
import { useMyPurchasedTickets } from '../hooks/useMyTickets';
import { formatEventDateTime, formatVND } from '../utils/formatters';
import { useUIStore } from '../stores/uiStore';
import type { PurchasedTicketDto } from '@ticketshield/types';

export const MyTicketsPage: React.FC = () => {
  const { showToast } = useUIStore();
  const { data: tickets = [], isPending, isError, error, refetch, isFetching } = useMyPurchasedTickets();

  const [selectedTicket, setSelectedTicket] = useState<PurchasedTicketDto | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'VALID' | 'PENDING'>('ALL');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('Đã sao chép mã vé!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'VALID') return t.status === 'VALID' || t.status === 'IN_ESCROW';
    if (activeTab === 'PENDING') return t.status === 'PENDING_PAYMENT';
    return true;
  });

  const pendingCount = tickets.filter((t) => t.status === 'PENDING_PAYMENT').length;
  const validCount = tickets.filter((t) => t.status === 'VALID' || t.status === 'IN_ESCROW').length;

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 md:px-12 font-sans antialiased overflow-hidden">
      {/* Background Concert Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/ticket-bg.jpg"
          alt="Concert Background"
          className="w-full h-full object-cover opacity-20 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/85 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white uppercase tracking-tight">
              My Purchased Passes
            </h1>
            <p className="text-sm text-[#A3A8B3]">
              Vé điện tử chính chủ đã mua & các vé đang giữ chỗ chờ thanh toán qua TicketShield Escrow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách vé"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/marketplace"
              className="px-5 py-2.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 transition-all cursor-pointer"
            >
              + Săn Thêm Vé
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        {tickets.length > 0 && (
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tất cả ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('VALID')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'VALID'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vé chính thức ({validCount})</span>
            </button>
            {pendingCount > 0 && (
              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Đang giữ chỗ ({pendingCount})</span>
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isPending && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-6 bg-white/15 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
                <div className="h-10 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="py-16 px-6 bg-[#0A0D12] border border-white/10 rounded-3xl flex flex-col items-center text-center gap-3 shadow-2xl">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            <h3 className="text-lg font-bold text-white">Không thể tải danh sách vé</h3>
            <p className="text-xs text-zinc-400 max-w-md">
              {error instanceof Error ? error.message : 'Vui lòng kiểm tra lại kết nối mạng và thử lại.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isPending && !isError && filteredTickets.length === 0 && (
          <div className="py-16 px-6 bg-[#0A0D12] border border-white/10 rounded-3xl flex flex-col items-center text-center gap-4 shadow-2xl">
            <div className="p-4 rounded-2xl bg-[#FF5A36]/10 border border-[#FF5A36]/20 text-[#FF5A36]">
              <Ticket className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-display uppercase tracking-tight">
                {activeTab === 'PENDING' ? 'Không có vé nào đang chờ thanh toán' : 'Bạn chưa có vé nào'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                Khi bạn mua vé hoặc giữ chỗ thành công trên Chợ vé TicketShield, vé chính chủ với mã QR sẽ tự động hiển thị tại đây.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="mt-2 px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25"
            >
              Khám Phá Chợ Vé Ngay
            </Link>
          </div>
        )}

        {/* Real Ticket Passes Cards Grid */}
        {!isPending && !isError && filteredTickets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTickets.map((ticket) => {
              const isPendingPayment = ticket.status === 'PENDING_PAYMENT';
              const isEscrow = ticket.status === 'IN_ESCROW';

              return (
                <div
                  key={ticket.escrowId}
                  className={`group bg-[#0A0D12] border rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-0.5 ${
                    isPendingPayment
                      ? 'border-amber-500/40 hover:border-amber-400'
                      : 'border-white/10 hover:border-[#FF5A36]/40'
                  }`}
                >
                  {/* Decorative Glow */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
                      isPendingPayment ? 'bg-amber-500/15' : 'bg-[#FF5A36]/10'
                    }`}
                  />

                  {/* Pass Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#FF5A36] font-bold">DIGITAL PASS</span>
                      {isPendingPayment ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>CHỜ THANH TOÁN (GIỮ CHỖ)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>CHÍNH CHỦ (ĐÃ THANH TOÁN)</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-[#A3A8B3]">{ticket.ticketPassCode}</span>
                  </div>

                  {/* Event & Seat Details */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold font-display text-white group-hover:text-[#FF7252] transition-colors leading-snug">
                      {ticket.eventName}
                    </h3>
                    <div className="space-y-1.5 text-xs text-[#A3A8B3] font-mono">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#FF5A36] shrink-0" />
                        <span>{formatEventDateTime(ticket.eventStartAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{ticket.eventVenue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-white font-semibold">{ticket.seatZone}</span>
                      </div>
                      {ticket.recipientName && (
                        <div className="flex items-center gap-2 text-zinc-400 pt-1">
                          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Người sở hữu: <strong className="text-white">{ticket.recipientName}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        {isPendingPayment ? 'Số tiền cần thanh toán' : 'Giá thanh toán'}
                      </span>
                      <span className="text-base font-bold font-display text-white">
                        {formatVND(ticket.totalAmountPaid)}
                      </span>
                    </div>

                    {isPendingPayment ? (
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <QrCode className="w-4 h-4 text-black" />
                        <span>Mở Mã Thanh Toán VietQR</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#FF5A36] to-[#FF7252] hover:brightness-110 active:scale-95 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Xem Mã QR Soát Vé</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Modal: Entry QR Code OR Pending VietQR */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="relative w-full max-w-md bg-[#0b0e17] border border-[#232738] rounded-3xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      selectedTicket.status === 'PENDING_PAYMENT' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      selectedTicket.status === 'PENDING_PAYMENT' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  ></span>
                </span>
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wide ${
                    selectedTicket.status === 'PENDING_PAYMENT' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedTicket.status === 'PENDING_PAYMENT'
                    ? 'MÃ THANH TOÁN VIETQR (GIỮ CHỖ)'
                    : 'VÉ ĐÃ XÁC THỰC BAN TỔ CHỨC'}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Name */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold font-display text-white">{selectedTicket.eventName}</h3>
              <p className="text-xs font-mono text-[#FF5A36]">{selectedTicket.seatZone}</p>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,90,54,0.15)] border-2 border-[#FF5A36]/30">
              <img
                src={
                  selectedTicket.status === 'PENDING_PAYMENT' && selectedTicket.paymentReference
                    ? `https://img.vietqr.io/image/970422-0938434102-compact2.png?amount=${selectedTicket.totalAmountPaid}&addInfo=${encodeURIComponent(
                        selectedTicket.paymentReference
                      )}&accountName=NGUYEN%20HUNG%20THINH`
                    : selectedTicket.qrCodeImageUrl
                }
                alt="QR Pass"
                className="w-56 h-56 object-contain"
              />
              <span className="text-[10px] text-zinc-500 font-mono mt-2 uppercase tracking-wider font-semibold">
                {selectedTicket.status === 'PENDING_PAYMENT'
                  ? 'Quét mã VietQR bằng App Ngân Hàng để hoàn tất'
                  : 'Quét tại cổng soát vé sự kiện'}
              </span>
            </div>

            {/* Pass / Reference Code with Copy */}
            <div className="p-3 rounded-xl bg-[#141826] border border-[#262c40] flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  {selectedTicket.status === 'PENDING_PAYMENT' ? 'Nội dung chuyển khoản:' : 'Mã định danh vé:'}
                </span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {selectedTicket.status === 'PENDING_PAYMENT'
                    ? selectedTicket.paymentReference || selectedTicket.ticketPassCode
                    : selectedTicket.ticketPassCode}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    selectedTicket.status === 'PENDING_PAYMENT'
                      ? selectedTicket.paymentReference || selectedTicket.ticketPassCode
                      : selectedTicket.ticketPassCode
                  )
                }
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Note */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {selectedTicket.status === 'PENDING_PAYMENT'
                  ? 'Sau khi bạn chuyển khoản thành công, hệ thống sẽ tự động chuyển vé sang trạng thái chính chủ và cấp mã QR vào cửa.'
                  : `Mã QR này được cấp độc quyền cho ${
                      selectedTicket.recipientName || 'bạn'
                    }. Ban tổ chức sẽ quét mã này trực tiếp tại cổng để cấp quyền vào cửa.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
