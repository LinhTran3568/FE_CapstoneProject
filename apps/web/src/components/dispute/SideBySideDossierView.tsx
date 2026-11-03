import React, { useState, useEffect } from 'react';
import {
  DisputeListItemDto,
  disputesApi,
  DisputeReasonCode,
  ResolveDisputeRequest
} from '@ticketshield/api-client';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ScanLine,
  User,
  Ticket,
  Maximize2,
  X,
  Loader2,
  ArrowRight,
  Lock,
  DollarSign
} from 'lucide-react';

interface SideBySideDossierViewProps {
  dossier: DisputeListItemDto;
  onResolved?: () => void;
}

export const SideBySideDossierView: React.FC<SideBySideDossierViewProps> = ({ dossier, onResolved }) => {
  const [evidenceBlobs, setEvidenceBlobs] = useState<Record<string, string>>({});
  const [loadingEvidences, setLoadingEvidences] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Verdict Modal state
  const [verdictModal, setVerdictModal] = useState<{
    open: boolean;
    decision: 'Approve' | 'Reject';
  } | null>(null);
  const [adminReason, setAdminReason] = useState<string>('');
  const [isSubmittingVerdict, setIsSubmittingVerdict] = useState<boolean>(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);

  // Load evidence blobs securely via Bearer token
  useEffect(() => {
    let isMounted = true;
    const blobUrls: string[] = [];

    const loadImages = async () => {
      if (!dossier.evidences || dossier.evidences.length === 0) {
        setEvidenceBlobs({});
        return;
      }
      setLoadingEvidences(true);
      const urlMap: Record<string, string> = {};

      for (const ev of dossier.evidences) {
        try {
          const blob = await disputesApi.getEvidenceBlob(dossier.disputeId, ev.evidenceId);
          const objUrl = URL.createObjectURL(blob);
          blobUrls.push(objUrl);
          urlMap[ev.evidenceId] = objUrl;
        } catch {
          // If blob API is unavailable or fallback URL exists
          urlMap[ev.evidenceId] = ev.fileUrl;
        }
      }

      if (isMounted) {
        setEvidenceBlobs(urlMap);
        setLoadingEvidences(false);
      }
    };

    loadImages();

    return () => {
      isMounted = false;
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [dossier.disputeId, dossier.evidences]);

  // Handle verdict confirmation click
  const handleOpenVerdictModal = (decision: 'Approve' | 'Reject') => {
    setVerdictError(null);
    let defaultReason = '';
    if (decision === 'Approve') {
      defaultReason = dossier.recommendation === 'RECOMMEND_REFUND'
        ? 'Refund Approved: Automated venue checks confirmed ticket issue prior to transfer or gate scan failure.'
        : '100% Escrow refund approved for buyer upon evidence review.';
    } else {
      defaultReason = dossier.recommendation === 'RECOMMEND_REJECT_FRAUD'
        ? 'Dispute Rejected: Venue access logs confirm ticket was successfully scanned at gates after transfer timestamp.'
        : 'Dispute rejected and Escrow released to seller due to lack of issue evidence.';
    }
    setAdminReason(defaultReason);
    setVerdictModal({ open: true, decision });
  };

  const handleSubmitVerdict = async () => {
    if (!verdictModal) return;
    if (!adminReason.trim()) {
      setVerdictError('Please provide an adjudication reason.');
      return;
    }

    try {
      setIsSubmittingVerdict(true);
      setVerdictError(null);

      const payload: ResolveDisputeRequest = {
        decision: verdictModal.decision,
        reason: adminReason.trim()
      };

      await disputesApi.resolveDispute(dossier.disputeId, payload);
      setVerdictModal(null);
      if (onResolved) {
        onResolved();
      }
    } catch (err: any) {
      setVerdictError(err.response?.data?.message || err.message || 'Error submitting verdict.');
    } finally {
      setIsSubmittingVerdict(false);
    }
  };

  // Reason Code label mapping
  const getReasonLabel = (code: DisputeReasonCode | number) => {
    switch (Number(code)) {
      case DisputeReasonCode.TicketInvalid:
        return 'Invalid ticket code / ticket not received';
      case DisputeReasonCode.DuplicateEntry:
        return 'Duplicate ticket code / already redeemed';
      case DisputeReasonCode.FakeTicket:
        return 'Counterfeit ticket / incorrect listing details';
      default:
        return 'Issue claim';
    }
  };

  const isResolved = dossier.status.toUpperCase() === 'RESOLVED' || dossier.status.toUpperCase() === 'REJECTED';

  return (
    <div className="flex flex-col h-full bg-[#0A0D14] border border-slate-800 rounded-xl overflow-hidden text-slate-100 shadow-2xl">
      {/* Dossier Header Bar */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FF5A36]/10 border border-[#FF5A36]/30 flex items-center justify-center text-[#FF5A36] font-mono font-bold text-sm">
            DP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-mono font-bold tracking-tight text-white">{dossier.disputeCode}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                dossier.status.toUpperCase() === 'OPEN'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : dossier.status.toUpperCase() === 'RESOLVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {dossier.status.toUpperCase() === 'OPEN' ? 'PENDING ADJUDICATION' : dossier.status.toUpperCase() === 'RESOLVED' ? 'REFUNDED' : 'REJECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-sans">
              <span>Event: <strong className="text-slate-200">{dossier.eventTitle}</strong></span>
              <span>•</span>
              <span>Ticket Code: <code className="text-[#FF5A36] bg-[#FF5A36]/10 px-1.5 py-0.5 rounded font-mono text-[11px]">{dossier.ticketCode}</code></span>
            </p>
          </div>
        </div>

        {/* 1-Click Action Buttons for OPEN Disputes */}
        {!isResolved ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleOpenVerdictModal('Approve')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/40 border border-emerald-400/30 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>1-Click: Approve Refund</span>
            </button>
            <button
              onClick={() => handleOpenVerdictModal('Reject')}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-950/40 border border-rose-400/30 active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-rose-200" />
              <span>1-Click: Reject Dispute</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Adjudication finalized ({dossier.resolvedAt ? new Date(dossier.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recorded'})</span>
          </div>
        )}
      </div>

      {/* Resolution Outcome Banner if already resolved */}
      {isResolved && (
        <div className={`p-4 border-b text-xs flex items-start gap-3 ${
          dossier.status.toUpperCase() === 'RESOLVED'
            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
            : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
        }`}>
          {dossier.status.toUpperCase() === 'RESOLVED' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold text-sm">
              {dossier.status.toUpperCase() === 'RESOLVED' ? 'OUTCOME: REFUND GRANTED TO BUYER' : 'OUTCOME: DISPUTE REJECTED & ESCROW RELEASED TO SELLER'}
            </div>
            {dossier.adminNotes && (
              <p className="mt-1 opacity-90 italic">Adjudication note: "{dossier.adminNotes}"</p>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Split Dossier Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* LEFT PANE: Buyer Dossier & Evidence Images */}
        <div className="p-5 flex flex-col gap-5 bg-[#090C12]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF5A36]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">1. Buyer Evidence Dossier</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Filed: {new Date(dossier.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Buyer & Transaction Metadata */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Buyer:</span>
              <div className="font-medium text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{dossier.buyerName}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{dossier.buyerEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Frozen Escrow Value:</span>
              <div className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{dossier.totalBuyerPaid ? dossier.totalBuyerPaid.toLocaleString('en-US') : '0'} ₫</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Seller: {dossier.sellerName}</span>
            </div>
          </div>

          {/* Reason & Buyer Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispute Reason:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[#FF5A36] text-xs font-medium border border-slate-700">
                {getReasonLabel(dossier.reasonCode)}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              {dossier.description || 'No detailed statement provided by buyer.'}
            </div>
          </div>

          {/* Evidence Image Gallery */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Attached Evidence ({dossier.evidences?.length || 0}):
            </span>

            {loadingEvidences ? (
              <div className="p-6 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
                <span>Loading evidence images...</span>
              </div>
            ) : dossier.evidences && dossier.evidences.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {dossier.evidences.map((ev) => {
                  const imgSrc = evidenceBlobs[ev.evidenceId] || ev.fileUrl;
                  return (
                    <div
                      key={ev.evidenceId}
                      onClick={() => setSelectedImage(imgSrc)}
                      className="group relative h-36 rounded-lg overflow-hidden border border-slate-800 bg-black cursor-pointer hover:border-[#FF5A36]/60 transition-all shadow-md"
                    >
                      <img
                        src={imgSrc}
                        alt="Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                        <Maximize2 className="w-4 h-4 text-[#FF5A36]" />
                        <span>View</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500 italic">
                No evidence images attached by buyer.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Automated BTC Gate Access Log & System Recommendation Tag */}
        <div className="p-5 flex flex-col gap-5 bg-[#0B0E17]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">2. Venue Access Logs & Reconciliation</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Transferred: {dossier.transferredAt ? new Date(dossier.transferredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </span>
          </div>

          {/* System Recommendation Banner */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">System Recommendation (Automated Analysis):</span>
            
            {dossier.recommendation === 'RECOMMEND_REFUND' ? (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <span>RECOMMENDATION: APPROVE REFUND</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-200/90 leading-relaxed">
                    Automated checks detected ticket cancellation/revocation from organizer or no successful gate entry after transfer timestamp.
                  </p>
                </div>
              </div>
            ) : dossier.recommendation === 'RECOMMEND_REJECT_FRAUD' ? (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-rose-400 flex items-center gap-2">
                    <span>RECOMMENDATION: REJECT DISPUTE (POTENTIAL FRAUD)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-rose-200/90 leading-relaxed">
                    Automated venue access logs confirm ticket was successfully scanned at entry gates after transfer timestamp. Claim indicates potential fraud.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-start gap-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-amber-400">MANUAL REVIEW REQUIRED</div>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    Insufficient automated access logs from venue or event has not yet taken place. Review buyer evidence manually.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Automated BTC Gate Scan Logs Feed */}
          <div className="flex-1 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Gate Access Logs ({dossier.scans?.length || 0}):</span>
              <span className="text-[11px] text-slate-500 font-mono">GATE LOGS</span>
            </div>

            <div className="flex-1 min-h-[220px] rounded-lg bg-slate-950/80 border border-slate-800 p-3 overflow-y-auto space-y-2.5 font-mono text-xs">
              {dossier.scans && dossier.scans.length > 0 ? (
                dossier.scans.map((scan, idx) => {
                  const isSuccess = scan.scanResult.toUpperCase() === 'SUCCESS';
                  const scanTime = new Date(scan.scannedAt);
                  const transferTime = dossier.transferredAt ? new Date(dossier.transferredAt) : null;
                  const isAfterTransfer = transferTime ? scanTime >= transferTime : true;

                  return (
                    <div
                      key={`${scan.ticketCode || ''}-${scan.scannedAt}-${idx}`}
                      className={`p-3 rounded-lg border flex flex-col gap-1.5 transition-all ${
                        isSuccess && isAfterTransfer
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                          : isSuccess
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="font-bold text-slate-200">{scan.gateName || 'Venue Entry Gate'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {scan.scanResult}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Scanned: {scanTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {transferTime && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            isAfterTransfer ? 'bg-rose-500/10 text-rose-400 font-semibold' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isAfterTransfer ? 'After transfer' : 'Before transfer'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 bg-black/40 p-1.5 rounded font-mono">
                        <span>Ticket: <code className="text-slate-300">{scan.ticketCode || dossier.ticketCode}</code></span>
                        {scan.scannerDeviceId && (
                          <span>Device: <code className="text-slate-300">{scan.scannerDeviceId}</code></span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                  <Clock className="w-6 h-6 mb-2 opacity-40 text-slate-400" />
                  <p>No automated gate access logs recorded from organizer.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    (Please inspect buyer evidence documents or gate scanner photos)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Full Evidence" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

      {/* 1-Click Verdict Confirmation Modal */}
      {verdictModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D111A] border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {verdictModal.decision === 'Approve' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="font-bold text-base text-white">
                  Confirm Verdict: {verdictModal.decision === 'Approve' ? 'Approve 100% Refund' : 'Reject Dispute'}
                </h3>
              </div>
              <button
                onClick={() => setVerdictModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Dispute Code: <strong className="text-white font-mono">{dossier.disputeCode}</strong>
              </p>
              
              {verdictModal.decision === 'Approve' ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  This command will refund <strong>{dossier.totalBuyerPaid ? dossier.totalBuyerPaid.toLocaleString('en-US') : '0'} ₫</strong> from Escrow back to the buyer and cancel this transaction.
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  This command will reject the buyer claim and trigger Escrow payout release to the seller.
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Admin / Moderator Adjudication Notes:</label>
                <textarea
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#FF5A36]"
                  placeholder="Enter adjudication reason..."
                />
              </div>

              {verdictError && (
                <div className="p-2.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {verdictError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isSubmittingVerdict}
                onClick={() => setVerdictModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingVerdict}
                onClick={handleSubmitVerdict}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-all ${
                  verdictModal.decision === 'Approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmittingVerdict && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm Verdict</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
