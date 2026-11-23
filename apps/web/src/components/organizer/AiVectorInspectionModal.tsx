import React from 'react';
import { X, Copy, Check, Activity, ShieldCheck, AlertTriangle, ShieldAlert, Cpu, Network, Clock, UserCheck } from 'lucide-react';

export interface AiVectorInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any | null;
}

export const AiVectorInspectionModal: React.FC<AiVectorInspectionModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !log) return null;

  // Extract raw 11D vector or fallback to vector object / defaults
  const vector11D: Record<string, number> = log.vector11D || {
    is_webdriver: log.vector?.isWebDriver ? 1.0 : 0.0,
    virtual_gpu_detected: log.vector?.virtualGpuDetected ? 1.0 : 0.0,
    prototype_tampered: log.vector?.prototypeTampered ? 1.0 : 0.0,
    canvas_tampered: log.vector?.canvasTampered ? 1.0 : 0.0,
    action_interval_std_dev: log.vector?.actionIntervalStdDev ?? 0.0,
    ua_match_level: log.vector?.uaMatchLevel ?? 1.0,
    network_inconsistency_score: log.vector?.networkInconsistencyScore ?? 0.0,
    time_to_checkout: log.vector?.timeToCheckout ?? 0.0,
    burst_rate_10s: log.vector?.burstRate10S ?? 0.0,
    concurrent_hold: log.vector?.concurrentHold ?? 0.0,
    device_account_overlap: log.vector?.deviceAccountOverlap ?? 0.0,
  };

  const copyRequestId = () => {
    if (log.requestId) {
      navigator.clipboard.writeText(log.requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const dec = String(log.decision || '').toLowerCase();
  let decisionBadge = {
    label: 'ALLOW',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  };
  if (dec === 'challenge' || dec === '1') {
    decisionBadge = {
      label: 'CHALLENGE',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    };
  } else if (dec === 'block' || dec === '2') {
    decisionBadge = {
      label: 'BLOCK',
      color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    };
  }

  const riskScore = Number(log.riskScore ?? 0);
  const latencyMs = Number(log.latencyMs ?? 0);

  // Helper for binary flags
  const renderFlag = (label: string, key: string, inverted = false) => {
    const val = Number(vector11D[key] ?? 0);
    const isRisky = inverted ? val < 0.5 : val > 0.5;
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
        <span className="text-[11px] font-mono text-slate-300">{label}</span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            isRisky
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {val.toFixed(1)} {isRisky ? '(SUSPICIOUS)' : '(PASS)'}
        </span>
      </div>
    );
  };

  // Helper for scalar metrics
  const renderMetric = (label: string, key: string, unit: string, riskLevel: 'low' | 'medium' | 'high') => {
    const val = Number(vector11D[key] ?? 0);
    let badgeColor = 'text-emerald-400';
    if (riskLevel === 'medium') badgeColor = 'text-amber-400';
    if (riskLevel === 'high') badgeColor = 'text-rose-400';

    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
        <span className="text-[11px] font-mono text-slate-300">{label}</span>
        <span className={`text-[11px] font-mono font-bold ${badgeColor}`}>
          {val.toFixed(2)} {unit}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#0d131d] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#141b27] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                  AI Decision & 11D Telemetry Vector Inspector
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${decisionBadge.color}`}>
                  {decisionBadge.icon}
                  {decisionBadge.label}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Model: ONNX v2.0 Tree Ensemble | SHA-256: d647e87b...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Risk Score</span>
              <span className="text-lg font-mono font-bold text-white">
                {riskScore.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Inference Latency</span>
              <span className="text-lg font-mono font-bold text-cyan-400">
                {latencyMs.toFixed(1)} ms
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Fail-Open Status</span>
              <span className="text-xs font-mono font-bold text-slate-300 block mt-1">
                {log.isFailOpen ? 'ACTIVATED (FALLBACK)' : 'NORMAL INFERENCE'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Request ID</span>
              <button
                onClick={copyRequestId}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-white truncate max-w-full mt-1 cursor-pointer"
                title="Click to copy Request ID"
              >
                <span className="truncate">{log.requestId ? log.requestId.slice(0, 12) + '...' : 'N/A'}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* 4-Tier Feature Vector Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display flex items-center gap-2">
              <span>Normalized 11D Feature Taxonomy</span>
              <span className="text-[10px] font-mono text-slate-500 font-normal">(Input values fed into ONNX runtime)</span>
            </h4>

            {/* Tier 1: Client Environment & Behavioral Fingerprint (5D) */}
            <div className="p-4 rounded-xl bg-[#141b27]/60 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Tier 1: Client Environment & Behavioral Fingerprint (5D)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {renderFlag('is_webdriver', 'is_webdriver')}
                {renderFlag('virtual_gpu_detected', 'virtual_gpu_detected')}
                {renderFlag('prototype_tampered', 'prototype_tampered')}
                {renderFlag('canvas_tampered', 'canvas_tampered')}
                <div className="sm:col-span-2">
                  {renderMetric(
                    'action_interval_std_dev (Timing Jitter)',
                    'action_interval_std_dev',
                    'sec',
                    vector11D['action_interval_std_dev'] < 0.05 ? 'high' : 'low'
                  )}
                </div>
              </div>
            </div>

            {/* Tier 2: Network & Protocol Consistency (2D) */}
            <div className="p-4 rounded-xl bg-[#141b27]/60 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Network className="w-4 h-4 text-blue-400" />
                <span>Tier 2: Network & Protocol Consistency (2D)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {renderFlag('ua_match_level (UA Consistency)', 'ua_match_level', true)}
                {renderMetric(
                  'network_inconsistency_score',
                  'network_inconsistency_score',
                  '',
                  vector11D['network_inconsistency_score'] > 0.5 ? 'high' : 'low'
                )}
              </div>
            </div>

            {/* Tier 3: Server Interaction & Velocity (2D) */}
            <div className="p-4 rounded-xl bg-[#141b27]/60 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Tier 3: Server Interaction & Velocity (2D)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {renderMetric(
                  'time_to_checkout',
                  'time_to_checkout',
                  'sec',
                  vector11D['time_to_checkout'] < 1.0 ? 'high' : 'low'
                )}
                {renderMetric(
                  'burst_rate_10s',
                  'burst_rate_10s',
                  'req/10s',
                  vector11D['burst_rate_10s'] > 3.0 ? 'high' : 'low'
                )}
              </div>
            </div>

            {/* Tier 4: Business State & Device Correlation (2D) */}
            <div className="p-4 rounded-xl bg-[#141b27]/60 border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Tier 4: Business State & Device Correlation (2D)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {renderMetric(
                  'concurrent_hold',
                  'concurrent_hold',
                  'holds',
                  vector11D['concurrent_hold'] > 2 ? 'high' : 'low'
                )}
                {renderMetric(
                  'device_account_overlap',
                  'device_account_overlap',
                  'accounts',
                  vector11D['device_account_overlap'] > 1 ? 'high' : 'low'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141b27] border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            Evaluation Reason: {log.reason || 'None (Pass Thresholds)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
