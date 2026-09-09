import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Bot, Lock, Store, ArrowRight, Flame, CheckCircle2, Ticket } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/event/EventCard';
import { SecurityBadge } from '../components/ui/SecurityBadge';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const { data: events, isLoading } = useEvents();

  return (
    <div className="space-y-16 py-6">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-navy-800 via-navy-850 to-navy-900 border border-navy-750 p-8 sm:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <SecurityBadge text="TicketShield AI Engine v2.4 • Active Protection" />

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Mua Bán Vé Sự Kiện An Toàn Với <span className="text-cyan-400">Trí Tuệ Nhân Tạo AI</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Giải pháp phát hiện Bot mua vé tự động hàng loạt & Sàn giao dịch sang nhượng vé verified P2P đầu tiên tại Việt Nam. Bảo vệ thanh toán bằng Escrow cho tới khi check-in cổng sự kiện.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/marketplace">
              <Button size="lg" className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Khám Phá Sàn Vé Verified
              </Button>
            </Link>
            <Link to="/tickets/verify">
              <Button size="lg" variant="outline" className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Xác Thực Vé Cần Bán
              </Button>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 border-t border-navy-750/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Chống Bot săn vé 99.4%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Vé chính chủ BTC</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Khóa tiền Escrow an toàn</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured High Demand Events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500 fill-red-500" />
              Sự Kiện Hot Được Bảo Vệ AI
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống giám sát tần suất mua hàng chống đầu cơ / phe vé
            </p>
          </div>
          <Link to="/events" className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
            Xem tất cả sự kiện <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-navy-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events?.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </section>

      {/* Verification & Escrow Process Explanation */}
      <section className="bg-navy-850 border border-navy-750 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <h3 className="text-base font-bold text-white">Xác Thực Mã Vé (AI Verification)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Người bán gửi thông tin vé. AI TicketShield đối soát trực tiếp với API của Ban Tổ Chức để cấp huy hiệu &quot;Verified by TicketShield&quot;.
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
            2
          </div>
          <h3 className="text-base font-bold text-white">Bảo Vệ Nạp Tiền Escrow</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tiền của người mua được khóa an toàn tại tài khoản Escrow. Người bán chỉ được nhận tiền khi người mua đã vào cổng thành công.
          </p>
        </div>

        <div className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            3
          </div>
          <h3 className="text-base font-bold text-white">Check-in Cổng & Giải Ngân</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Khi quét vé hợp lệ tại cổng sự kiện, hệ thống tự động phát lệnh giải ngân hoặc người mua tự xác nhận trên ứng dụng.
          </p>
        </div>
      </section>
    </div>
  );
};
