import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  adminApi,
  AdminOrganizerDto,
  AdminOrganizerEventItemDto,
  CreateOrganizerRequest,
  UpdateOrganizerConnectionRequest,
  TestOrganizerConnectionResult,
  SyncOrganizerEventsResult,
} from '@ticketshield/api-client';
import { useUIStore } from '../stores/uiStore';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Radio,
  Edit2,
  Copy,
  Check,
  X,
  Loader2,
  Zap,
  Mail,
  Calendar,
  Share2,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PresetProfile {
  id: string;
  name: string;
  officialEmail: string;
  taxCode: string;
  contactPerson: string;
  contactPhone: string;
  description: string;
}

const PRESET_PROFILES: PresetProfile[] = [
  {
    id: 'vieon',
    name: 'VieON Entertainment',
    officialEmail: 'partner@vieon.vn',
    taxCode: '0312345678',
    contactPerson: 'Authorized Representative',
    contactPhone: '19001234',
    description: 'Exclusive ticketing partner for Anh Trai Say Hi Concert 2026',
  },
  {
    id: 'spacespeakers',
    name: 'SpaceSpeakers Production',
    officialEmail: 'contact@spacespeakers.vn',
    taxCode: '0398765432',
    contactPerson: 'Lead Producer',
    contactPhone: '0901234567',
    description: 'Organizer of Hip-hop Mixtape Hanoi 2026 series',
  },
  {
    id: 'livenation',
    name: 'Live Nation Vietnam',
    officialEmail: 'ticketing@livenation.vn',
    taxCode: '0387654321',
    contactPerson: 'David Miller',
    contactPhone: '0988776655',
    description: 'Ticketing representative for The Wild Dreams Tour - Westlife Vietnam 2026',
  },
];

