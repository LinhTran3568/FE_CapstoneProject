import React from 'react';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';

export interface SellWizardProgressProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  handleAbandonSession: () => void;
  resumeDraftAvailable: boolean;
  ticketCode: string;
  isCancellingSession: boolean;
}

export const SellWizardProgress: React.FC<SellWizardProgressProps> = ({
  currentStep,
  setCurrentStep,
  handleAbandonSession,
  resumeDraftAvailable,
  ticketCode,
  isCancellingSession,
}) => {
  return (
    <>
      {/* Process Stepper Header Bar (Compact & Close Proximity) */}
      <div className="w-fit mx-auto bg-[#0A0D14]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 sm:px-5 sm:py-2 shadow-2xl flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {currentStep > 1 && currentStep < 6 && (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 2) {
                  handleAbandonSession();
                } else {
                  setCurrentStep((prev) => prev - 1);
                }
              }}
              className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Back to previous step"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-wide shrink-0">
            {currentStep === 1 && 'Step 1: Enter Ticket Code'}
            {currentStep === 2 && 'Step 2: Organizer Verification'}
            {currentStep === 3 && 'Step 3: Confirm Ticket Details'}
            {currentStep === 4 && 'Step 4: Set Resale Price'}
            {currentStep === 5 && 'Step 5: Review & Publish'}
            {currentStep === 6 && 'Step 6: Listing Complete'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-white/15 shrink-0 hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => {
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <React.Fragment key={stepNum}>
                <button
                  type="button"
                  onClick={() => {
                    if (stepNum < currentStep) setCurrentStep(stepNum);
                  }}
                  disabled={stepNum > currentStep}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/30 scale-105 ring-2 ring-[#FF5722]/30'
                      : isCompleted
                      ? 'bg-emerald-500 text-black cursor-pointer hover:scale-105'
                      : 'bg-[#151B26] text-slate-400 border border-white/5 cursor-default'
                  }`}
                  title={`Step ${stepNum}`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black stroke-[3]" /> : stepNum}
                </button>
                {stepNum < 6 && (
                  <div
                    className={`w-1.5 sm:w-2.5 h-[1.5px] rounded-full transition-colors ${
                      stepNum < currentStep ? 'bg-emerald-500' : 'bg-slate-700/70'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Draft resume session banner */}
      {resumeDraftAvailable && currentStep > 1 && currentStep < 6 && (
        <div className="max-w-2xl mx-auto px-4 py-2.5 bg-[#0A131F]/90 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <div className="text-xs text-slate-200 truncate flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-white">Draft Session:</span>
              <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold rounded text-[11px]">
                {ticketCode}
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                (Step {currentStep}/6 · Auto Restored)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAbandonSession}
            disabled={isCancellingSession}
            className="self-end sm:self-auto px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/35 hover:border-rose-400 rounded-lg font-mono text-[11px] font-semibold transition-all duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
            title="Cancel session & unlock ticket at Organizer"
          >
            {isCancellingSession ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Unlocking...</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                <span>Discard & Unlock</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};
