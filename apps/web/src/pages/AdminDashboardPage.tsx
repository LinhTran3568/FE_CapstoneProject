import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  adminApi,
  disputesApi,
  ResaleFeeConfigDto,
  EscrowBufferConfigDto,
  EventResaleMarkupDto,
  DisputeListItemDto,
  AdminOrganizerDto,
} from '@ticketshield/api-client';
import {
  ShieldAlert,
  Percent,
  Clock,
  Ticket,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Loader2,
  RefreshCw,
  Users,
  Sliders,
  Activity,
  ArrowUpRight,
  Shield,
  CreditCard,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Operational state
  const [feeConfig, setFeeConfig] = useState<ResaleFeeConfigDto | null>(null);
  const [bufferConfig, setBufferConfig] = useState<EscrowBufferConfigDto | null>(null);
  const [events, setEvents] = useState<EventResaleMarkupDto[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizerDto[]>([]);
  const [disputesStats, setDisputesStats] = useState<{
    total: number;
    open: number;
    resolved: number;
    rejected: number;
  }>({
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

      const [feeRes, bufferRes, eventsRes, disputesRes, orgsRes] = await Promise.allSettled([
        adminApi.getFeeSettings(),
        adminApi.getEscrowBuffer(),
        adminApi.getAllEventMarkups(),
        disputesApi.getDisputes('OPEN'),
        adminApi.getOrganizers(),
      ]);

      if (feeRes.status === 'fulfilled') setFeeConfig(feeRes.value);
      if (bufferRes.status === 'fulfilled') setBufferConfig(bufferRes.value);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value || []);
      if (orgsRes.status === 'fulfilled') setOrganizers(orgsRes.value || []);
      if (disputesRes.status === 'fulfilled' && disputesRes.value) {
        setDisputesStats({
          total: disputesRes.value.totalCount,
          open: disputesRes.value.openCount,
          resolved: disputesRes.value.resolvedCount,
          rejected: disputesRes.value.rejectedCount,
        });
        setRecentDisputes((disputesRes.value.items || []).slice(0, 5));
      }
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDurationHours = (sec?: number) => {
    if (!sec) return '—';
    const hrs = (sec / 3600).toFixed(1);
    return `${hrs.endsWith('.0') ? hrs.slice(0, -2) : hrs}h`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5EAF0] rounded-xl p-16 flex flex-col items-center justify-center gap-3 text-[#667085] shadow-2xs">
        <Loader2 className="w-6 h-6 animate-spin text-[#F45135]" />
        <span className="text-xs font-mono">Loading operational metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header: Clean, No Subtext (AGENTS.md & Hallmark standard) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAF0] pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#101722] tracking-tight">
            Dashboard
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Operational</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-[#667085] hidden md:inline">
              Updated {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF0] text-[#101722] hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#667085]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Operational KPI Cards Grid (4 Columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open Disputes */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider font-semibold">
              Active Disputes
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                disputesStats.open > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {disputesStats.open > 0 ? `${disputesStats.open} Action Required` : 'All Resolved'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#101722] font-mono tabular-nums">
              {disputesStats.open}
            </span>
            <span className="text-[11px] text-[#667085] font-mono">
              / {disputesStats.total} total dossiers
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085] font-mono">Target SLA: 72h</span>
            <Link
              to="/admin/disputes"
              className="text-[#F45135] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Review <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Monitored Events */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider font-semibold">
              Price-Capped Events
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Active Controls
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#101722] font-mono tabular-nums">
              {events.length}
            </span>
            <span className="text-[11px] text-[#667085]">events monitored</span>
          </div>

          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085] font-mono">Ceiling range: +10% → +20%</span>
            <Link
              to="/admin/config?tab=markup"
              className="text-[#F45135] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Configure <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Fee Policy */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider font-semibold">
              Fee Schedule
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200">
              Active Rates
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#101722] font-mono tabular-nums">
              {feeConfig
                ? `+${(feeConfig.buyerFeePercentage * 100).toFixed(0)}% / -${(
                    feeConfig.sellerFeePercentage * 100
                  ).toFixed(0)}%`
                : '—'}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085] font-mono">
              Min:{' '}
              {feeConfig
                ? `${(feeConfig.minimumBuyerFee / 1000).toFixed(0)}k / ${(
                    feeConfig.minimumSellerFee / 1000
                  ).toFixed(0)}k ₫`
                : '—'}
            </span>
            <Link
              to="/admin/config?tab=fees"
              className="text-[#F45135] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Edit Rates <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Settlement Buffer & Cutoff */}
        <div className="bg-white border border-[#E5EAF0] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085] uppercase tracking-wider font-semibold">
              Settlement Buffer
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Escrow Lock
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#101722] font-mono tabular-nums">
              {bufferConfig ? formatDurationHours(bufferConfig.bufferSeconds) : '—'}
            </span>
            <span className="text-[11px] text-[#667085]">holding window</span>
          </div>

          <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-between text-[11px]">
            <span className="text-[#667085] font-mono">
              Cutoff: {bufferConfig ? formatDurationHours(bufferConfig.cutoffSeconds) : '—'} before showtime
            </span>
            <Link
              to="/admin/config?tab=buffer"
              className="text-[#F45135] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Configure <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── System Status Strip (Fintech Operational Observability) ── */}
      <div className="bg-[#FAFBFD] border border-[#E5EAF0] rounded-xl p-3.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[#667085] text-[10px] font-mono uppercase">Escrow Engine</p>
              <p className="font-semibold text-[#101722] text-[11px]">T+24h Automated Hold</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[#667085] text-[10px] font-mono uppercase">Payment Gateway</p>
              <p className="font-semibold text-[#101722] text-[11px]">VietQR & SePay Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[#667085] text-[10px] font-mono uppercase">Event Organizers</p>
              <p className="font-semibold text-[#101722] text-[11px]">
                {organizers.length > 0 ? `${organizers.length} Partners Connected` : 'Ready to Sync'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[#667085] text-[10px] font-mono uppercase">Anti-Scalping</p>
              <p className="font-semibold text-[#101722] text-[11px]">Dynamic Ceiling Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-Column Operational Split Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Pending Disputes (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E5EAF0] rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F45135]" />
              <h2 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
                Recent Pending Disputes
              </h2>
            </div>
            <Link
              to="/admin/disputes"
              className="text-xs font-semibold text-[#F45135] hover:underline inline-flex items-center gap-1"
            >
              View all ({disputesStats.open}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentDisputes.length === 0 ? (
            <div className="py-8 text-center text-[#667085] space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-[#101722]">No pending disputes</p>
              <p className="text-[11px]">All buyer-seller dispute cases have been settled.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5EAF0]">
              {recentDisputes.map((d) => (
                <div
                  key={d.disputeId}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-xs text-[#101722] truncate">
                      {d.eventTitle || 'Event'}
                    </p>
                    <p className="text-[#667085] text-[11px] font-mono truncate">
                      #{d.disputeCode || d.disputeId.slice(0, 8)} • Buyer: {d.buyerName || 'Guest'} • Ticket:{' '}
                      {d.ticketCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {d.status}
                    </span>
                    <Link
                      to="/admin/disputes"
                      className="px-2.5 py-1 rounded-md bg-white border border-[#E5EAF0] hover:border-[#F45135] hover:text-[#F45135] text-xs font-medium transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Events Price Ceiling Monitor (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAF0] rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-2.5">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#F45135]" />
              <h2 className="text-xs font-bold text-[#101722] uppercase tracking-wider font-mono">
                Price-Capped Events
              </h2>
            </div>
            <Link
              to="/admin/config?tab=markup"
              className="text-xs font-semibold text-[#F45135] hover:underline inline-flex items-center gap-1"
            >
              View all ({events.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E5EAF0]">
            {events.slice(0, 5).map((ev) => (
              <div
                key={ev.eventId}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-xs text-[#101722] truncate">{ev.eventName}</p>
                  <p className="text-[#667085] text-[11px] truncate flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#667085]" />
                    <span>{ev.venue || 'TBA'}</span>
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    +{ev.maxResaleMarkupPercentage}% Max
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/admin/config?tab=markup"
              className="w-full py-2 rounded-lg border border-[#E5EAF0] hover:bg-slate-50 text-xs font-semibold text-[#101722] flex items-center justify-center gap-1.5 transition-colors block text-center"
            >
              <span>Manage price ceilings</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F45135]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Admin Fast Navigation Deck ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/organizers"
          className="p-4 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F45135] transition-all shadow-2xs group flex items-start justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#F45135]" />
              <h3 className="text-xs font-bold text-[#101722] group-hover:text-[#F45135] transition-colors">
                Organizer Partners
              </h3>
            </div>
            <p className="text-[11px] text-[#667085]">
              {organizers.length} connected ticketing partners
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#667085] group-hover:text-[#F45135] transition-colors shrink-0" />
        </Link>

        <Link
          to="/admin/users"
          className="p-4 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F45135] transition-all shadow-2xs group flex items-start justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F45135]" />
              <h3 className="text-xs font-bold text-[#101722] group-hover:text-[#F45135] transition-colors">
                User Management
              </h3>
            </div>
            <p className="text-[11px] text-[#667085]">
              Accounts, roles & verification
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#667085] group-hover:text-[#F45135] transition-colors shrink-0" />
        </Link>

        <Link
          to="/admin/config"
          className="p-4 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F45135] transition-all shadow-2xs group flex items-start justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F45135]" />
              <h3 className="text-xs font-bold text-[#101722] group-hover:text-[#F45135] transition-colors">
                System Parameters
              </h3>
            </div>
            <p className="text-[11px] text-[#667085]">
              Fee schedules & buffer policies
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#667085] group-hover:text-[#F45135] transition-colors shrink-0" />
        </Link>

        <Link
          to="/admin/disputes"
          className="p-4 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F45135] transition-all shadow-2xs group flex items-start justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F45135]" />
              <h3 className="text-xs font-bold text-[#101722] group-hover:text-[#F45135] transition-colors">
                Dispute Console
              </h3>
            </div>
            <p className="text-[11px] text-[#667085]">
              {disputesStats.open} cases awaiting resolution
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#667085] group-hover:text-[#F45135] transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );
};


