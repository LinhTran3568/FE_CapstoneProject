import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Plus, RotateCcw, Check, Sparkles, Ticket, ShieldCheck, KeyRound, ExternalLink } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';

const ORGANIZER_API = 'http://localhost:5001/api/organizer';

interface MockTicketDto {
  id: string;
  ticketCode: string;
  eventName: string;
  seatZone: string;
  originalPrice: number;
  ownerEmail: string;
  status: string;
  createdAt: string;
}

interface MockOtpDto {
  id: string;
  ticketCode: string;
  ownerEmail: string;
  otpCode: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export const OrganizerPortalPage: React.FC = () => {
  const { showToast } = useUIStore();
  const [tickets, setTickets] = useState<MockTicketDto[]>([]);
  const [otps, setOtps] = useState<MockOtpDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    try {
      const [ticketsRes, otpsRes] = await Promise.all([
        fetch(`${ORGANIZER_API}/tickets`),
        fetch(`${ORGANIZER_API}/otps`)
      ]);

      if (ticketsRes.ok) {
        const ticketData = await ticketsRes.json();
        setTickets(ticketData);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }

      if (otpsRes.ok) {
        const otpData = await otpsRes.json();
        setOtps(otpData);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showToast(`Đã sao chép ${label}: ${text}`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateTicket = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch(`${ORGANIZER_API}/tickets/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (res.ok) {
        const newTicket: MockTicketDto = await res.json();
        showToast(`Đã tạo vé mới: ${newTicket.ticketCode}`, 'success');
        fetchData();
      } else {
        showToast('Không thể tạo vé mới!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối đến máy chủ MockOrganizer!', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetTicket = async (ticketCode: string) => {
    try {
      const res = await fetch(`${ORGANIZER_API}/tickets/${encodeURIComponent(ticketCode)}/reset`, {
        method: 'POST'
      });

      if (res.ok) {
        showToast(`Đã khôi phục vé ${ticketCode} về trạng thái VALID!`, 'success');
        fetchData();
      } else {
        showToast('Không thể reset vé!', 'error');
      }
    } catch {
      showToast('Lỗi kết nối đến máy chủ MockOrganizer!', 'error');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Bạn có chắc muốn reset toàn bộ CSDL về 3 vé gốc ban đầu?')) return;
    try {
      const res = await fetch(`${ORGANIZER_API}/reset-all`, { method: 'POST' });
      if (res.ok) {
        showToast('Đã reset CSDL về dữ liệu mẫu ban đầu!', 'success');
        fetchData();
      }
    } catch {
      showToast('Lỗi kết nối!', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-[#e2e8f0] pt-24 pb-16 px-4 sm:px-6 md:px-8 font-sans selection:bg-[#FF5A36] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF5A36] to-amber-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-[#FF5A36]/20">
              MO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-wide font-display">MOCK ORGANIZER PORTAL</h1>
                <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  {isConnected ? 'ONLINE (5001)' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Cổng điều khiển ban tổ chức nội bộ • Hỗ trợ sinh vé test, tra cứu OTP và quản lý khóa vé</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateTicket}
              disabled={isGenerating || !isConnected}
              className="px-4 py-2 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 text-white text-xs font-bold font-display rounded-xl shadow-lg shadow-[#FF5A36]/20 hover:shadow-[#FF5A36]/40 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sinh Vé Random</span>
            </button>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>

            <button
              onClick={handleResetAll}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seed</span>
            </button>
          </div>
        </header>

        {/* LIVE OTP MONITOR */}
        <section className="p-6 bg-gradient-to-b from-[#111927] to-[#0d131d] border border-[#FF5A36]/30 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#FF5A36]" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Live OTP Monitor (Real-time)</h2>
                <p className="text-xs text-slate-400">Mã OTP tự động xuất hiện tại đây khi có yêu cầu xác thực từ TicketShield</p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Tự cập nhật: 3s</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {otps.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-slate-500 border border-white/5 rounded-xl">
                Chưa có mã OTP nào được yêu cầu gần đây.
              </div>
            ) : (
              otps.slice(0, 6).map((o) => (
                <div
                  key={o.id}
                  className={`p-4 bg-[#080c14] border rounded-xl space-y-2 relative transition-all ${
                    o.isUsed
                      ? 'border-white/5 opacity-60'
                      : 'border-[#FF5A36]/40 bg-[#FF5A36]/5 shadow-lg shadow-[#FF5A36]/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Vé: <strong className="text-white">{o.ticketCode}</strong></span>
                    <span>{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-2xl font-black font-mono tracking-widest text-[#FF5A36]">
                      {o.otpCode}
                    </span>
                    <button
                      onClick={() => handleCopy(o.otpCode, 'mã OTP')}
                      className="px-3 py-1.5 bg-white/10 hover:bg-[#FF5A36] text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                    >
                      {copiedCode === o.otpCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy OTP</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="truncate max-w-[160px]">{o.ownerEmail}</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                      o.isUsed ? 'bg-white/5 text-slate-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {o.isUsed ? 'ĐÃ DÙNG' : 'SẴN SÀNG'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* TICKET INVENTORY TABLE */}
        <section className="p-6 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Kho Vé Ban Tổ Chức (Mock Tickets)</h2>
            </div>
            <div className="text-xs text-slate-400">
              Tổng số vé: <span className="font-bold text-white font-mono">{tickets.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 pl-2">Mã Vé</th>
                  <th className="pb-3">Sự Kiện</th>
                  <th className="pb-3">Khu Vực Ghế</th>
                  <th className="pb-3">Giá Gốc</th>
                  <th className="pb-3">Email Chủ Vé</th>
                  <th className="pb-3">Trạng Thái</th>
                  <th className="pb-3 text-right pr-2">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Không có vé nào trong kho dữ liệu.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    let statusBadge = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                    if (t.status === 'LOCKED_FOR_RESALE') statusBadge = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
                    if (t.status === 'USED') statusBadge = 'bg-slate-500/20 text-slate-400 border border-slate-500/30';

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                            <span>{t.ticketCode}</span>
                            <button
                              onClick={() => handleCopy(t.ticketCode, 'mã vé')}
                              title="Sao chép mã vé"
                              className="text-slate-400 hover:text-[#FF5A36] transition-colors p-1"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-slate-300">{t.eventName}</td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">{t.seatZone}</td>
                        <td className="py-3 font-mono font-bold text-[#FF5A36]">
                          {Number(t.originalPrice).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 text-slate-400 truncate max-w-[160px]">{t.ownerEmail}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${statusBadge}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          {t.status !== 'VALID' ? (
                            <button
                              onClick={() => handleResetTicket(t.ticketCode)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 rounded-lg text-[10px] font-mono transition-all"
                            >
                              Reset VALID
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};
