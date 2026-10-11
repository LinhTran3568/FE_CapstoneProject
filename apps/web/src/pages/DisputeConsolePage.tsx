import React, { useState, useEffect, useMemo } from 'react';
import { DisputeListItemDto, disputesApi } from '@ticketshield/api-client';
import { SideBySideDossierView } from '../components/dispute/SideBySideDossierView';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  Loader2,
  Inbox
} from 'lucide-react';

const PAGE_SIZE = 50;

interface DisputeStats {
  total: number;
  open: number;
  resolved: number;
  rejected: number;
}

export const DisputeConsolePage: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeListItemDto[]>([]);
  const [stats, setStats] = useState<DisputeStats>({
    total: 0,
    open: 0,
    resolved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected dossier & Pagination
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch disputes list and real-time status counts from backend API
  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await disputesApi.getDisputes(statusFilter, searchQuery);
      
      const items = overview?.items || [];
      setDisputes(items);
      setStats({
        total: overview?.totalCount ?? items.length,
        open: overview?.openCount ?? 0,
        resolved: overview?.resolvedCount ?? 0,
        rejected: overview?.rejectedCount ?? 0,
      });
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách khiếu nại:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách khiếu nại từ hệ thống.');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  // Reset to page 1 when search or status changes
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDisputes();
  };

  // Paginated list calculation
  const totalItems = disputes.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedDisputes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return disputes.slice(start, start + PAGE_SIZE);
  }, [disputes, currentPage]);

  // Set default selected dispute when list changes
  useEffect(() => {
    if (paginatedDisputes.length > 0) {
      if (!selectedDisputeId || !paginatedDisputes.some((d) => d.disputeId === selectedDisputeId)) {
        setSelectedDisputeId(paginatedDisputes[0].disputeId);
      }
    } else {
      setSelectedDisputeId(null);
    }
  }, [paginatedDisputes]);

  const activeDossier = useMemo(() => {
    return disputes.find((d) => d.disputeId === selectedDisputeId) || null;
  }, [disputes, selectedDisputeId]);

  // Compute SLA badge (72h SLA rule BR-D06)
  const getSlaBadge = (createdAt: string, status: string) => {
    if (status.toUpperCase() !== 'OPEN') return null;
    const createdTime = new Date(createdAt).getTime();
    const hoursElapsed = (Date.now() - createdTime) / (3600 * 1000);
    const hoursRemaining = Math.max(0, 72 - hoursElapsed);

    if (hoursElapsed >= 48) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
          <span>SLA Khẩn: {Math.round(hoursRemaining)}h còn lại</span>
        </span>
      );
    } else if (hoursElapsed >= 24) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>SLA: {Math.round(hoursRemaining)}h còn lại</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 flex items-center gap-1">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>SLA: {Math.round(hoursRemaining)}h</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Compact Header & Real-time Metrics ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAF0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#101722] tracking-tight">
            Dispute Resolution Console
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Đối soát chứng cứ song song và phán quyết tranh chấp 1-Click (Buyer Proof vs BTC Gate Access Logs)
          </p>
        </div>

        {/* Inline Quick Counters */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-white border border-[#E5EAF0] flex items-center gap-1.5 shadow-2xs">
            <span className="text-[#667085]">Chờ xử lý:</span>
            <span className="font-bold text-amber-600">{stats.open}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white border border-[#E5EAF0] flex items-center gap-1.5 shadow-2xs">
            <span className="text-[#667085]">Hoàn tiền:</span>
            <span className="font-bold text-emerald-600">{stats.resolved}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white border border-[#E5EAF0] flex items-center gap-1.5 shadow-2xs">
            <span className="text-[#667085]">Bác bỏ:</span>
            <span className="font-bold text-rose-600">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* ── Single Unified Toolbar ── */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F4F6F9] p-1 rounded-lg border border-[#E5EAF0]">
          {[
            { key: 'OPEN', label: 'Chờ xử lý', count: stats.open },
            { key: 'RESOLVED', label: 'Đã hoàn tiền', count: stats.resolved },
            { key: 'REJECTED', label: 'Đã bác bỏ', count: stats.rejected },
            { key: 'ALL', label: 'Tất cả', count: stats.total }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-[#101722] text-white font-semibold shadow-xs'
                  : 'text-[#667085] hover:text-[#101722] hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#667085]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Refresh Button */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã khiếu nại, mã vé, sự kiện..."
              className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#101722] placeholder-slate-400 focus:outline-none focus:border-[#F45135] focus:bg-white transition-colors"
            />
          </form>

          <button
            type="button"
            onClick={fetchDisputes}
            className="p-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 transition-colors shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error notification if API failed */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDisputes}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Main Case Management Split-Pane ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Panel: Dossiers List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E5EAF0] rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-3 bg-[#F4F6F9] border-b border-[#E5EAF0] flex items-center justify-between text-xs font-semibold text-[#667085]">
            <span>Danh sách vụ việc ({totalItems})</span>
            {totalPages > 1 && (
              <span className="font-mono text-[11px] text-[#667085]">Trang {currentPage}/{totalPages}</span>
            )}
          </div>

          {/* List Feed */}
          <div className="divide-y divide-[#E5EAF0]/80 overflow-y-auto max-h-[580px] p-1.5 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#667085] flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#F45135]" />
                <span>Đang tải danh sách khiếu nại...</span>
              </div>
            ) : paginatedDisputes.length > 0 ? (
              paginatedDisputes.map((d) => {
                const isSelected = d.disputeId === selectedDisputeId;
                const isPending = d.status.toUpperCase() === 'OPEN';

                return (
                  <div
                    key={d.disputeId}
                    onClick={() => setSelectedDisputeId(d.disputeId)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border text-xs ${
                      isSelected
                        ? 'bg-rose-50/70 border-[#F45135] shadow-xs'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-[#E5EAF0]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-[#101722] flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPending ? 'bg-amber-500 animate-pulse' : d.status.toUpperCase() === 'RESOLVED' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <span>{d.disputeCode}</span>
                      </span>
                      {getSlaBadge(d.createdAt, d.status)}
                    </div>

                    <div className="font-medium text-[#101722] truncate text-xs">
                      {d.eventTitle}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#667085] font-mono mt-1.5">
                      <span className="truncate max-w-[130px]">Buyer: {d.buyerName}</span>
                      <span className="text-[#F45135] font-bold">
                        {d.totalBuyerPaid ? d.totalBuyerPaid.toLocaleString('vi-VN') : '0'} ₫
                      </span>
                    </div>

                    {/* Auto recommendation badge */}
                    {d.recommendation && (
                      <div className="mt-2 pt-1.5 border-t border-[#E5EAF0] flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          d.recommendation === 'RECOMMEND_REFUND'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {d.recommendation === 'RECOMMEND_REFUND' ? 'Khuyến nghị: Hoàn tiền' : 'Khuyến nghị: Bác bỏ'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                <Inbox className="w-6 h-6 opacity-40 text-slate-400" />
                <p className="font-medium text-[#101722]">Không có khiếu nại</p>
                <p className="text-[11px] text-[#667085]">
                  Hồ sơ khiếu nại mới từ người mua sẽ hiển thị tại đây khi phát sinh.
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-2.5 bg-[#F4F6F9] border-t border-[#E5EAF0] flex items-center justify-between text-xs text-[#667085] font-mono">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded bg-white border border-[#E5EAF0] hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1 text-[#101722]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded bg-white border border-[#E5EAF0] hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1 text-[#101722]"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Evidence Dossier & Adjudication View (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          {activeDossier ? (
            <SideBySideDossierView dossier={activeDossier} onResolved={fetchDisputes} />
          ) : (
            <div className="bg-white border border-[#E5EAF0] rounded-xl p-8 text-center text-[#667085] text-xs shadow-sm flex flex-col items-center justify-center gap-2 min-h-[260px]">
              <FileText className="w-8 h-8 opacity-30 text-[#667085]" />
              <p className="font-semibold text-sm text-[#101722]">Chưa chọn hồ sơ khiếu nại</p>
              <p className="text-xs text-[#667085] max-w-sm">
                Chọn một hồ sơ từ danh sách bên trái để đối soát chứng cứ song song giữa ảnh của Buyer và nhật ký cổng soát vé BTC.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
