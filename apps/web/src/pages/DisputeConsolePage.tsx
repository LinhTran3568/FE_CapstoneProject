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
    <div className="min-h-screen bg-[#05070A] text-slate-100 flex flex-col font-sans">
      {/* Console Header Bar */}
      <header className="bg-[#090C12] border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5A36] to-red-600 flex items-center justify-center text-white shadow-lg shadow-[#FF5A36]/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Dispute Resolution Console</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#FF5A36]/10 text-[#FF5A36] font-mono border border-[#FF5A36]/30">
                  STAFF MODE
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Giao diện đối soát & phán quyết khiếu nại 1-Click dành cho Quản trị viên và Moderator
              </p>
            </div>
          </div>

          {/* Quick Counter Stats (Accurate counts from backend) */}
          <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Chờ xử lý:</span>
              <span className="font-bold text-amber-400">{stats.open}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Đã hoàn tiền:</span>
              <span className="font-bold text-emerald-400">{stats.resolved}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Đã bác bỏ:</span>
              <span className="font-bold text-rose-400">{stats.rejected}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Console Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Toolbar: Status Tabs & Search Bar */}
        <div className="bg-[#0A0D14] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          {/* Status Tabs with accurate stats counts */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {[
              { key: 'OPEN', label: 'Chờ xử lý', count: stats.open },
              { key: 'RESOLVED', label: 'Đã hoàn tiền', count: stats.resolved },
              { key: 'REJECTED', label: 'Đã bác bỏ', count: stats.rejected },
              { key: 'ALL', label: 'Tất cả', count: stats.total }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-[#FF5A36] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & Refresh */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã khiếu nại, mã vé, tên sự kiện, email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF5A36] transition-colors"
              />
            </form>

            <button
              onClick={fetchDisputes}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF5A36]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error notification if API failed */}
        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDisputes}
              className="px-3 py-1 rounded bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[600px]">
          
          {/* Left Panel: Dossiers List (4 cols) */}
          <div className="lg:col-span-4 bg-[#0A0D14] border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Danh sách hồ sơ ({totalItems})</span>
              <span className="font-mono text-[11px] text-slate-500">Trang {currentPage}/{totalPages}</span>
            </div>

            {/* List Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
                  <span>Đang tải danh sách hồ sơ khiếu nại...</span>
                </div>
              ) : paginatedDisputes.length > 0 ? (
                paginatedDisputes.map((d) => {
                  const isSelected = d.disputeId === selectedDisputeId;
                  const isPending = d.status.toUpperCase() === 'OPEN';

                  return (
                    <div
                      key={d.disputeId}
                      onClick={() => setSelectedDisputeId(d.disputeId)}
                      className={`p-3.5 rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#FF5A36]/10 border-[#FF5A36]/60 shadow-lg shadow-[#FF5A36]/5'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono font-bold text-sm text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isPending ? 'bg-amber-400 animate-ping' : d.status.toUpperCase() === 'RESOLVED' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`} />
                          <span>{d.disputeCode}</span>
                        </span>
                        {getSlaBadge(d.createdAt, d.status)}
                      </div>

                      <div className="text-xs text-slate-300 font-medium truncate mb-1">
                        {d.eventTitle}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
                        <span>Buyer: {d.buyerName}</span>
                        <span className="text-[#FF5A36] font-bold">
                          {d.totalBuyerPaid ? d.totalBuyerPaid.toLocaleString('vi-VN') : '0'} ₫
                        </span>
                      </div>

                      {/* Auto recommendation badge */}
                      {d.recommendation && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            d.recommendation === 'RECOMMEND_REFUND'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {d.recommendation === 'RECOMMEND_REFUND' ? 'KHUYẾN NGHỊ: HOÀN TIỀN' : 'KHUYẾN NGHỊ: BÁC BỎ GIAN LẬN'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Inbox className="w-8 h-8 opacity-40 text-slate-400" />
                  <span>Không tìm thấy hồ sơ khiếu nại nào.</span>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trước</span>
                </button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1 text-slate-200"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Side-by-Side Dossier Detailed View (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            {activeDossier ? (
              <SideBySideDossierView dossier={activeDossier} onResolved={fetchDisputes} />
            ) : (
              <div className="h-full bg-[#0A0D14] border border-slate-800 rounded-xl flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
                <FileText className="w-12 h-12 mb-3 opacity-30 text-slate-400" />
                <p className="text-sm font-semibold text-slate-400">Chưa chọn hồ sơ khiếu nại</p>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng chọn 1 hồ sơ từ danh sách bên trái để đối soát và ra phán quyết 1-Click.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
