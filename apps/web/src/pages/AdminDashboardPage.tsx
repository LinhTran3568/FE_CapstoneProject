import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, disputesApi, ResaleFeeConfigDto, EscrowBufferConfigDto, EventResaleMarkupDto, DisputeListItemDto } from '@ticketshield/api-client';
import {
  LayoutDashboard,
  ShieldAlert,
  Percent,
  Clock,
  Ticket,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Real data states
  const [feeConfig, setFeeConfig] = useState<ResaleFeeConfigDto | null>(null);
  const [bufferConfig, setBufferConfig] = useState<EscrowBufferConfigDto | null>(null);
  const [events, setEvents] = useState<EventResaleMarkupDto[]>([]);
  const [disputesStats, setDisputesStats] = useState<{ total: number; open: number; resolved: number; rejected: number }>({
    total: 0,
    open: 0,
    resolved: 0,
    rejected: 0,
  });
  const [recentDisputes, setRecentDisputes] = useState<DisputeListItemDto[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [feeRes, bufferRes, eventsRes, disputesRes] = await Promise.allSettled([
        adminApi.getFeeSettings(),
        adminApi.getEscrowBuffer(),
        adminApi.getAllEventMarkups(),
        disputesApi.getDisputes('OPEN')
      ]);

      if (feeRes.status === 'fulfilled') setFeeConfig(feeRes.value);
      if (bufferRes.status === 'fulfilled') setBufferConfig(bufferRes.value);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value || []);
      if (disputesRes.status === 'fulfilled' && disputesRes.value) {
        setDisputesStats({
          total: disputesRes.value.totalCount,
          open: disputesRes.value.openCount,
          resolved: disputesRes.value.resolvedCount,
          rejected: disputesRes.value.rejectedCount,
        });
        setRecentDisputes((disputesRes.value.items || []).slice(0, 5));
      }
    } catch (err: any) {
      setError('Không thể tải toàn bộ dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  const formatDurationHours = (sec?: number) => {
    if (!sec) return '—';
    const hrs = (sec / 3600).toFixed(1);
    return `${hrs.endsWith('.0') ? hrs.slice(0, -2) : hrs} giờ (${sec.toLocaleString()}s)`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-16 flex flex-col items-center justify-center gap-3 text-[#667085] shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-[#F45135]" />
        <span className="text-xs font-mono">Đang đồng bộ chỉ số thời gian thực từ máy chủ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Compact Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAF0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#101722] tracking-tight">
            Bảng Điều Khiển Tổng Quan
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Giám sát vận hành sàn vé: Hồ sơ khiếu nại, biểu phí áp dụng và trần giá bán lại vé thời gian thực
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#667085]" />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Restrained Operational KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open Disputes */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider">
              Khiếu Nại Cần Xử Lý
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${disputesStats.open > 0 ? 'bg-rose-50 text-[#DC2626]' : 'bg-slate-50 text-slate-500'}`}>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#101722] font-mono">
              {disputesStats.open}
            </span>
            <span className="text-[11px] text-[#667085]">
              / {disputesStats.total} tổng hồ sơ
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085]">SLA mục tiêu: 72h</span>
            <Link to="/admin/disputes" className="text-[#F45135] font-semibold hover:underline flex items-center gap-1">
              Phán quyết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Monitored Events */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider">
              Sự Kiện Giám Sát
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ticket className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#101722] font-mono">
              {events.length}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">sự kiện áp dụng trần</span>
          </div>
          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085]">Anti-scalping: Bật</span>
            <Link to="/admin/events" className="text-[#F45135] font-semibold hover:underline flex items-center gap-1">
              Danh sách <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Active Fee Policy */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider">
              Biểu Phí Chuyển Nhượng
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F45135]/10 text-[#F45135] flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#101722] font-mono">
              {feeConfig ? `+${(feeConfig.buyerFeePercentage * 100).toFixed(0)}% / -${(feeConfig.sellerFeePercentage * 100).toFixed(0)}%` : '—'}
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085]">Min: {feeConfig ? `${(feeConfig.minimumBuyerFee / 1000).toFixed(0)}k / ${(feeConfig.minimumSellerFee / 1000).toFixed(0)}k` : '—'}</span>
            <Link to="/admin/config?tab=fees" className="text-[#F45135] font-semibold hover:underline flex items-center gap-1">
              Chỉnh phí <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Escrow Settlement Buffer */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider">
              Đệm Ký Quỹ Escrow
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#101722] font-mono">
              {bufferConfig ? formatDurationHours(bufferConfig.bufferSeconds) : '—'}
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085]">Cutoff: {bufferConfig ? formatDurationHours(bufferConfig.cutoffSeconds) : '—'}</span>
            <Link to="/admin/config?tab=buffer" className="text-[#F45135] font-semibold hover:underline flex items-center gap-1">
              Thiết lập <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Two Column Data Grid: Pending Disputes & Monitored Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Pending Dispute Dossiers (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E5EAF0] rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F45135]" />
              <h3 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
                Khiếu Nại Chờ Phán Quyết Gần Đây
              </h3>
            </div>
            <Link
              to="/admin/disputes"
              className="text-xs font-semibold text-[#F45135] hover:underline flex items-center gap-1"
            >
              Xem tất cả ({disputesStats.open}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentDisputes.length === 0 ? (
            <div className="py-6 text-center text-[#667085] space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-[#101722]">Không có khiếu nại tồn đọng</p>
              <p className="text-[11px]">Tất cả các giao dịch vé ký quỹ đang vận hành an toàn.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5EAF0]">
              {recentDisputes.map((d) => (
                <div key={d.disputeId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-xs text-[#101722] truncate">{d.eventTitle || 'Sự kiện'}</p>
                    <p className="text-[#667085] text-[11px] font-mono truncate">
                      #{d.disputeCode || d.disputeId.slice(0, 8)} • Buyer: {d.buyerName || 'Khách'} • Vé: {d.ticketCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {d.status}
                    </span>
                    <Link
                      to={`/admin/disputes`}
                      className="px-2.5 py-1 rounded-md bg-white border border-[#E5EAF0] hover:border-[#F45135] hover:text-[#F45135] text-xs font-medium transition-colors"
                    >
                      Đối soát
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Events with Resale Cap (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAF0] rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2.5">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#F45135]" />
              <h3 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
                Sự Kiện Áp Dụng Trần Giá
              </h3>
            </div>
            <Link
              to="/admin/events"
              className="text-xs font-semibold text-[#F45135] hover:underline flex items-center gap-1"
            >
              Xem tất cả ({events.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5EAF0]">
            {events.slice(0, 5).map((ev) => (
              <div key={ev.eventId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-xs text-[#101722] truncate">{ev.eventName}</p>
                  <p className="text-[#667085] text-[11px] truncate flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    <span>{ev.venue || 'Chưa cập nhật'}</span>
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    +{ev.maxResaleMarkupPercentage}% Max
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/admin/events"
              className="w-full py-2 rounded-lg border border-[#E5EAF0] hover:bg-slate-50 text-xs font-semibold text-[#101722] flex items-center justify-center gap-1.5 transition-colors block text-center"
            >
              <span>Quản lý trần giá vé</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F45135]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
