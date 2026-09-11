import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { 
  PlusCircle, 
  ShieldCheck, 
  Ticket, 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  QrCode, 
  ArrowUpRight,
  Sparkles,
  X,
  FileCheck
} from 'lucide-react';

export const ResellerConsole: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Demo Resale Form state
  const [eventTitle, setEventTitle] = useState('');
  const [seatZone, setSeatZone] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [resalePrice, setResalePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !resalePrice) {
      showToast('Vui lòng điền đầy đủ thông tin vé niêm yết!', 'warning');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      showToast(`Đã tạo niêm yết thành công cho sự kiện "${eventTitle}"!`, 'success');
      setEventTitle('');
      setSeatZone('');
      setOriginalPrice('');
      setResalePrice('');
    }, 800);
  };

  return (
    <section id="reseller-console" className="w-full bg-[#05070A] py-8 px-6 md:px-12 border-b border-white/10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Banner Top: Reseller Welcome & Status Badge */}
        <div className="bg-gradient-to-r from-[#0A0D12] via-[#0F141C] to-[#0A0D12] border border-[#FF5A36]/30 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Subtle Glow Background */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#FF5A36]/20 border border-[#FF5A36]/50 text-[#FF5A36] text-xs font-bold font-display uppercase tracking-widest rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Reseller Portal Active
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight">
              Xin chào Reseller, <span className="text-[#FF5A36]">{user?.fullName || 'Đối Tác'}</span>!
            </h2>
            <p className="text-sm text-[#A3A8B3] max-w-2xl leading-relaxed">
              Chào mừng bạn trở lại giao diện quản trị người bán. Tất cả các vé rao bán đều được bảo vệ bởi thuật toán xác thực TicketShield Escrow & Smart Verification.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/30 hover:shadow-[#FF5A36]/50 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Đăng Bán Vé Mới</span>
            </button>
          </div>
        </div>

        {/* Reseller Analytics Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Active Listings */}
          <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-3 hover:border-[#FF5A36]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A3A8B3] font-display uppercase tracking-wider">Vé Đang Niêm Yết</span>
              <div className="p-2 rounded-xl bg-[#FF5A36]/10 text-[#FF5A36]">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-display text-white">8 <span className="text-xs font-normal text-[#A3A8B3]">suất vé</span></span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +2 tuần này
              </span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#FF5A36] h-full w-[70%]" />
            </div>
          </div>

          {/* Card 2: Escrow Holdings */}
          <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A3A8B3] font-display uppercase tracking-wider">Tiền Ký Quỹ Escrow</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-display text-white">14.200.000 <span className="text-xs font-normal text-[#A3A8B3]">VNĐ</span></span>
              <span className="text-xs text-cyan-400 font-mono">Đang tạm giữ</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full w-[85%]" />
            </div>
          </div>

          {/* Card 3: Total Released Revenue */}
          <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A3A8B3] font-display uppercase tracking-wider">Doanh Thu Đã Thực Nhận</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-display text-white">32.500.000 <span className="text-xs font-normal text-[#A3A8B3]">VNĐ</span></span>
              <span className="text-xs text-emerald-400 font-mono">Đã thanh toán</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[100%]" />
            </div>
          </div>

          {/* Card 4: Seller Reputation */}
          <div className="bg-[#0A0D12] border border-white/10 p-5 rounded-2xl space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A3A8B3] font-display uppercase tracking-wider">Chỉ Số Uy Tín Reseller</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-display text-white">99,8% <span className="text-xs font-normal text-[#A3A8B3]">Tỷ lệ hợp lệ</span></span>
              <span className="text-xs text-amber-400 font-mono">Hạng Platinum</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[99%]" />
            </div>
          </div>

        </div>

        {/* Reseller Toolbar Links */}
        <div id="my-listings" className="bg-[#0A0D12] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-display text-[#A3A8B3] uppercase tracking-wider">
            <QrCode className="w-4 h-4 text-[#FF5A36]" />
            <span>Công cụ Reseller nhanh:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-[#FF5A36]/40 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Đăng Bán Vé Mới</span>
            </button>
            <a
              href="#events"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xem Các Vé Đang Bán</span>
            </a>
            <a
              href="#security"
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kiểm Tra Quy Trình Escrow</span>
            </a>
          </div>
        </div>

      </div>

      {/* Modal: Create Resale Listing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0A0D12] border border-white/20 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#A3A8B3] hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs text-[#FF5A36] font-bold font-display uppercase tracking-widest">Reseller Action</span>
              <h3 className="text-2xl font-bold font-display text-white">Đăng Bán Vé Mới (Resale)</h3>
              <p className="text-xs text-[#A3A8B3]">
                Điền thông tin vé để niêm yết lên sàn TicketShield. Hệ thống sẽ tự động xác thực chữ ký số từ Ban Tổ Chức.
              </p>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1 font-display">Tên Sự Kiện</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Anh Trai Vượt Ngàn Chông Gai Concert"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1 font-display">Khu Vực / Hàng / Số Ghế</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khái Hưng - Khu VIP A - Hàng 03 - Ghế 12"
                  value={seatZone}
                  onChange={(e) => setSeatZone(e.target.value)}
                  className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1 font-display">Giá Gốc (VNĐ)</label>
                  <input
                    type="number"
                    placeholder="1.500.000"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div>
                  <label className="block text-[#A3A8B3] font-semibold uppercase tracking-wider mb-1 font-display">Giá Rao Bán (VNĐ)</label>
                  <input
                    type="number"
                    placeholder="1.800.000"
                    value={resalePrice}
                    onChange={(e) => setResalePrice(e.target.value)}
                    className="w-full bg-[#05070A] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-[#A3A8B3]/50 focus:outline-none focus:border-[#FF5A36]"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                🛡️ **Quy định Reseller**: Mọi giao dịch rao bán vé sẽ qua cổng Ký Quỹ Escrow TicketShield. Tiền sẽ giải ngân sau khi vé được check-in hợp lệ tại sự kiện.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display uppercase tracking-widest rounded-xl shadow-lg shadow-[#FF5A36]/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Đang xử lý tạo niêm yết...</span>
                ) : (
                  <>
                    <span>Tạo Niêm Yết Vé Ngay</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
