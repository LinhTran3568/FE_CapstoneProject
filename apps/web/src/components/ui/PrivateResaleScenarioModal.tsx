import React from 'react';
import { ShieldCheck, X, CheckCircle2, XCircle, Lock, RefreshCw, HelpCircle, ArrowRight, Zap } from 'lucide-react';

export interface PrivateResaleScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  role?: 'seller' | 'buyer';
}

export const PrivateResaleScenarioModal: React.FC<PrivateResaleScenarioModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role = 'seller'
}) => {
  if (!isOpen) return null;

  const handleAction = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0B0F17] border border-emerald-500/40 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Ambient Background Header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-emerald-900/40 via-cyan-900/30 to-purple-900/40 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-400/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Why Does Private Resale Still Need TicketShield?
                </h3>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-xs font-mono font-semibold">
                  Private Resale
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {role === 'seller'
                  ? 'Explains why protection applies even when selling privately to friends or acquaintances.'
                  : 'Ensures 100% official organizer re-issuance and 24-hour buyer funds protection via private link.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Comparison Grid */}
        <div className="relative z-10 p-5 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Concept Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">TicketShield Service Value:</span> This is not just a listing fee, but <span className="text-emerald-400 font-semibold">24-Hour Funds Protection &amp; Direct Ticket Re-issuance from Event Organizers</span>.
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Off-platform P2P */}
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-red-500/20 font-bold text-red-400 text-sm">
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Direct Off-Platform Deal (Social Media)</span>
              </div>

              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Payment Risk:</strong> Direct bank transfers via chat apps carry a high risk of ghosting or lost money.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>Duplicate / Fake Ticket Risk:</strong> Sellers can send old screenshots or the same barcode to multiple people.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span><strong>No Name Transfer:</strong> Ticket and personal data remain registered under the original seller's name.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: TicketShield Private Resale */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/30 font-bold text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deal via TicketShield Private Link</span>
              </div>

              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>100% 24-Hour Funds Protection:</strong> Buyer funds are safely held. Sellers are assured payment, buyers are assured tickets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Official Organizer Re-issuance:</strong> The seller's previous barcode is canceled, and organizers issue a brand new ticket in the buyer's name.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Consistent Protection:</strong> Re-issuance infrastructure and financial safeguards apply equally to protect both parties.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Takeaway Note */}
          <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
            🛡️ Whether selling to a friend or someone new, your ticket is **100% officially recognized and transferred by event organizers**.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 flex items-center justify-between p-4 bg-[#080B11] border-t border-gray-800/80">
          <div className="text-xs text-gray-400 font-mono">
            Protected by TicketShield — Real Fans, Verified Tickets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAction}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <span>I Understand &amp; Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