export const AdminOrganizersPage: React.FC = () => {
  const { showToast } = useUIStore();

  const [organizers, setOrganizers] = useState<AdminOrganizerDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');

  // Selected node for inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Action states
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingOrganizer, setEditingOrganizer] = useState<AdminOrganizerDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states for Create
  const [createForm, setCreateForm] = useState<CreateOrganizerRequest>({
    name: '',
    officialEmail: '',
    contactPhone: '',
    taxCode: '',
    contactPerson: '',
    apiBaseUrl: '',
    grpcEndpoint: '',
    webhookUrl: '',
    webhookSecretKey: '',
  });

  // Form states for Edit
  const [editForm, setEditForm] = useState<UpdateOrganizerConnectionRequest>({
    name: '',
    contactPhone: '',
    taxCode: '',
    contactPerson: '',
    apiBaseUrl: '',
    grpcEndpoint: '',
    webhookUrl: '',
    webhookSecretKey: '',
    status: 'ACTIVE',
    connectionStatus: 'CONNECTED',
  });

  const fetchOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOrganizers();
      setOrganizers(data || []);
      if (!selectedNodeId && data && data.length > 0) {
        setSelectedNodeId(data[0].id);
      }
    } catch (err: any) {
      showToast(err?.message || 'Unable to load organizers from the server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, selectedNodeId]);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (preset: PresetProfile) => {
    setCreateForm({
      name: preset.name,
      officialEmail: preset.officialEmail,
      taxCode: preset.taxCode,
      contactPerson: preset.contactPerson,
      contactPhone: preset.contactPhone,
      // Connection URLs are environment-specific. A profile must not silently
      // overwrite them with local development endpoints.
      apiBaseUrl: createForm.apiBaseUrl,
      grpcEndpoint: createForm.grpcEndpoint,
      webhookUrl: createForm.webhookUrl,
      webhookSecretKey: `whsec_${preset.id}_${Date.now().toString().slice(-6)}`,
    });
    showToast(`Applied preset configuration: ${preset.name}`, 'info');
  };

  // Ping Health Check action for single node
  const handleTestConnection = async (id: string, name: string) => {
    setTestingId(id);
    try {
      const res: TestOrganizerConnectionResult = await adminApi.testOrganizerConnection(id);
      const isConnected = (res.connectionStatus || res.status) === 'CONNECTED';
      showToast(
        isConnected
          ? `Connected successfully to ${name} (${res.latencyMs}ms)`
          : `Unable to connect to ${name}: ${res.message}`,
        isConnected ? 'success' : 'warning'
      );
      const updated = await adminApi.getOrganizers();
      setOrganizers(updated);
    } catch (err: any) {
      showToast(err?.message || 'Error checking connection to organizer.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Ping All active partners concurrently
  const handlePingAll = async () => {
    if (organizers.length === 0) return;
    setIsPingingAll(true);
    try {
      const results = await Promise.allSettled(
        organizers.map((org) => adminApi.testOrganizerConnection(org.id))
      );
      const connectedCount = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          ((r.value.connectionStatus || r.value.status) === 'CONNECTED')
      ).length;
      showToast(`Checked ${organizers.length} partners: ${connectedCount} healthy connections.`, 'success');
      const updated = await adminApi.getOrganizers();
      setOrganizers(updated);
    } catch (err: any) {
      showToast(err?.message || 'Error running batch connection test.', 'error');
    } finally {
      setIsPingingAll(false);
    }
  };

  // Sync Events Catalog action for single node
  const handleSyncEvents = async (id: string, name: string) => {
    setSyncingId(id);
    try {
      const res: SyncOrganizerEventsResult = await adminApi.syncOrganizerEvents(id);
      showToast(res.message || `Events catalog synced for ${name} successfully.`, 'success');
      const updated = await adminApi.getOrganizers();
      setOrganizers(updated);
    } catch (err: any) {
      showToast(err?.message || 'Error syncing events catalog.', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  // Sync All active partners
  const handleSyncAll = async () => {
    if (organizers.length === 0) return;
    setIsSyncingAll(true);
    try {
      const results = await Promise.allSettled(
        organizers.map((org) => adminApi.syncOrganizerEvents(org.id))
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      showToast(`Synced catalogs from ${successCount}/${organizers.length} partners.`, 'success');
      const updated = await adminApi.getOrganizers();
      setOrganizers(updated);
    } catch (err: any) {
      showToast(err?.message || 'Error syncing events catalog.', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.officialEmail.trim()) {
      showToast('Please provide the organizer name and official email.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createOrganizer(createForm);
      showToast('New event organizer added successfully.', 'success');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        officialEmail: '',
        contactPhone: '',
        taxCode: '',
        contactPerson: '',
        apiBaseUrl: '',
        grpcEndpoint: '',
        webhookUrl: '',
        webhookSecretKey: '',
      });
      fetchOrganizers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create organizer.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (org: AdminOrganizerDto) => {
    setEditingOrganizer(org);
    setEditForm({
      name: org.name,
      contactPhone: org.contactPhone || '',
      taxCode: org.taxCode || '',
      contactPerson: org.contactPerson || '',
      apiBaseUrl: org.apiBaseUrl || '',
      grpcEndpoint: org.grpcEndpoint || '',
      webhookUrl: org.webhookUrl || '',
      webhookSecretKey: org.webhookSecretKey || '',
      status: org.status,
      connectionStatus: org.connectionStatus,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrganizer) return;

    setSubmitting(true);
    try {
      await adminApi.updateOrganizer(editingOrganizer.id, editForm);
      showToast(`Configuration updated for ${editingOrganizer.name}.`, 'success');
      setEditingOrganizer(null);
      fetchOrganizers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update connection parameters.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & search
  const filteredOrganizers = useMemo(() => {
    return organizers.filter((org) => {
      const matchSearch =
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.officialEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.grpcEndpoint && org.grpcEndpoint.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' || org.connectionStatus.toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchStatus;
    });
  }, [organizers, searchQuery, statusFilter]);

  // Metrics
  const totalCount = organizers.length;
  const connectedCount = organizers.filter((o) => o.connectionStatus === 'CONNECTED').length;
  const activeCount = organizers.filter((o) => o.status === 'ACTIVE').length;
  const totalEvents = organizers.reduce((acc, o) => acc + (o.eventsCount ?? o.totalEvents ?? 0), 0);

  const selectedOrganizer = useMemo(() => {
    return organizers.find((o) => o.id === selectedNodeId) || organizers[0] || null;
  }, [organizers, selectedNodeId]);

  // Radial calculation for surrounding partner nodes (hard-locked coordinate space)
  const radialPositions = useMemo(() => {
    const total = filteredOrganizers.length;
    if (total === 0) return [];
    return filteredOrganizers.map((org, idx) => {
      // Angle: starting from -90deg (top) and distributing evenly
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
      // Elliptical distribution: 28% horizontal, 26% vertical (leaves ~22% safe padding on all borders)
      const leftPct = 50 + 28 * Math.cos(angle);
      const topPct = 50 + 26 * Math.sin(angle);
      // SVG coordinates (viewBox 700 x 320)
      const svgX = 350 + 190 * Math.cos(angle);
      const svgY = 160 + 82 * Math.sin(angle);
      return {
        org,
        leftPct,
        topPct,
        svgX,
        svgY,
      };
    });
  }, [filteredOrganizers]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#101722] tracking-tight">
            Event Organizers
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View switcher - Prioritize Table List View */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
               type="button"
               onClick={() => setViewMode('table')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                 viewMode === 'table'
                   ? 'bg-white text-[#101722] shadow-sm'
                   : 'text-slate-500 hover:text-[#101722]'
               }`}
             >
               <Sliders className="w-3.5 h-3.5" />
               <span>List View</span>
             </button>
             <button
               type="button"
               onClick={() => setViewMode('graph')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                 viewMode === 'graph'
                   ? 'bg-white text-[#101722] shadow-sm'
                   : 'text-slate-500 hover:text-[#101722]'
               }`}
             >
               <Share2 className="w-3.5 h-3.5" />
               <span>Topology Graph</span>
             </button>
          </div>

          <button
            type="button"
            onClick={fetchOrganizers}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white text-xs font-semibold text-[#101722] hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F45135] text-white text-xs font-bold hover:bg-[#e0452a] transition-all shadow-sm shadow-[#F45135]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Organizer</span>
          </button>
        </div>
      </div>

      {/* ── Summary Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              Total Organizers
            </span>
            <p className="text-2xl font-bold font-display text-[#101722]">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              Connected
            </span>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold font-display text-emerald-600">{connectedCount}</p>
              <span className="text-xs text-[#667085]">/ {totalCount}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              Active
            </span>
            <p className="text-2xl font-bold font-display text-indigo-600">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              Synced Events
            </span>
            <p className="text-2xl font-bold font-display text-[#101722]">{totalEvents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Unified Toolbar (Shared across both Table & Graph views) ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5EAF0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by organizer name, email, endpoint..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white transition-all text-[#101722]"
          />
        </div>

        {/* Right: Status Filter Pills + Batch Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#667085] font-medium whitespace-nowrap">Status:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              {(['ALL', 'CONNECTED', 'DISCONNECTED', 'PENDING'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-[#101722] shadow-sm'
                      : 'text-slate-500 hover:text-[#101722]'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All'
                    : st === 'CONNECTED'
                    ? 'Connected'
                    : st === 'DISCONNECTED'
                    ? 'Offline'
                    : 'Pending'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Batch Actions: Ping All & Sync All */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePingAll}
              disabled={isPingingAll || organizers.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              title="Test connection to all organizers"
            >
              {isPingingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Ping All</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncingAll || organizers.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              title="Sync events catalog from all organizers"
            >
              {isSyncingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-700" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Sync All</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── VIEW MODE 1: RADIAL HUB-AND-SPOKE TOPOLOGY GRAPH ── */}
      {viewMode === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Radial Topology Canvas - Hard-locked dimensions to prevent jitter */}
          <div className="lg:col-span-7 bg-[#090D16] rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between h-[450px] shrink-0 sticky top-4">
            {/* Subtle Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#64748B 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Ambient Dynamic Glow in Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Canvas Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Topology Graph
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {filteredOrganizers.length} partners
              </span>
            </div>

            {/* ── Central Hub & Surrounding Nodes Canvas (Hard-locked 320px Height) ── */}
            <div className="relative w-full h-[320px] my-1 flex items-center justify-center select-none overflow-hidden">
              {/* SVG Connecting Spokes Overlay */}
              <svg
                viewBox="0 0 700 320"
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="hubGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {radialPositions.map(({ org, svgX, svgY }) => {
                  const isSelected = org.id === selectedNodeId;
                  const isConn = org.connectionStatus === 'CONNECTED';
                  const strokeColor = isConn ? '#10B981' : '#475569';
                  const pathD = `M 350 160 L ${svgX} ${svgY}`;

                  return (
                    <g key={org.id}>
                      {/* Green ambient glow only for connected spoke lines */}
                      {isConn && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth={isSelected ? 6 : 3}
                          className="opacity-20 blur-sm pointer-events-none"
                        />
                      )}
                      {/* Spoke line: Green solid if connected, Gray dashed if disconnected */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isConn ? (isSelected ? 2.5 : 1.5) : 1}
                        strokeDasharray={isConn ? 'none' : '4 4'}
                        className="transition-all duration-300"
                      />
                      {/* Traveling animated photon node: ONLY if connected! Never if disconnected! */}
                      {isConn && (
                        <circle r={isSelected ? 3.5 : 2.5} fill="#34D399">
                          <animateMotion
                            path={pathD}
                            dur={isSelected ? '1.8s' : '2.5s'}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* ── Center Node: Gateway ── */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                className="z-20 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-slate-900/95 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/20 text-center p-2 select-none"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[11px] font-bold text-white tracking-wide">Gateway</h4>
                <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  {connectedCount}/{totalCount} connected
                </span>
              </div>

              {/* ── Surrounding Partner Nodes (Compact, Minimalist Pills) ── */}
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-xs z-30">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#F45135]" />
                  <p className="mt-2 font-mono">Loading topology...</p>
                </div>
              ) : filteredOrganizers.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center text-slate-400 text-xs z-30">
                  No partners found.
                </div>
              ) : (
                radialPositions.map(({ org, leftPct, topPct }) => {
                  const isSelected = org.id === selectedNodeId;
                  const isConn = org.connectionStatus === 'CONNECTED';

                  return (
                    <div
                      key={org.id}
                      style={{
                        position: 'absolute',
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={() => setSelectedNodeId(org.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all cursor-pointer select-none group ${
                        isConn
                          ? isSelected
                            ? 'bg-slate-800 border-emerald-400 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/50 scale-105 z-30'
                            : 'bg-slate-900/90 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/90 z-20'
                          : isSelected
                          ? 'bg-slate-900 border-slate-500 ring-2 ring-slate-500/30 scale-105 z-30 opacity-90'
                          : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 opacity-60 z-10'
                      }`}
                      title={`${org.name}${org.lastPingLatencyMs ? ` (${org.lastPingLatencyMs}ms)` : ''}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isConn ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                        }`}
                      />
                      <span
                        className={`text-xs font-semibold truncate max-w-[140px] sm:max-w-[160px] transition-colors ${
                          isConn
                            ? 'text-white group-hover:text-emerald-300'
                            : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      >
                        {org.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Canvas Footer Legend */}
            <div className="relative z-10 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <span>Connected (Green)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Disconnected (Gray)</span>
                </span>
              </div>
              <span>Click a node to inspect details</span>
            </div>
          </div>

          {/* Right Inspector Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5EAF0] p-5 shadow-sm space-y-4">
            {selectedOrganizer ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm">
                      {selectedOrganizer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#101722]">{selectedOrganizer.name}</h3>
                      <p className="text-[11px] text-[#667085]">{selectedOrganizer.officialEmail}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedOrganizer)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    title="Edit parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 4-Step Lifecycle Timeline */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
                    Partner Lifecycle
                  </label>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1. Business Profile</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600">Completed</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`flex items-center gap-2 font-medium ${
                          selectedOrganizer.connectionStatus === 'CONNECTED'
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {selectedOrganizer.connectionStatus === 'CONNECTED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>2. Network Gateway</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedOrganizer.lastPingLatencyMs
                          ? `${selectedOrganizer.lastPingLatencyMs}ms`
                          : 'Not tested'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`flex items-center gap-2 font-medium ${
                          (selectedOrganizer.eventsCount ?? selectedOrganizer.totalEvents ?? 0) > 0
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {(selectedOrganizer.eventsCount ?? selectedOrganizer.totalEvents ?? 0) > 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>3. Ticket Catalog</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedOrganizer.eventsCount ?? selectedOrganizer.totalEvents ?? 0} events
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`flex items-center gap-2 font-medium ${
                          selectedOrganizer.status === 'ACTIVE'
                            ? 'text-indigo-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {selectedOrganizer.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>4. Trading Status</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {selectedOrganizer.status === 'ACTIVE' ? 'Ready' : 'Pending activation'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(selectedOrganizer.id, selectedOrganizer.name)}
                    disabled={testingId === selectedOrganizer.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                  >
                    {testingId === selectedOrganizer.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>Ping</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSyncEvents(selectedOrganizer.id, selectedOrganizer.name)}
                    disabled={syncingId === selectedOrganizer.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all shadow-sm disabled:opacity-60"
                  >
                    {syncingId === selectedOrganizer.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-700" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>Sync</span>
                  </button>
                </div>

                {/* Synced Events / Concerts Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        Synced Events ({selectedOrganizer.events?.length ?? selectedOrganizer.eventsCount ?? 0})
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSyncEvents(selectedOrganizer.id, selectedOrganizer.name)}
                      disabled={syncingId === selectedOrganizer.id}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingId === selectedOrganizer.id ? 'animate-spin' : ''}`} />
                      <span>Reload</span>
                    </button>
                  </div>

                  {selectedOrganizer.events && selectedOrganizer.events.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedOrganizer.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h5 className="font-bold text-slate-900 truncate">{ev.name}</h5>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {ev.tiersCount} tiers
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                            <span className="truncate max-w-[140px]">{ev.venue || ev.city || 'Vietnam'}</span>
                            <span>{new Date(ev.eventStartAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      <p>No events synced yet.</p>
                      <button
                        type="button"
                        onClick={() => handleSyncEvents(selectedOrganizer.id, selectedOrganizer.name)}
                        className="mt-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-[11px] hover:bg-indigo-100 transition-colors"
                      >
                        Fetch events catalog from organizer
                      </button>
                    </div>
                  )}
                </div>

                {/* Technical Node Details */}
                <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
                  <div className="flex items-center justify-between text-[#667085]">
                    <span>Tax Code:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrganizer.taxCode || 'Not provided'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#667085]">
                    <span>Representative:</span>
                    <span className="font-medium text-slate-800">
                      {selectedOrganizer.contactPerson || 'Not provided'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#667085] text-[11px]">Network Gateway:</span>
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                      <span className="truncate max-w-[200px]" title={selectedOrganizer.grpcEndpoint}>
                        {selectedOrganizer.grpcEndpoint || 'Not configured'}
                      </span>
                      {selectedOrganizer.grpcEndpoint && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedOrganizer.grpcEndpoint!, 'insp-grpc')}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedKey === 'insp-grpc' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#667085] text-[11px]">Webhook Secret Key:</span>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                      >
                        {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecretKey ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                      <span className="truncate max-w-[200px]">
                        {selectedOrganizer.webhookSecretKey
                          ? showSecretKey
                            ? selectedOrganizer.webhookSecretKey
                            : '••••••••••••••••••••••••'
                          : 'Not configured'}
                      </span>
                      {selectedOrganizer.webhookSecretKey && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedOrganizer.webhookSecretKey!, 'insp-wh')}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedKey === 'insp-wh' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Building2 className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="mt-2 font-medium">Select an organizer on the graph to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW MODE 2: TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#E5EAF0] text-[#667085] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Organizer</th>
                  <th className="py-3.5 px-4 font-semibold">Gateway</th>
                  <th className="py-3.5 px-4 font-semibold">API Base URL</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Events</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F45135]" />
                      <p className="mt-2 text-xs">Loading event organizers...</p>
                    </td>
                  </tr>
                ) : filteredOrganizers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                      <p className="mt-2 font-medium text-slate-600">No matching organizers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map((org) => {
                    const isConn = org.connectionStatus === 'CONNECTED';
                    const isTesting = testingId === org.id;
                    const isSyncing = syncingId === org.id;

                    return (
                      <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#101722] truncate text-xs">{org.name}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#667085] mt-0.5">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{org.officialEmail}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-[11px]">
                          <span
                            className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 truncate max-w-[200px] inline-block"
                            title={org.grpcEndpoint}
                          >
                            {org.grpcEndpoint || 'Not configured'}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono text-[11px] text-slate-600">
                          {org.apiBaseUrl || 'Not configured'}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                              isConn
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isConn ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                            {isConn ? 'Connected' : 'Pending'}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-bold font-mono text-[#101722]">
                          {org.eventsCount ?? org.totalEvents ?? 0}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTestConnection(org.id, org.name)}
                              disabled={isTesting}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm"
                              title="Test connection"
                            >
                              {isTesting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              ) : (
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>Ping</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSyncEvents(org.id, org.name)}
                              disabled={isSyncing}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold shadow-sm"
                              title="Sync event catalog"
                            >
                              {isSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                              )}
                              <span>Sync</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(org)}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                              title="Edit configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Create Organizer with Presets ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAF0] bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F45135]/10 text-[#F45135] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#101722] text-sm">Add Event Organizer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {/* Presets Selector */}
              <div>
                <label className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Configuration Presets</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Click to autofill</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_PROFILES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all group"
                    >
                      <p className="font-bold text-slate-800 text-[11px] truncate group-hover:text-indigo-600">
                        {preset.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Profile */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Organizer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="VieON Entertainment..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tax Code</label>
                    <input
                      type="text"
                      value={createForm.taxCode || ''}
                      onChange={(e) => setCreateForm({ ...createForm, taxCode: e.target.value })}
                      placeholder="0312345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.officialEmail}
                      onChange={(e) => setCreateForm({ ...createForm, officialEmail: e.target.value })}
                      placeholder="contact@organizer.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={createForm.contactPerson || ''}
                      onChange={(e) => setCreateForm({ ...createForm, contactPerson: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Gateway Config */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Network Gateway (Endpoint)</label>
                    <input
                      type="text"
                      value={createForm.grpcEndpoint || ''}
                      onChange={(e) => setCreateForm({ ...createForm, grpcEndpoint: e.target.value })}
                      placeholder="https://gateway.organizer.example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white font-mono text-[11px] text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">API Base URL</label>
                    <input
                      type="text"
                      value={createForm.apiBaseUrl || ''}
                      onChange={(e) => setCreateForm({ ...createForm, apiBaseUrl: e.target.value })}
                      placeholder="https://api.organizer.example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none border-slate-200 focus:border-[#F45135] focus:bg-white font-mono text-[11px] text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Webhook Secret Key (Optional)</label>
                  <input
                    type="text"
                    value={createForm.webhookSecretKey || ''}
                    onChange={(e) => setCreateForm({ ...createForm, webhookSecretKey: e.target.value })}
                    placeholder="Leave empty to auto-generate secure key (whsec_...)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white font-mono text-[11px] text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#F45135] text-white font-bold hover:bg-[#e0452a] disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Organizer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Connection ── */}
      {editingOrganizer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAF0] bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#101722] text-sm">Configure Organizer: {editingOrganizer.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400">{editingOrganizer.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrganizer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax Code</label>
                  <input
                    type="text"
                    value={editForm.taxCode || ''}
                    onChange={(e) => setEditForm({ ...editForm, taxCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editForm.contactPerson || ''}
                    onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Network Gateway (Endpoint)</label>
                  <input
                    type="text"
                    value={editForm.grpcEndpoint || ''}
                    onChange={(e) => setEditForm({ ...editForm, grpcEndpoint: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white font-mono text-[11px] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Base URL</label>
                  <input
                    type="text"
                    value={editForm.apiBaseUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, apiBaseUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white font-mono text-[11px] text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Webhook Secret Key</label>
                <input
                  type="text"
                  value={editForm.webhookSecretKey || ''}
                  onChange={(e) => setEditForm({ ...editForm, webhookSecretKey: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] focus:bg-white font-mono text-[11px] text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marketplace Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] text-slate-800 font-semibold"
                  >
                    <option value="ACTIVE">Active (Ready to list)</option>
                    <option value="DRAFT">Draft (Pending setup)</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Connection Channel</label>
                  <select
                    value={editForm.connectionStatus}
                    onChange={(e) => setEditForm({ ...editForm, connectionStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#F45135] text-slate-800 font-semibold"
                  >
                    <option value="CONNECTED">Connected (Online)</option>
                    <option value="DISCONNECTED">Disconnected (Offline)</option>
                    <option value="PENDING">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrganizer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#F45135] text-white font-bold hover:bg-[#e0452a] disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
