import React, { useState, useEffect } from 'react';
import { adminApi, ResaleFeeConfigDto, UpdateFeeSettingsRequest } from '@ticketshield/api-client';
import {
  Percent,
  Save,
  RefreshCw,
  Calculator,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign
} from 'lucide-react';

export const FeeSettingsControlPanel: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Baseline values loaded from server
  const [savedConfig, setSavedConfig] = useState<ResaleFeeConfigDto | null>(null);

  // Form input states (percentages in 0-100 format for display/input)
  const [buyerFeePercent, setBuyerFeePercent] = useState<number>(5.0);
  const [sellerFeePercent, setSellerFeePercent] = useState<number>(3.0);
  const [minBuyerFee, setMinBuyerFee] = useState<number>(10000);
  const [minSellerFee, setMinSellerFee] = useState<number>(10000);

  // Live Simulator Test Price state
  const [simulatedPrice, setSimulatedPrice] = useState<number>(1000000);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getFeeSettings();
      if (data) {
        setSavedConfig(data);
        setBuyerFeePercent(Number((data.buyerFeePercentage * 100).toFixed(2)));
        setSellerFeePercent(Number((data.sellerFeePercentage * 100).toFixed(2)));
        setMinBuyerFee(data.minimumBuyerFee);
        setMinSellerFee(data.minimumSellerFee);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải cấu hình biểu phí:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Không thể tải cấu hình biểu phí từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isDirty = savedConfig
    ? Math.abs(savedConfig.buyerFeePercentage * 100 - buyerFeePercent) > 0.001 ||
      Math.abs(savedConfig.sellerFeePercentage * 100 - sellerFeePercent) > 0.001 ||
      savedConfig.minimumBuyerFee !== minBuyerFee ||
      savedConfig.minimumSellerFee !== minSellerFee
    : false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation matching backend constraints
    if (buyerFeePercent < 0 || buyerFeePercent > 15) {
      setErrorMessage('Phí dịch vụ người mua phải từ 0% đến 15% (theo ràng buộc hệ thống).');
      return;
    }
    if (sellerFeePercent < 0 || sellerFeePercent > 10) {
      setErrorMessage('Phí dịch vụ người bán phải từ 0% đến 10% (theo ràng buộc hệ thống).');
      return;
    }
    if (minBuyerFee < 0 || minSellerFee < 0) {
      setErrorMessage('Mức phí tối thiểu không thể âm.');
      return;
    }

    try {
      setSaving(true);
      const payload: UpdateFeeSettingsRequest = {
        buyerFeePercentage: Number((buyerFeePercent / 100).toFixed(4)),
        sellerFeePercentage: Number((sellerFeePercent / 100).toFixed(4)),
        minimumBuyerFee: minBuyerFee,
        minimumSellerFee: minSellerFee,
      };

      await adminApi.updateFeeSettings(payload);
      setSavedConfig({
        buyerFeePercentage: payload.buyerFeePercentage,
        sellerFeePercentage: payload.sellerFeePercentage,
        minimumBuyerFee: payload.minimumBuyerFee,
        minimumSellerFee: payload.minimumSellerFee,
      });
      setSuccessMessage('Đã cập nhật biểu phí dịch vụ toàn sàn thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Lỗi khi lưu biểu phí.');
    } finally {
      setSaving(false);
    }
  };

  // Live Simulator Calculations
  const calculatedBuyerFee = Math.max(
    Math.round(simulatedPrice * (buyerFeePercent / 100)),
    minBuyerFee
  );
  const calculatedSellerFee = Math.max(
    Math.round(simulatedPrice * (sellerFeePercent / 100)),
    minSellerFee
  );
  const totalBuyerPays = simulatedPrice + calculatedBuyerFee;
  const netSellerReceives = Math.max(0, simulatedPrice - calculatedSellerFee);
  const platformRevenue = calculatedBuyerFee + calculatedSellerFee;

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

      {/* 2-Column Responsive Layout: 60% Form / 40% Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Fee Settings Form (7 cols) ── */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-[#E5EAF0] rounded-xl p-5 space-y-5 shadow-sm"
        >
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#101722] flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#F45135]" />
                <span>Biểu Phí Chuyển Nhượng Động (Resale Fees)</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Thiết lập tỷ lệ phí dịch vụ cho người mua và người bán vé trên toàn sàn
              </p>
            </div>
            <button
              type="button"
              onClick={fetchSettings}
              className="p-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 transition-colors"
              title="Làm mới từ máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
            </button>
          </div>

          {/* 2-Column Inputs Grid: Buyer Section vs Seller Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buyer Fee Column */}
            <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#E5EAF0] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-1.5">
                <span className="text-xs font-bold text-[#101722]">Phí Người Mua (Buyer)</span>
                {savedConfig && (
                  <span className="text-[10px] font-mono text-[#667085]">
                    Đang lưu: {(savedConfig.buyerFeePercentage * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#101722]">
                  Tỷ lệ phí dịch vụ (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={buyerFeePercent}
                    onChange={(e) => setBuyerFeePercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E5EAF0] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">%</span>
                </div>
                <p className="text-[10px] text-[#667085]">Giới hạn: 0% – 15%</p>
              </div>

              <div className="space-y-1 pt-1 border-t border-[#E5EAF0]/60">
                <label className="block text-xs font-semibold text-[#101722]">
                  Mức phí tối thiểu (VND)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={minBuyerFee}
                    onChange={(e) => setMinBuyerFee(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-[#E5EAF0] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">₫</span>
                </div>
                <p className="text-[10px] text-[#667085]">Áp dụng khi phí tính theo % thấp hơn mức này</p>
              </div>
            </div>

            {/* Seller Fee Column */}
            <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#E5EAF0] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-1.5">
                <span className="text-xs font-bold text-[#101722]">Phí Người Bán (Seller)</span>
                {savedConfig && (
                  <span className="text-[10px] font-mono text-[#667085]">
                    Đang lưu: {(savedConfig.sellerFeePercentage * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#101722]">
                  Tỷ lệ phí dịch vụ (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={sellerFeePercent}
                    onChange={(e) => setSellerFeePercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E5EAF0] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">%</span>
                </div>
                <p className="text-[10px] text-[#667085]">Giới hạn: 0% – 10%</p>
              </div>

              <div className="space-y-1 pt-1 border-t border-[#E5EAF0]/60">
                <label className="block text-xs font-semibold text-[#101722]">
                  Mức phí tối thiểu (VND)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={minSellerFee}
                    onChange={(e) => setMinSellerFee(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-white border border-[#E5EAF0] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">₫</span>
                </div>
                <p className="text-[10px] text-[#667085]">Khấu trừ bảo đảm chi phí xác minh & ký quỹ</p>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085]">
              {isDirty ? (
                <span className="text-amber-600 font-medium">● Có thay đổi chưa lưu</span>
              ) : (
                <span>Không có thay đổi nào</span>
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
              title={isDirty ? 'Lưu biểu phí mới' : 'Chưa có thay đổi nào để lưu'}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Biểu Phí Mới</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Right Column: Live Transaction Simulator (5 cols) ── */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAF0] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="border-b border-[#E5EAF0] pb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#101722] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#F45135]" />
              <span>Mô Phỏng Doanh Thu Trực Tiếp</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live
            </span>
          </div>

          {/* Simulated Price Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#101722]">
              Giá vé bán lại niêm yết mẫu (VND)
            </label>
            <div className="relative">
              <input
                type="number"
                step="50000"
                min="10000"
                value={simulatedPrice}
                onChange={(e) => setSimulatedPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">₫</span>
            </div>

            {/* Quick Price Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-[#667085]">Thử nhanh:</span>
              {[500000, 1000000, 2000000, 5000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSimulatedPrice(val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    simulatedPrice === val
                      ? 'bg-[#101722] text-white font-semibold'
                      : 'bg-slate-100 text-[#667085] hover:bg-slate-200 hover:text-[#101722]'
                  }`}
                >
                  {val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-[#F4F6F9] border border-[#E5EAF0] rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between text-[#667085]">
              <span>Giá vé niêm yết:</span>
              <span className="font-semibold text-[#101722]">{formatVND(simulatedPrice)}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-700">
              <span>+ Phí người mua ({buyerFeePercent}%):</span>
              <span className="font-semibold">+{formatVND(calculatedBuyerFee)}</span>
            </div>

            <div className="flex items-center justify-between text-[#101722] font-bold border-t border-[#E5EAF0] pt-2">
              <span className="font-sans">Tổng người mua trả:</span>
              <span className="text-[#F45135] text-sm">{formatVND(totalBuyerPays)}</span>
            </div>

            <div className="flex items-center justify-between text-rose-600 border-t border-[#E5EAF0] pt-2">
              <span>- Phí người bán ({sellerFeePercent}%):</span>
              <span className="font-semibold">-{formatVND(calculatedSellerFee)}</span>
            </div>

            <div className="flex items-center justify-between text-[#101722] font-bold border-t border-[#E5EAF0] pt-2">
              <span className="font-sans">Thực nhận về seller:</span>
              <span className="text-emerald-700 text-sm">{formatVND(netSellerReceives)}</span>
            </div>
          </div>

          {/* Platform Revenue Result Box */}
          <div className="p-3 rounded-xl bg-white border border-[#E5EAF0] flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-xs font-bold text-[#101722] block font-sans">
                Doanh thu phí sàn TicketShield:
              </span>
              <span className="text-[10px] text-[#667085] font-mono">
                Buyer Fee + Seller Fee
              </span>
            </div>
            <span className="font-extrabold text-[#F45135] text-base font-mono">
              +{formatVND(platformRevenue)}
            </span>
          </div>

          <p className="text-[11px] text-[#667085] text-center font-sans">
            Kết quả tính toán tức thì theo biểu phí đang điều chỉnh trên form.
          </p>
        </div>
      </div>
    </div>
  );
};
