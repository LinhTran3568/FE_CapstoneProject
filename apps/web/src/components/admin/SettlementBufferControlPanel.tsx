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
      console.error('Error fetching escrow buffer config:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load escrow buffer configuration from server.');
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
      setErrorMessage('Escrow buffer duration must be between 1 and 2,592,000 seconds (maximum 30 days).');
      return;
    }
    if (cutoffSeconds < 1 || cutoffSeconds > 2592000) {
      setErrorMessage('Resale cutoff threshold must be at least 1 second (maximum 2,592,000 seconds).');
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
      setSuccessMessage('Escrow buffer and cutoff thresholds successfully updated!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update escrow buffer configuration.');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (sec: number): string => {
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)} min`;
    if (sec < 86400) {
      const hours = (sec / 3600).toFixed(1);
      return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours} hrs`;
    }
    const days = (sec / 86400).toFixed(1);
    return `${days.endsWith('.0') ? days.slice(0, -2) : days} days`;
  };

  // Quick preset chips
  const bufferPresets = [
    { label: '30s (Dev)', value: 30 },
    { label: '1 hr', value: 3600 },
    { label: '6 hrs', value: 21600 },
    { label: '12 hrs', value: 43200 },
    { label: '24 hrs', value: 86400 },
  ];

  const cutoffPresets = [
    { label: '15 min', value: 900 },
    { label: '1 hr', value: 3600 },
    { label: '2 hrs', value: 7200 },
    { label: '6 hrs', value: 21600 },
    { label: '12 hrs', value: 43200 },
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
                <span>Escrow Buffer Parameters</span>
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Configure escrow holding window and pre-event resale cutoff
              </p>
            </div>
            <button
              type="button"
              onClick={fetchBufferConfig}
              className="p-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 transition-colors"
              title="Refresh from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
            </button>
          </div>

          {/* Section 1: Escrow Buffer Holding Period */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#101722]">
                1. Escrow Holding Buffer
              </label>
              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Equivalent: {formatDuration(bufferSeconds)}
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
                className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] focus:bg-white pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">seconds</span>
            </div>

            {/* Quick Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#667085]">Quick select:</span>
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
                Currently active: <strong className="text-[#101722] font-mono">{savedConfig.bufferSeconds.toLocaleString()}s</strong> ({formatDuration(savedConfig.bufferSeconds)})
              </p>
            )}
          </div>

          <div className="border-t border-[#E5EAF0] pt-4 space-y-2">
            {/* Section 2: Resale Cutoff Threshold */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#101722]">
                2. Pre-Event Resale Cutoff Threshold
              </label>
              <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Equivalent: {formatDuration(cutoffSeconds)}
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
                className="w-full bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#101722] focus:outline-none focus:border-[#F45135] focus:bg-white pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#667085]">seconds</span>
            </div>

            {/* Quick Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#667085]">Quick select:</span>
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
                Currently active: <strong className="text-[#101722] font-mono">{savedConfig.cutoffSeconds.toLocaleString()}s</strong> ({formatDuration(savedConfig.cutoffSeconds)})
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#667085]">
              {isDirty ? (
                <span className="text-amber-600 font-medium">● Unsaved changes</span>
              ) : (
                <span>No changes</span>
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
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
              <span>Escrow Settlement Lifecycle</span>
            </h4>
            <p className="text-xs text-[#667085] mt-0.5">
              State transitions from buyer payment to seller disbursement
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5EAF0]">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#101722] text-white flex items-center justify-center text-[9px] font-bold">
                1
              </div>
              <h5 className="text-xs font-bold text-[#101722]">Payment Authorization (Buyer Paid)</h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Buyer completes payment. Funds are immediately locked in the secure escrow ledger.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                2
              </div>
              <h5 className="text-xs font-bold text-[#101722]">
                Holding Buffer Window ({formatDuration(bufferSeconds)})
              </h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Escrow locks funds throughout the configured buffer window, allowing the buyer time to verify ticket validity.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold">
                3
              </div>
              <h5 className="text-xs font-bold text-[#101722]">
                Pre-Event Resale Cutoff ({formatDuration(cutoffSeconds)})
              </h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Resale listings are closed before event opening according to the cutoff threshold to maintain check-in security.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                4
              </div>
              <h5 className="text-xs font-bold text-[#101722]">Seller Payout Disbursement</h5>
              <p className="text-[11px] text-[#667085] mt-0.5">
                System automatically releases funds to the seller's verified payout account upon buffer expiry, <strong>provided no active disputes exist</strong>.
              </p>
            </div>
          </div>

          {/* Operational Guard Note */}
          <div className="p-3 rounded-lg bg-[#F4F6F9] border border-[#E5EAF0] text-[11px] text-[#667085] flex items-start gap-2">
            <Info className="w-4 h-4 text-[#F45135] shrink-0 mt-0.5" />
            <span>
              <strong>Operational Guard:</strong> If a buyer raises a dispute during the buffer window, escrow release is halted until an administrator issues a verdict in the Dispute Console.
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
                <h4 className="text-sm font-bold text-[#101722]">Confirm Escrow Buffer Changes</h4>
                <p className="text-xs text-[#667085]">This policy directly impacts settlement and payout timing</p>
              </div>
            </div>

            <div className="bg-[#F4F6F9] border border-[#E5EAF0] rounded-lg p-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#667085]">New Escrow Buffer:</span>
                <strong className="text-emerald-700">{formatDuration(bufferSeconds)} ({bufferSeconds.toLocaleString()}s)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">New Cutoff Threshold:</span>
                <strong className="text-amber-700">{formatDuration(cutoffSeconds)} ({cutoffSeconds.toLocaleString()}s)</strong>
              </div>
            </div>

            <p className="text-[11px] text-[#667085]">
              The updated buffer durations will immediately apply to all new transactions from this point forward. Are you sure you want to proceed?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5EAF0]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-1.5 rounded-lg bg-[#F45135] hover:bg-[#e0452a] text-white text-xs font-semibold shadow-2xs"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
