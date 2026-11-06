import React from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { ScanResultView, ScanTone } from '../../utils/gateScan';

const TONE_STYLE: Record<ScanTone, { card: string; title: string; Icon: typeof CheckCircle2 }> = {
  success: {
    card: 'bg-emerald-500/10 border-emerald-500/40',
    title: 'text-emerald-300',
    Icon: CheckCircle2,
  },
  danger: {
    card: 'bg-rose-500/10 border-rose-500/40',
    title: 'text-rose-300',
    Icon: XCircle,
  },
  warning: {
    card: 'bg-amber-500/10 border-amber-500/40',
    title: 'text-amber-300',
    Icon: AlertTriangle,
  },
};

interface ScanResultCardProps {
  view: ScanResultView;
  isChecking: boolean;
  onClose: () => void;
  onRetry: () => void;
}

const ScanResultCard: React.FC<ScanResultCardProps> = ({ view, isChecking, onClose, onRetry }) => {
  const { card, title, Icon } = TONE_STYLE[view.tone];

  return (
    <div className={`p-5 border rounded-2xl space-y-3 ${card}`} role="status" aria-live="assertive">
      <div className="flex items-start gap-3">
        <Icon className={`w-8 h-8 shrink-0 ${title}`} />
        <div className="space-y-1">
          <p className={`text-base font-bold font-display tracking-wide ${title}`}>{view.title}</p>
          {view.detail && <p className="text-xs text-slate-300">{view.detail}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {view.canRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isChecking}
            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-200 border border-amber-500/30 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={isChecking}
          className="px-3 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
        >
          Scan next ticket
        </button>
      </div>
    </div>
  );
};

export default ScanResultCard;
