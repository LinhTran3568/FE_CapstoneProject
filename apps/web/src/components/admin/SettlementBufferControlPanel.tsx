import React, { useState, useEffect } from 'react';
import { adminApi, EscrowBufferConfigDto, UpdateEscrowBufferRequest } from '@ticketshield/api-client';
import {
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const SettlementBufferControlPanel: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved baseline values from backend
  const [savedConfig, setSavedConfig] = useState<EscrowBufferConfigDto | null>(null);

  // Buffer and Cutoff values in seconds
  const [bufferSeconds, setBufferSeconds] = useState<number>(86400);
  const [cutoffSeconds, setCutoffSeconds] = useState<number>(7200);

  // Confirmation modal state for sensitive changes
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fetchBufferConfig = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getEscrowBuffer();
      if (data) {
        setSavedConfig(data);
        setBufferSeconds(data.bufferSeconds);
        setCutoffSeconds(data.cutoffSeconds);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải cấu hình đệm ký quỹ:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Không thể tải cấu hình đệm ký quỹ từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBufferConfig();
  }, []);

  const isDirty = savedConfig
    ? savedConfig.bufferSeconds !== bufferSeconds || savedConfig.cutoffSeconds !== cutoffSeconds
    : false;

  const handlePreSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (bufferSeconds < 1 || bufferSeconds > 2592000) {
      setErrorMessage('Thời gian đệm ký quỹ phải từ 1 đến 2.592.000 giây (tối đa 30 ngày).');
      return;
    }
    if (cutoffSeconds < 1 || cutoffSeconds > 2592000) {
      setErrorMessage('Thời gian cutoff trước sự kiện tối thiểu là 1 giây (tối đa 2.592.000 giây).');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    try {
      setSaving(true);
      const payload: UpdateEscrowBufferRequest = {
        bufferSeconds,
        cutoffSeconds,
      };

      const result = await adminApi.updateEscrowBuffer(payload);
      if (result) {
        setSavedConfig(result);
        setBufferSeconds(result.bufferSeconds);
        setCutoffSeconds(result.cutoffSeconds);
      }
      setSuccessMessage('Đã cập nhật cấu hình đệm ký quỹ an toàn và ranh giới cutoff thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Lỗi khi lưu thời gian đệm ký quỹ.');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (sec: number): string => {
    if (sec < 60) return `${sec} giây`;
    if (sec < 3600) return `${Math.floor(sec / 60)} phút`;
    if (sec < 86400) {
      const hours = (sec / 3600).toFixed(1);
      return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours} giờ`;
    }
    const days = (sec / 86400).toFixed(1);
    return `${days.endsWith('.0') ? days.slice(0, -2) : days} ngày`;
  };

  // Quick preset chips
  const bufferPresets = [
    { label: '30s (Dev)', value: 30 },
    { label: '1 giờ', value: 3600 },
    { label: '6 giờ', value: 21600 },
    { label: '12 giờ', value: 43200 },
    { label: '24 giờ', value: 86400 },
  ];

  const cutoffPresets = [
    { label: '15 phút', value: 900 },
    { label: '1 giờ', value: 3600 },
    { label: '2 giờ', value: 7200 },
    { label: '6 giờ', value: 21600 },
    { label: '12 giờ', value: 43200 },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Configuration Form (7 cols) ── */}
        <form
          onSubmit={handlePreSave}
          className="lg:col-span-7 bg-white border border-[#E5EAF0] rounded-xl p-5 space-y-5 shadow-sm"
        >
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#101722] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F45135]" />
                <span>Cấu Hình Tham Số Ký Quỹ</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Quy định thời gian giữ tiền an toàn và thời điểm khóa bán lại vé
              </p>
            </div>
            <button
              type="button"
              onClick={fetchBufferConfig}
              className="p-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 transition-colors"
              title="Làm mới từ máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
            </button>
          </div>

          {/* Section 1: Escrow Buffer Holding Period */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#101722]">
                1. Thời gian giữ tiền ký quỹ (Escrow Buffer)
              </label>
              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Quy đổi: {formatDuration(bufferSeconds)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max="2592000"
                step="1"
                value={bufferSeconds}
                onChange={(e) => setBufferSeconds(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] focus:bg-white pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">giây</span>
            </div>

            {/* Quick Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#667085]">Chọn nhanh:</span>
              {bufferPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setBufferSeconds(p.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    bufferSeconds === p.value
                      ? 'bg-[#101722] text-white font-semibold'
                      : 'bg-slate-100 text-[#667085] hover:bg-slate-200 hover:text-[#101722]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {savedConfig && (
              <p className="text-[11px] text-[#667085]">
                Đang áp dụng: <strong className="text-[#101722] font-mono">{savedConfig.bufferSeconds.toLocaleString()}s</strong> ({formatDuration(savedConfig.bufferSeconds)})
              </p>
            )}
          </div>

          <div className="border-t border-[#E5EAF0] pt-4 space-y-2">
            {/* Section 2: Resale Cutoff Threshold */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#101722]">
                2. Ranh giới đóng bán lại trước giờ G (Cutoff Threshold)
              </label>
              <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Quy đổi: {formatDuration(cutoffSeconds)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max="2592000"
                step="1"
                value={cutoffSeconds}
                onChange={(e) => setCutoffSeconds(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] focus:bg-white pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">giây</span>
            </div>

            {/* Quick Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#667085]">Chọn nhanh:</span>
              {cutoffPresets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setCutoffSeconds(p.value)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    cutoffSeconds === p.value
                      ? 'bg-[#101722] text-white font-semibold'
                      : 'bg-slate-100 text-[#667085] hover:bg-slate-200 hover:text-[#101722]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {savedConfig && (
              <p className="text-[11px] text-[#667085]">
                Đang áp dụng: <strong className="text-[#101722] font-mono">{savedConfig.cutoffSeconds.toLocaleString()}s</strong> ({formatDuration(savedConfig.cutoffSeconds)})
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085]">
              {isDirty ? (
                <span className="text-amber-600 font-medium">● Có thay đổi chưa lưu</span>
              ) : (
                <span>Không có thay đổi</span>
              )}
            </span>

            <button
              type="submit"
              disabled={!isDirty || saving}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDirty
                  ? 'bg-[#F45135] hover:bg-[#e0452a] text-white shadow-2xs cursor-pointer'
                  : 'bg-slate-100 text-[#667085] border border-[#E5EAF0] cursor-not-allowed opacity-60'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Cấu Hình</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Right Column: Compact Escrow Lifecycle Timeline (5 cols) ── */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAF0] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="border-b border-[#E5EAF0] pb-3">
            <h4 className="text-sm font-bold text-[#101722] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vòng Đời Ký Quỹ Escrow (Lifecycle)</span>
            </h4>
            <p className="text-xs text-[#667085] mt-0.5">
              Trình tự chuyển trạng thái từ khi thanh toán đến lúc giải ngân
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5EAF0]">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#101722] text-white flex items-center justify-center text-[9px] font-bold">
                1
              </div>
              <h5 className="text-xs font-bold text-[#101722]">Xác nhận thanh toán (Buyer Paid)</h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Người mua thanh toán thành công qua SePay. Tiền được khóa lập tức vào tài khoản ký quỹ Escrow an toàn.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                2
              </div>
              <h5 className="text-xs font-bold text-[#101722]">
                Thời gian đệm an toàn ({formatDuration(bufferSeconds)})
              </h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Két Escrow đóng băng tiền trong suốt khoảng thời gian đệm đã cấu hình, tạo cửa sổ an toàn để Buyer xác minh vé.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold">
                3
              </div>
              <h5 className="text-xs font-bold text-[#101722]">
                Khóa bán lại trước giờ G ({formatDuration(cutoffSeconds)})
              </h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Vé của sự kiện ngừng cho phép đăng bán lại trước giờ mở màn theo đúng ranh giới Cutoff để bảo đảm an ninh check-in.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                4
              </div>
              <h5 className="text-xs font-bold text-[#101722]">Giải ngân tiền cho người bán (Payout)</h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Hệ thống tự động giải phóng tiền ký quỹ về tài khoản ngân hàng của Seller sau khi hết đệm, <strong>với điều kiện không có tranh chấp hoặc khiếu nại đang mở</strong>.
              </p>
            </div>
          </div>

          {/* Operational Guard Note */}
          <div className="p-3 rounded-lg bg-[#F4F6F9] border border-[#E5EAF0] text-[11px] text-[#667085] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#F45135] shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý nghiệp vụ:</strong> Nếu có khiếu nại phát sinh từ người mua trong thời gian đệm, tiền ký quỹ sẽ bị đóng băng cho đến khi Quản trị viên/Moderator ra phán quyết tại Dispute Console.
            </span>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF0] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#101722]">Xác Nhận Thay Đổi Tham Số Ký Quỹ</h4>
                <p className="text-xs text-[#667085]">Chính sách này ảnh hưởng trực tiếp đến chu kỳ giữ tiền</p>
              </div>
            </div>

            <div className="bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg p-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#667085]">Đệm giữ Escrow mới:</span>
                <strong className="text-emerald-700">{formatDuration(bufferSeconds)} ({bufferSeconds.toLocaleString()}s)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Ranh giới Cutoff mới:</span>
                <strong className="text-amber-700">{formatDuration(cutoffSeconds)} ({cutoffSeconds.toLocaleString()}s)</strong>
              </div>
            </div>

            <p className="text-[11px] text-[#667085]">
              Thời gian đệm mới sẽ áp dụng ngay lập tức cho các giao dịch ký quỹ phát sinh từ thời điểm này trở đi. Bạn có chắc chắn muốn lưu?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5EAF0]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 text-xs font-medium"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-1.5 rounded-lg bg-[#F45135] hover:bg-[#e0452a] text-white text-xs font-semibold shadow-2xs"
              >
                Xác Nhận Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
