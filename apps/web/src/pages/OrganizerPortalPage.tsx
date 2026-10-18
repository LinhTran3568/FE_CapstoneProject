import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, RefreshCw, Plus, RotateCcw, Check, Ticket, KeyRound, Activity, Sliders, AlertCircle, Minus } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import {
  getOrganizerApiBase,
  organizerStoreApi,
  type AntiBotAnalyticsSummary,
  type AntiBotPolicyConfig,
} from '@ticketshield/api-client';

const ORGANIZER_API = getOrganizerApiBase();

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
  const [activeTab, setActiveTab] = useState<'security' | 'inventory'>('security');

  // Inventory state
  const [tickets, setTickets] = useState<MockTicketDto[]>([]);
  const [otps, setOtps] = useState<MockOtpDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Security & Policy state (US-8.4)
  const [analytics, setAnalytics] = useState<AntiBotAnalyticsSummary | null>(null);
  const [allowThreshold, setAllowThreshold] = useState<number>(0.35);
  const [blockThreshold, setBlockThreshold] = useState<number>(0.75);
  const [challengeMode, setChallengeMode] = useState<'recaptcha' | 'turnstile' | 'sequential'>('recaptcha');
  const [isSavingPolicy, setIsSavingPolicy] = useState<boolean>(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const hasInitializedPolicy = useRef<boolean>(false);

  // Interactive Dual-Thumb Range Bar Drag state
  const barRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<'allow' | 'block' | null>(null);

  const handlePointerDown = (which: 'allow' | 'block') => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag(which);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDrag || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const val = Math.max(0.01, Math.min(0.99, Math.round(ratio * 100) / 100));

    if (activeDrag === 'allow') {
      const maxVal = Math.max(0.01, Math.round((blockThreshold - 0.02) * 100) / 100);
      setAllowThreshold(Math.min(val, maxVal));
    } else if (activeDrag === 'block') {
      const minVal = Math.min(0.99, Math.round((allowThreshold + 0.02) * 100) / 100);
      setBlockThreshold(Math.max(val, minVal));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDrag) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
    }
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const val = Math.max(0.01, Math.min(0.99, Math.round(ratio * 100) / 100));

    const distToAllow = Math.abs(val - allowThreshold);
    const distToBlock = Math.abs(val - blockThreshold);
    if (distToAllow <= distToBlock) {
      const maxVal = Math.max(0.01, Math.round((blockThreshold - 0.02) * 100) / 100);
      setAllowThreshold(Math.min(val, maxVal));
    } else {
      const minVal = Math.min(0.99, Math.round((allowThreshold + 0.02) * 100) / 100);
      setBlockThreshold(Math.max(val, minVal));
    }
  };

  const stepAllow = (delta: number) => {
    setAllowThreshold((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      const minVal = 0.01;
      const maxVal = Math.max(0.01, Math.round((blockThreshold - 0.01) * 100) / 100);
      return Math.max(minVal, Math.min(maxVal, next));
    });
  };

  const stepBlock = (delta: number) => {
    setBlockThreshold((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      const minVal = Math.min(0.99, Math.round((allowThreshold + 0.01) * 100) / 100);
      const maxVal = 0.99;
      return Math.max(minVal, Math.min(maxVal, next));
    });
  };

  const handleAllowInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const maxVal = Math.max(0.01, Math.round((blockThreshold - 0.01) * 100) / 100);
    setAllowThreshold(Math.max(0.01, Math.min(maxVal, val)));
  };

  const handleBlockInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const minVal = Math.min(0.99, Math.round((allowThreshold + 0.01) * 100) / 100);
    setBlockThreshold(Math.max(minVal, Math.min(0.99, val)));
  };

  const fetchInventory = useCallback(async () => {
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

  const fetchAnalytics = useCallback(async (forceSyncForm = false) => {
    try {
      const data = await organizerStoreApi.getAntiBotAnalytics();
      setAnalytics(data);
      // Chỉ khởi tạo giá trị form vào lần đầu tiên hoặc khi yêu cầu forceSyncForm (tránh ghi đè khi đang chỉnh sửa)
      if (data.currentPolicy && (!hasInitializedPolicy.current || forceSyncForm)) {
        setAllowThreshold(data.currentPolicy.allowThreshold);
        setBlockThreshold(data.currentPolicy.blockThreshold);
        if (data.currentPolicy.challengeMode) {
          setChallengeMode(data.currentPolicy.challengeMode);
        }
        hasInitializedPolicy.current = true;
      }
      setIsConnected(true);
    } catch {
      // Keep existing state if offline
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchAnalytics(false);
    const interval = setInterval(() => {
      if (activeTab === 'inventory') {
        fetchInventory();
      } else {
        fetchAnalytics(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchInventory, fetchAnalytics, activeTab]);

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
        fetchInventory();
      } else {
        showToast('Không thể tạo vé mới', 'error');
      }
    } catch {
      showToast('Lỗi kết nối tới máy chủ ban tổ chức', 'error');
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
        showToast(`Đã đặt lại trạng thái vé ${ticketCode}`, 'success');
        fetchInventory();
      } else {
        showToast('Không thể đặt lại trạng thái vé', 'error');
      }
    } catch {
      showToast('Lỗi kết nối tới máy chủ ban tổ chức', 'error');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Khôi phục toàn bộ vé mẫu về trạng thái ban đầu?')) return;
    try {
      const res = await fetch(`${ORGANIZER_API}/reset-all`, { method: 'POST' });
      if (res.ok) {
        showToast('Đã khôi phục dữ liệu ban đầu', 'success');
        fetchInventory();
      }
    } catch {
      showToast('Lỗi kết nối tới máy chủ', 'error');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicyError(null);

    if (allowThreshold >= blockThreshold) {
      setPolicyError(`Ngưỡng Cho phép (${allowThreshold}) phải nhỏ hơn Ngưỡng Tạm dừng (${blockThreshold})`);
      return;
    }

    try {
      setIsSavingPolicy(true);
      const updated = await organizerStoreApi.updateAntiBotPolicy({
        allowThreshold,
        blockThreshold,
        challengeMode,
        updatedBy: 'OrganizerAdmin'
      });
      showToast(`Đã cập nhật cấu hình: Cho phép < ${updated.allowThreshold}, Tạm dừng >= ${updated.blockThreshold}`, 'success');
      fetchAnalytics();
    } catch (err: any) {
      setPolicyError(err.message || 'Cập nhật ngưỡng thất bại');
      showToast(err.message || 'Cập nhật ngưỡng thất bại', 'error');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleResetPolicy = async () => {
    try {
      setIsSavingPolicy(true);
      const res = await organizerStoreApi.resetAntiBotPolicy();
      setAllowThreshold(res.allowThreshold);
      setBlockThreshold(res.blockThreshold);
      setChallengeMode('recaptcha');
      showToast('Đã khôi phục cấu hình mặc định (0.35 / 0.75 - reCAPTCHA)', 'success');
      fetchAnalytics();
    } catch {
      showToast('Không thể đặt lại ngưỡng chính sách', 'error');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const handleResetAnalytics = async () => {
    try {
      await organizerStoreApi.resetAntiBotAnalytics();
      showToast('Đã đặt lại bộ đếm lưu lượng', 'success');
      fetchAnalytics();
    } catch {
      showToast('Lỗi khi đặt lại bộ đếm', 'error');
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
                <h1 className="text-lg font-bold text-white tracking-wide font-display">CỔNG QUẢN LÝ BAN TỔ CHỨC</h1>
                <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  {isConnected ? 'TRỰC TUYẾN (5001)' : 'MẤT KẾT NỐI'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={activeTab === 'inventory' ? fetchInventory : () => fetchAnalytics(true)}
              disabled={isLoading}
              className="px-3 py-2 bg-white/10 hover:bg-white/10 text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Giám sát Lưu lượng & Ngưỡng lọc</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#FF5A36] text-white shadow-lg shadow-[#FF5A36]/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Kho vé & Mã xác thực</span>
          </button>
        </div>

        {/* TAB 1: SECURITY & POLICY ANALYTICS (US-8.4) */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 bg-[#0d131d] border border-white/10 rounded-2xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Tổng lượt xử lý</span>
                <p className="text-2xl font-bold font-mono text-white">
                  {analytics?.totalEvaluations ?? 0}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Độ trễ TB: {analytics?.averageLatencyMs ?? 0}ms</span>
              </div>

              <div className="p-4 bg-[#0d131d] border border-emerald-500/20 rounded-2xl space-y-1">
                <span className="text-[11px] font-medium text-emerald-400">Cho phép</span>
                <p className="text-2xl font-bold font-mono text-emerald-400">
                  {analytics?.allowCount ?? 0}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">{analytics?.allowPercentage ?? 0}% tổng lượt</span>
              </div>

              <div className="p-4 bg-[#0d131d] border border-amber-500/20 rounded-2xl space-y-1">
                <span className="text-[11px] font-medium text-amber-400">Yêu cầu xác thực</span>
                <p className="text-2xl font-bold font-mono text-amber-400">
                  {analytics?.challengeCount ?? 0}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">{analytics?.challengePercentage ?? 0}% tổng lượt</span>
              </div>

              <div className="p-4 bg-[#0d131d] border border-rose-500/20 rounded-2xl space-y-1">
                <span className="text-[11px] font-medium text-rose-400">Tạm dừng</span>
                <p className="text-2xl font-bold font-mono text-rose-400">
                  {analytics?.blockCount ?? 0}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">{analytics?.blockPercentage ?? 0}% tổng lượt</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 bg-[#0d131d] border border-white/10 rounded-2xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Ngưỡng hiện hành</span>
                <div className="text-xs font-mono pt-1 text-slate-300">
                  <div>Duyệt: &lt; {analytics?.currentPolicy?.allowThreshold ?? 0.35}</div>
                  <div>Chặn: &ge; {analytics?.currentPolicy?.blockThreshold ?? 0.75}</div>
                </div>
              </div>
            </div>

            {/* Dynamic Policy Configuration Panel */}
            <section className="p-5 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FF5A36]" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Cấu hình Ngưỡng Lọc Tự động</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAllowThreshold(0.10);
                      setBlockThreshold(0.75);
                    }}
                    disabled={isSavingPolicy}
                    className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium rounded-xl transition-all cursor-pointer"
                    title="Hạ ngưỡng cho phép xuống 0.10 để ép bật CAPTCHA trên web"
                  >
                    Bật CAPTCHA (0.10 / 0.75)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAllowThreshold(0.10);
                      setBlockThreshold(0.20);
                    }}
                    disabled={isSavingPolicy}
                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium rounded-xl transition-all cursor-pointer"
                    title="Hạ ngưỡng chặn xuống 0.20 để ép chặn 429 trên web"
                  >
                    Chặn Bot (0.10 / 0.20)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPolicy}
                    disabled={isSavingPolicy}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
                  >
                    Mặc định (0.35 / 0.75)
                  </button>
                </div>
              </div>

              <form onSubmit={handleSavePolicy} className="space-y-4">
                {/* Method selector for Tier 2 Challenge */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#080c14] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                      Phương thức Thử thách (Tier 2):
                    </span>
                    <select
                      value={challengeMode}
                      onChange={(e) => setChallengeMode(e.target.value as 'recaptcha' | 'turnstile' | 'sequential')}
                      className="px-3 py-1.5 bg-[#0d131d] border border-white/10 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-[#FF5A36]"
                    >
                      <option value="recaptcha">Google reCAPTCHA v2 (Hình ảnh)</option>
                      <option value="sequential">Tuần tự 2 bước (Turnstile → reCAPTCHA)</option>
                      <option value="turnstile">Cloudflare Turnstile (Tự động)</option>
                    </select>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Kích hoạt khi điểm rủi ro rơi vào Vùng xám (giữa Ngưỡng Cho phép và Ngưỡng Tạm dừng)
                  </span>
                </div>

                {/* Interactive Multi-segment Dual-Thumb Range Bar with Direct Stepper Inputs */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Cho phép (&lt; {allowThreshold.toFixed(2)})
                    </span>
                    <span className="text-amber-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      Xác minh ({allowThreshold.toFixed(2)} - {blockThreshold.toFixed(2)})
                    </span>
                    <span className="text-rose-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      Tạm dừng (&ge; {blockThreshold.toFixed(2)})
                    </span>
                  </div>

                  {/* Dual Thumb Draggable Track with Embedded Steppers */}
                  <div className="relative py-12 select-none touch-none">
                    {/* The Multi-color background bar */}
                    <div
                      ref={barRef}
                      onClick={handleBarClick}
                      className="w-full h-4 bg-white/10 rounded-full overflow-hidden flex cursor-pointer relative shadow-inner"
                      title="Bấm hoặc kéo các mốc tròn trên thanh để chỉnh ngưỡng trực tiếp"
                    >
                      <div
                        style={{ width: `${Math.min(Math.max(allowThreshold * 100, 0), 100)}%` }}
                        className="h-full bg-emerald-500 transition-[width] duration-75"
                      />
                      <div
                        style={{ width: `${Math.min(Math.max((blockThreshold - allowThreshold) * 100, 0), 100)}%` }}
                        className="h-full bg-amber-500 transition-[width] duration-75"
                      />
                      <div
                        style={{ width: `${Math.min(Math.max((1 - blockThreshold) * 100, 0), 100)}%` }}
                        className="h-full bg-rose-500 transition-[width] duration-75"
                      />
                    </div>

                    {/* Drag Handle 1: Allow Threshold (Emerald Knob + Stepper Tooltip) */}
                    <div
                      style={{ left: `${Math.min(Math.max(allowThreshold * 100, 0), 100)}%` }}
                      onPointerDown={handlePointerDown('allow')}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-[#0d131d] border-2 border-emerald-400 shadow-xl shadow-black/80 flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform ${
                        activeDrag === 'allow' ? 'scale-115 ring-4 ring-emerald-500/40' : ''
                      }`}
                      title={`Kéo để đổi Ngưỡng Cho phép (${allowThreshold.toFixed(2)})`}
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      
                      {/* Floating Stepper Tooltip Above Handle 1 */}
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-[#0d131d] border border-emerald-500/50 shadow-2xl shadow-black z-30 select-none backdrop-blur-md"
                      >
                        <button
                          type="button"
                          onClick={() => stepAllow(-0.01)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                          title="Giảm 0.01"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={blockThreshold - 0.01}
                          value={allowThreshold}
                          onChange={handleAllowInputChange}
                          className="w-12 bg-transparent text-center font-mono text-xs font-bold text-emerald-300 focus:outline-none focus:bg-emerald-950/40 rounded py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => stepAllow(0.01)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                          title="Tăng 0.01"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Drag Handle 2: Block Threshold (Rose Knob + Stepper Tooltip) */}
                    <div
                      style={{ left: `${Math.min(Math.max(blockThreshold * 100, 0), 100)}%` }}
                      onPointerDown={handlePointerDown('block')}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-[#0d131d] border-2 border-rose-400 shadow-xl shadow-black/80 flex items-center justify-center cursor-ew-resize hover:scale-110 transition-transform ${
                        activeDrag === 'block' ? 'scale-115 ring-4 ring-rose-500/40' : ''
                      }`}
                      title={`Kéo để đổi Ngưỡng Tạm dừng (${blockThreshold.toFixed(2)})`}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-400" />

                      {/* Floating Stepper Tooltip Below Handle 2 */}
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-[#0d131d] border border-rose-500/50 shadow-2xl shadow-black z-30 select-none backdrop-blur-md"
                      >
                        <button
                          type="button"
                          onClick={() => stepBlock(-0.01)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Giảm 0.01"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          min={allowThreshold + 0.01}
                          max="0.99"
                          value={blockThreshold}
                          onChange={handleBlockInputChange}
                          className="w-12 bg-transparent text-center font-mono text-xs font-bold text-rose-300 focus:outline-none focus:bg-rose-950/40 rounded py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => stepBlock(0.01)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Tăng 0.01"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {policyError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{policyError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Cập nhật: {analytics?.currentPolicy?.lastUpdatedAtUtc ? new Date(analytics.currentPolicy.lastUpdatedAtUtc).toLocaleTimeString() : 'Hệ thống'}
                  </span>
                  <button
                    type="submit"
                    disabled={isSavingPolicy}
                    className="px-5 py-2 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-[#FF5A36]/20"
                  >
                    {isSavingPolicy ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>
                </div>
              </form>
            </section>

            {/* Recent Transactions Table */}
            <section className="p-5 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Nhật ký Giao dịch Gần nhất</h2>
                </div>
                <button
                  onClick={handleResetAnalytics}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Xóa bộ đếm
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-3 pl-2">Thời gian</th>
                      <th className="pb-3">Người mua</th>
                      <th className="pb-3">Quyết định</th>
                      <th className="pb-3">Điểm rủi ro</th>
                      <th className="pb-3">Độ trễ</th>
                      <th className="pb-3 pr-2">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(!analytics?.recentLogs || analytics.recentLogs.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Chưa có giao dịch phát sinh gần đây.
                        </td>
                      </tr>
                    ) : (
                      analytics.recentLogs.map((log, idx) => {
                        let badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                        let label = 'Cho phép';
                        const dec = String(log.decision).toLowerCase();
                        if (dec === 'challenge' || dec === '1') {
                          badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
                          label = 'Xác thực';
                        } else if (dec === 'block' || dec === '2') {
                          badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
                          label = 'Tạm dừng';
                        }

                        return (
                          <tr key={`${log.requestId}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pl-2 font-mono text-[11px] text-slate-400">
                              {new Date(log.timestampUtc).toLocaleTimeString()}
                            </td>
                            <td className="py-3 text-slate-200 truncate max-w-[180px]">
                              {log.buyerEmail || 'Khách vãng lai'}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${badgeClass}`}>
                                {label}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-bold text-white">
                              {Number(log.riskScore).toFixed(4)}
                            </td>
                            <td className="py-3 font-mono text-slate-400">
                              {Number(log.latencyMs).toFixed(1)} ms
                            </td>
                            <td className="py-3 pr-2 text-slate-400 truncate max-w-[200px]">
                              {log.isFailOpen ? 'Dự phòng an toàn' : log.reason || '-'}
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
        )}

        {/* TAB 2: INVENTORY & OTP (ORIGINAL MOCK STORE TOOLS) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0d131d] border border-white/10 rounded-2xl">
              <span className="text-xs text-slate-400">
                Tổng số vé hiện có: <strong className="text-white font-mono">{tickets.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateTicket}
                  disabled={isGenerating || !isConnected}
                  className="px-4 py-2 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 text-white text-xs font-bold font-display rounded-xl shadow-lg shadow-[#FF5A36]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo vé mẫu</span>
                </button>

                <button
                  onClick={handleResetAll}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục mẫu</span>
                </button>
              </div>
            </div>

            {/* LIVE OTP MONITOR */}
            <section className="p-6 bg-gradient-to-b from-[#111927] to-[#0d131d] border border-[#FF5A36]/30 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#FF5A36]" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Mã Xác thực Đang Hoạt động</h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Tự làm mới: 3s</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {otps.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-500 border border-white/5 rounded-xl">
                    Chưa có mã xác thực nào được yêu cầu gần đây.
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
                        <span>{new Date(o.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-2xl font-black font-mono tracking-widest text-[#FF5A36]">
                          {o.otpCode}
                        </span>
                        <button
                          onClick={() => handleCopy(o.otpCode, 'mã OTP')}
                          className="px-3 py-1.5 bg-white/10 hover:bg-[#FF5A36] text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          {copiedCode === o.otpCode ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
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
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Danh sách Vé trong Kho</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-3 pl-2">Mã vé</th>
                      <th className="pb-3">Sự kiện</th>
                      <th className="pb-3">Khu vực</th>
                      <th className="pb-3">Giá gốc</th>
                      <th className="pb-3">Email chủ vé</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 text-right pr-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Chưa có vé trong kho.
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
                                  className="text-slate-400 hover:text-[#FF5A36] transition-colors p-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 text-slate-300">{t.eventName}</td>
                            <td className="py-3 text-slate-400 font-mono text-[11px]">{t.seatZone}</td>
                            <td className="py-3 font-mono font-bold text-[#FF5A36]">
                              {Number(t.originalPrice).toLocaleString('vi-VN')} VND
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
                                  className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                                >
                                  Khôi phục Hợp lệ
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
        )}

      </div>
    </div>
  );
};

export default OrganizerPortalPage;
