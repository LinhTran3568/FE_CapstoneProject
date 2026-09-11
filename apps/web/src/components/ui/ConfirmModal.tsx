import React, { useEffect, useId, useRef } from 'react';
import { Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  /** Short explanation under the title */
  description?: React.ReactNode;
  /** Small orange label above the title, e.g. "Seller Action" */
  eyebrow?: string;
  /** Extra content between the description and the buttons (summary card, warning…) */
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Label shown on the confirm button while `isLoading` is true */
  loadingLabel?: string;
  /** `danger` for destructive actions (cancel, delete), `brand` for normal confirmations */
  tone?: 'danger' | 'brand';
  /** While true, both buttons are disabled and the modal cannot be dismissed */
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Reusable confirmation dialog in the TicketShield dark style.
 * Closes on Esc, backdrop click or the X button — except while `isLoading`,
 * so a request in flight cannot be abandoned half-way.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  eyebrow,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  loadingLabel = 'Processing...',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the safe option first and allow Esc to dismiss.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onClose]);

  if (!open) return null;

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/30'
      : 'bg-[#FF5A36] hover:bg-[#FF7252] shadow-[#FF5A36]/30';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={() => !isLoading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="bg-[#0A0D12] border border-white/20 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
          className="absolute top-5 right-5 text-[#A3A8B3] hover:text-white p-1 rounded-full hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          {eyebrow && (
            <span className="text-xs text-[#FF5A36] font-bold font-display uppercase tracking-widest">
              {eyebrow}
            </span>
          )}
          <h3 id={titleId} className="text-2xl font-bold font-display text-white">
            {title}
          </h3>
          {description && (
            <p id={descriptionId} className="text-sm text-[#A3A8B3] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {children}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-5 py-3 text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-progress ${confirmClasses}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{isLoading ? loadingLabel : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
