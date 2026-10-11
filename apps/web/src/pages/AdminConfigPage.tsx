import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeeSettingsControlPanel } from '../components/admin/FeeSettingsControlPanel';
import { EventMarkupControlPanel } from '../components/admin/EventMarkupControlPanel';
import { SettlementBufferControlPanel } from '../components/admin/SettlementBufferControlPanel';
import { adminApi, ResaleFeeConfigDto, EscrowBufferConfigDto } from '@ticketshield/api-client';
import {
  Sliders,
  Percent,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';

type TabKey = 'FEE_SETTINGS' | 'EVENT_MARKUP' | 'SETTLEMENT_BUFFER';

export const AdminConfigPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getInitialTab = (): TabKey => {
    if (tabParam === 'markup' || tabParam === 'events') return 'EVENT_MARKUP';
    if (tabParam === 'buffer' || tabParam === 'escrow') return 'SETTLEMENT_BUFFER';
    return 'FEE_SETTINGS';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

  // Sync tab state when URL search params change
  useEffect(() => {
    if (tabParam === 'markup' || tabParam === 'events') setActiveTab('EVENT_MARKUP');
    else if (tabParam === 'buffer' || tabParam === 'escrow') setActiveTab('SETTLEMENT_BUFFER');
    else if (tabParam === 'fees' || tabParam === 'fee-settings') setActiveTab('FEE_SETTINGS');
  }, [tabParam]);

  // Quick summary metrics from real API
  const [feeConfig, setFeeConfig] = useState<ResaleFeeConfigDto | null>(null);
  const [bufferConfig, setBufferConfig] = useState<EscrowBufferConfigDto | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const [fee, buffer, events] = await Promise.allSettled([
          adminApi.getFeeSettings(),
          adminApi.getEscrowBuffer(),
          adminApi.getAllEventMarkups()
        ]);
        if (isMounted) {
          if (fee.status === 'fulfilled') setFeeConfig(fee.value);
          if (buffer.status === 'fulfilled') setBufferConfig(buffer.value);
          if (events.status === 'fulfilled') setEventCount(events.value?.length || 0);
        }
      } catch {
        // silent fail for summary card
      }
    };
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    const paramVal = key === 'EVENT_MARKUP' ? 'markup' : key === 'SETTLEMENT_BUFFER' ? 'buffer' : 'fees';
    setSearchParams({ tab: paramVal });
  };

  const formatDurationHours = (sec?: number) => {
    if (!sec) return '—';
    const hrs = (sec / 3600).toFixed(1);
    return `${hrs.endsWith('.0') ? hrs.slice(0, -2) : hrs}h`;
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header & Context ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101722] tracking-tight font-display flex items-center gap-2.5">
            <span>Cấu Hình Hệ Thống Toàn Sàn</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#F45135]/10 text-[#F45135] border border-[#F45135]/20">
              Policy Engine
            </span>
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Điều phối tham số kinh tế toàn sàn: Biểu phí giao dịch động, Trần giá vé bán lại và Thời gian đệm ký quỹ Escrow
          </p>
        </div>

      </div>

      {/* ── Compact Live Parameters Summary Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#667085] uppercase tracking-wider">Biểu Phí Sàn</span>
            <div className="text-base font-bold font-mono text-[#101722]">
              {feeConfig ? `+${(feeConfig.buyerFeePercentage * 100).toFixed(0)}% Buyer / -${(feeConfig.sellerFeePercentage * 100).toFixed(0)}% Seller` : 'Đang tải...'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#F45135]/10 text-[#F45135] flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#667085] uppercase tracking-wider">Đệm Ký Quỹ Escrow</span>
            <div className="text-base font-bold font-mono text-[#101722]">
              {bufferConfig ? `${formatDurationHours(bufferConfig.bufferSeconds)} (Cutoff ${formatDurationHours(bufferConfig.cutoffSeconds)})` : 'Đang tải...'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E5EAF0] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#667085] uppercase tracking-wider">Giám Sát Trần Giá</span>
            <div className="text-base font-bold font-mono text-[#101722]">
              {eventCount > 0 ? `${eventCount} Sự kiện đang áp dụng` : 'Đang kiểm tra...'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Single-Line Horizontal Navigation Tabs ── */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-1 shadow-2xs flex items-center overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabChange('FEE_SETTINGS')}
          className={`flex-1 min-w-[160px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'FEE_SETTINGS'
              ? 'bg-[#101722] text-white shadow-xs'
              : 'text-[#667085] hover:text-[#101722] hover:bg-[#F4F6F9]'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-[#F45135]" />
          <span>Biểu Phí Dịch Vụ</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('EVENT_MARKUP')}
          className={`flex-1 min-w-[160px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'EVENT_MARKUP'
              ? 'bg-[#101722] text-white shadow-xs'
              : 'text-[#667085] hover:text-[#101722] hover:bg-[#F4F6F9]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          <span>Trần Giá Sự Kiện</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('SETTLEMENT_BUFFER')}
          className={`flex-1 min-w-[160px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SETTLEMENT_BUFFER'
              ? 'bg-[#101722] text-white shadow-xs'
              : 'text-[#667085] hover:text-[#101722] hover:bg-[#F4F6F9]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Đệm An Toàn Escrow</span>
        </button>
      </div>

      {/* ── Active Tab Panel Content ── */}
      <div className="transition-all duration-200">
        {activeTab === 'FEE_SETTINGS' && <FeeSettingsControlPanel />}
        {activeTab === 'EVENT_MARKUP' && <EventMarkupControlPanel />}
        {activeTab === 'SETTLEMENT_BUFFER' && <SettlementBufferControlPanel />}
      </div>
    </div>
  );
};
