import React, { useCallback, useEffect, useRef, useState } from 'react';
import { History, Keyboard, Loader2, ScanLine, Send } from 'lucide-react';
import ScanResultCard from './ScanResultCard';
import { useQrCamera, type CameraError } from './useQrCamera';
import {
  formatScanTime,
  getScanLogLabel,
  getScanResultView,
  normalizeTicketCode,
  type GateAccessLogDto,
  type GateScanRequest,
  type ScanResultView,
} from '../../utils/gateScan';
import { fetchGateLogs, scanGateTicket } from '../../utils/gateScanApi';
import { playScanFeedback } from '../../utils/gateScanFeedback';

const GATE_NAME = 'Gate A';
const LOG_REFRESH_MS = 3000;

const CAMERA_ERROR_TEXT: Record<CameraError, string> = {
  denied: 'Camera access is blocked. Allow camera access and reload the page, or enter the ticket code instead.',
  unavailable: 'Camera is not available. It only works on localhost or HTTPS. You can enter the ticket code instead.',
};

const LOG_BADGE: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  DUPLICATE_ENTRY: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  REVOKED: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  INVALID_TICKET: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};
const LOG_BADGE_DEFAULT = 'bg-slate-500/20 text-slate-400 border border-slate-500/30';

interface GateScanTabProps {
  apiBase: string;
}

const GateScanTab: React.FC<GateScanTabProps> = ({ apiBase }) => {
  const [view, setView] = useState<ScanResultView | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [logs, setLogs] = useState<GateAccessLogDto[]>([]);
  const [logsFailed, setLogsFailed] = useState(false);

  // Khoá bằng ref vì camera đọc được nhiều lần trong lúc state chưa kịp cập nhật.
  const isLockedRef = useRef(false);
  const lastRequestRef = useRef<GateScanRequest | null>(null);

  const refreshLogs = useCallback(async () => {
    try {
      setLogs(await fetchGateLogs(apiBase));
      setLogsFailed(false);
    } catch {
      setLogsFailed(true);
    }
  }, [apiBase]);

  useEffect(() => {
    void refreshLogs();
    const timer = setInterval(() => void refreshLogs(), LOG_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refreshLogs]);

  const submitScan = useCallback(
    async (request: GateScanRequest) => {
      setIsChecking(true);
      const outcome = await scanGateTicket(apiBase, request);
      setIsChecking(false);

      if (outcome.kind === 'invalid') {
        isLockedRef.current = false;
        lastRequestRef.current = null;
        setInputError('Invalid ticket code.');
        return;
      }

      const nextView = getScanResultView(outcome.kind === 'result' ? outcome.response : null);
      setView(nextView);
      playScanFeedback(nextView.tone);
      void refreshLogs();
    },
    [apiBase, refreshLogs]
  );

  const startScan = useCallback(
    (ticketCode: string) => {
      if (isLockedRef.current) return;
      isLockedRef.current = true;
      setInputError(null);

      const request: GateScanRequest = {
        scanId: crypto.randomUUID(),
        ticketCode,
        gateName: GATE_NAME,
      };
      lastRequestRef.current = request;
      void submitScan(request);
    },
    [submitScan]
  );

  const handleCameraCode = useCallback(
    (raw: string) => {
      const ticketCode = normalizeTicketCode(raw);
      if (ticketCode) startScan(ticketCode);
    },
    [startScan]
  );

  const { videoRef, error: cameraError } = useQrCamera(handleCameraCode);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualCode.trim()) return;

    const ticketCode = normalizeTicketCode(manualCode);
    if (!ticketCode) {
      setInputError('Invalid ticket code.');
      return;
    }
    startScan(ticketCode);
  };

  const handleClose = () => {
    setView(null);
    setManualCode('');
    setInputError(null);
    lastRequestRef.current = null;
    isLockedRef.current = false;
  };

  // Thử lại giữ nguyên scanId để Mock trả đúng kết quả cũ nếu lần trước đã ghi nhận.
  const handleRetry = () => {
    if (!lastRequestRef.current) return;
    setView(null);
    void submitScan(lastRequestRef.current);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FE-ORG-9.4.1: camera */}
        <section className="p-5 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[#FF5A36]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Scan QR Code</h2>
          </div>

          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {cameraError ? (
              <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs text-slate-300 bg-[#080c14]">
                {CAMERA_ERROR_TEXT[cameraError]}
              </p>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-[#FF5A36]/80 rounded-2xl" />
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          {/* FE-ORG-9.4.2: nhập tay */}
          <section className="p-5 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Enter Ticket Code</h2>
            </div>

            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <input
                value={manualCode}
                onChange={(event) => {
                  setManualCode(event.target.value);
                  setInputError(null);
                }}
                placeholder="e.g. ATSH-GA-999"
                aria-label="Ticket code"
                className="flex-1 min-w-0 px-3 py-2 bg-[#080c14] border border-white/10 focus:border-[#FF5A36]/60 rounded-xl text-xs text-white font-mono outline-none"
              />
              <button
                type="submit"
                disabled={isChecking || !!view || !manualCode.trim()}
                className="px-4 py-2 bg-[#FF5A36] hover:bg-[#FF7252] disabled:opacity-50 text-white text-xs font-bold font-display rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Check</span>
              </button>
            </form>
            {inputError && <p className="text-xs text-rose-300">{inputError}</p>}
          </section>

          {/* FE-ORG-9.4.4: kết quả */}
          {view ? (
            <ScanResultCard view={view} isChecking={isChecking} onClose={handleClose} onRetry={handleRetry} />
          ) : (
            <div className="p-5 bg-[#080c14] border border-white/5 rounded-2xl text-center text-xs text-slate-500">
              {isChecking ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking ticket...
                </span>
              ) : (
                'Waiting for a ticket...'
              )}
            </div>
          )}
        </div>
      </div>

      {/* FE-ORG-9.4.2: nhật ký cổng */}
      <section className="p-6 bg-[#0d131d] border border-white/10 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Gate Access Log</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Auto-refresh: 3s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 pl-2">Time</th>
                <th className="pb-3">Ticket Code</th>
                <th className="pb-3">Gate</th>
                <th className="pb-3 pr-2">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    {logsFailed ? 'Could not load gate access logs.' : 'No scans yet.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pl-2 font-mono text-slate-300">{formatScanTime(log.scannedAt) ?? log.scannedAt}</td>
                    <td className="py-3 font-mono font-bold text-white">{log.ticketCode}</td>
                    <td className="py-3 text-slate-300">{log.gateName}</td>
                    <td className="py-3 pr-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${LOG_BADGE[log.scanResult] ?? LOG_BADGE_DEFAULT}`}>
                        {getScanLogLabel(log.scanResult)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default GateScanTab;
