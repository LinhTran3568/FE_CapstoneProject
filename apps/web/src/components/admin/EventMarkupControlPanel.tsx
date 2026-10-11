import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, EventResaleMarkupDto } from '@ticketshield/api-client';
import {
  Search,
  Edit2,
  Save,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Info,
  Copy,
  Check,
  TrendingUp,
  Filter
} from 'lucide-react';

export const EventMarkupControlPanel: React.FC = () => {
  const [events, setEvents] = useState<EventResaleMarkupDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [markupStatusFilter, setMarkupStatusFilter] = useState<'ALL' | 'POSITIVE' | 'ZERO'>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<EventResaleMarkupDto | null>(null);
  const [newMarkup, setNewMarkup] = useState<number>(0);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getAllEventMarkups();
      setEvents(data || []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách sự kiện:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Không thể tải danh sách sự kiện từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Distinct categories from events
  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.category) set.add(e.category.toUpperCase());
    });
    return Array.from(set);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = e.eventName.toLowerCase().includes(q);
        const matchesVenue = e.venue && e.venue.toLowerCase().includes(q);
        const matchesCategory = e.category && e.category.toLowerCase().includes(q);
        if (!matchesName && !matchesVenue && !matchesCategory) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (!e.category || e.category.toUpperCase() !== categoryFilter) return false;
      }

      // Markup status filter
      if (markupStatusFilter === 'POSITIVE' && e.maxResaleMarkupPercentage <= 0) return false;
      if (markupStatusFilter === 'ZERO' && e.maxResaleMarkupPercentage > 0) return false;

      return true;
    });
  }, [events, searchQuery, categoryFilter, markupStatusFilter]);

  const handleOpenEdit = (ev: EventResaleMarkupDto) => {
    setEditingEvent(ev);
    setNewMarkup(ev.maxResaleMarkupPercentage);
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveMarkup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (newMarkup < 0 || newMarkup > 100) {
      setErrorMessage('Biên độ trần giá phải nằm trong khoảng từ 0% đến 100%.');
      return;
    }

    try {
      setUpdating(true);
      setErrorMessage(null);
      const updated = await adminApi.updateEventMarkup(editingEvent.eventId, {
        maxResaleMarkupPercentage: newMarkup,
      });

      setSuccessMessage(`Đã cập nhật biên độ trần giá cho "${editingEvent.eventName}" thành +${newMarkup}%!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      setEvents((prev) =>
        prev.map((item) =>
          item.eventId === editingEvent.eventId
            ? (updated ? { ...item, ...updated } : { ...item, maxResaleMarkupPercentage: newMarkup })
            : item
        )
      );
      setEditingEvent(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Lỗi khi cập nhật trần giá sự kiện.');
    } finally {
      setUpdating(false);
    }
  };

  const computeCeiling = (base: number, markup: number) => {
    return Math.round(base * (1 + markup / 100));
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  return (
    <div className="space-y-4">
      {/* Alert Notices */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Concise Policy Notice */}
      <div className="px-3.5 py-2.5 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#667085] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#F45135] shrink-0" />
          <span>
            <strong className="text-[#101722]">Quy tắc chống phe vé:</strong> Giá bán lại tối đa ={' '}
            <code className="text-[#101722] font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">
              Giá gốc × (1 + % Trần giá)
            </code>
            . Hệ thống tự động từ chối niêm yết vượt ngưỡng này.
          </span>
        </div>
        <button
          type="button"
          onClick={fetchEvents}
          className="text-[11px] font-medium text-[#667085] hover:text-[#101722] flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Unified Data Toolbar */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sự kiện, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#101722] placeholder-[#667085] focus:outline-none focus:border-[#F45135] focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-2.5 py-1.5 text-xs text-[#101722] focus:outline-none focus:border-[#F45135] cursor-pointer"
          >
            <option value="ALL">Mọi phân loại</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Markup Filter */}
          <select
            value={markupStatusFilter}
            onChange={(e) => setMarkupStatusFilter(e.target.value as any)}
            className="bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-2.5 py-1.5 text-xs text-[#101722] focus:outline-none focus:border-[#F45135] cursor-pointer"
          >
            <option value="ALL">Mọi mức trần</option>
            <option value="POSITIVE">Có trần dương (&gt;0%)</option>
            <option value="ZERO">Giá gốc (0%)</option>
          </select>
        </div>

        {/* Counter */}
        <div className="text-[11px] font-mono text-[#667085] shrink-0">
          Hiển thị <strong>{filteredEvents.length}</strong> / {events.length} sự kiện
        </div>
      </div>

      {/* Compact Event Management Table */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] text-[#667085] border-b border-[#E5EAF0] uppercase font-mono font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Sự Kiện</th>
                <th className="py-2.5 px-4">Địa Điểm & Thời Gian</th>
                <th className="py-2.5 px-4">Phân Loại</th>
                <th className="py-2.5 px-4 text-center">Trần Giá Bán Lại</th>
                <th className="py-2.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#667085]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#F45135]" />
                      <span>Đang tải danh sách sự kiện...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#667085]">
                    <p className="font-medium text-[#101722]">Không tìm thấy sự kiện nào</p>
                    <p className="text-[11px] text-[#667085] mt-0.5">
                      Thử xóa từ khóa tìm kiếm hoặc đặt lại bộ lọc phân loại.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const hasMarkup = ev.maxResaleMarkupPercentage > 0;
                  return (
                    <tr key={ev.eventId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Event Column */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-[#101722]">{ev.eventName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-[#667085]">
                            ID: {ev.eventId.slice(0, 8)}...{ev.eventId.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(ev.eventId, e)}
                            title="Sao chép toàn bộ Event ID"
                            className="text-[#667085] hover:text-[#101722] p-0.5 rounded transition-colors"
                          >
                            {copiedId === ev.eventId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Venue & Date Column */}
                      <td className="py-3 px-4 text-[#667085]">
                        <div className="flex items-center gap-1.5 text-xs text-[#101722]">
                          <Building className="w-3.5 h-3.5 text-[#667085] shrink-0" />
                          <span className="truncate max-w-[200px]">{ev.venue || 'Chưa cập nhật'}</span>
                        </div>
                        {ev.eventStartAt && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#667085] mt-0.5">
                            <Calendar className="w-3 h-3 text-[#667085] shrink-0" />
                            <span>{new Date(ev.eventStartAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {ev.category || 'CONCERT'}
                        </span>
                      </td>

                      {/* Resale Price Ceiling */}
                      <td className="py-3 px-4 text-center">
                        {hasMarkup ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            +{ev.maxResaleMarkupPercentage}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            0% (Giá gốc)
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ev)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E5EAF0] text-[#101722] hover:border-[#F45135] hover:text-[#F45135] text-xs font-medium transition-colors shadow-2xs inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Chỉnh trần</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF0] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#101722]">
                  Cài Đặt Trần Giá Bán Lại Sự Kiện
                </h4>
                <p className="text-xs text-[#667085] mt-0.5 truncate max-w-xs">
                  {editingEvent.eventName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1 rounded-lg text-[#667085] hover:text-[#101722] hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarkup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#101722]">
                  Biên độ trần giá tối đa (% cho phép vượt giá gốc)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={newMarkup}
                    onChange={(e) => setNewMarkup(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#667085]">%</span>
                </div>
                <p className="text-[11px] text-[#667085]">
                  0% = Bán lại không được vượt giá gốc. Tối đa cho phép: 100%.
                </p>
              </div>

              {/* Price Ceiling Calculator Demo in Modal */}
              <div className="p-3 rounded-lg bg-[#F4F6F9] border border-[#E5EAF0] space-y-1.5 text-xs font-mono">
                <div className="font-semibold text-[#101722] flex items-center justify-between font-sans">
                  <span>Mô phỏng trần giá:</span>
                  <span className="text-[#F45135] font-mono font-bold">+{newMarkup}%</span>
                </div>
                <div className="flex items-center justify-between text-[#667085] text-[11px]">
                  <span>Vé gốc 500.000 ₫:</span>
                  <span className="font-semibold text-[#101722]">{formatVND(computeCeiling(500000, newMarkup))}</span>
                </div>
                <div className="flex items-center justify-between text-[#667085] text-[11px]">
                  <span>Vé gốc 1.000.000 ₫:</span>
                  <span className="font-semibold text-[#101722]">{formatVND(computeCeiling(1000000, newMarkup))}</span>
                </div>
                <div className="flex items-center justify-between text-[#667085] text-[11px]">
                  <span>Vé gốc 2.000.000 ₫:</span>
                  <span className="font-semibold text-[#101722]">{formatVND(computeCeiling(2000000, newMarkup))}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 text-xs font-medium"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 rounded-lg bg-[#F45135] hover:bg-[#e0452a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Thay Đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
