import React from 'react';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';

export interface SellWizardProgressProps {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  handleAbandonSession: () => void;
  resumeDraftAvailable: boolean;
  ticketCode: string;
  isCancellingSession: boolean;
  isPublishing?: boolean;
  priceSubStep?: 'pricing' | 'confirm';
  setPriceSubStep?: (sub: 'pricing' | 'confirm') => void;
}

export const SellWizardProgress: React.FC<SellWizardProgressProps> = ({
  currentStep,
  setCurrentStep,
  handleAbandonSession,
  resumeDraftAvailable,
  ticketCode,
  isCancellingSession,
  isPublishing = false,
  priceSubStep = 'pricing',
  setPriceSubStep,
}) => {
  // Điều kiện hiển thị nút Back:
  // - Bước 6 (Đã publish): KHÔNG cho quay lại bất kỳ bước nào (tránh lỗi).
  // - Bước 2 & 3: Bấm quay lại sẽ hủy phiên & giải phóng khóa vé tại BTC.
  // - Bước 4: Cho phép quay lại Bước 3 hoặc quay lại màn 4.1 nếu đang ở 4.2.
  // - Bước 5: Cho phép quay lại Bước 4 (chỉnh giá bán).
  const canGoBack =
    !isPublishing &&
    !isCancellingSession &&
    (currentStep >= 2 && currentStep <= 5);

  const handleBackClick = () => {
    if (currentStep === 2 || currentStep === 3) {
      handleAbandonSession();
    } else if (currentStep === 4) {
      if (priceSubStep === 'confirm' && setPriceSubStep) {
        setPriceSubStep('pricing');
      } else {
        setCurrentStep(3);
      }
    } else if (currentStep === 5) {
      setCurrentStep(4);
    }
  };

  const isStepClickable = (stepNum: number) => {
    if (isPublishing || isCancellingSession) return false;
    // Khi đã publish (Bước 6) -> Khóa tuyệt đối, không cho bấm quay lại Bước 4 hay bất kỳ bước nào
    if (currentStep === 6) return false;
    // Không thể nhảy cóc vượt bước hiện tại
    if (stepNum > currentStep) return false;
    // Đang ở bước này
    if (stepNum === currentStep) return false;
    // Khi đã ở Bước 4, 5: chỉ cho click quay lại Bước 3, 4 (chưa public)
    if (currentStep >= 4 && stepNum >= 3) return true;
    // Các bước 1, 2 khi đã khóa vé thì phải qua nút Hủy để mở khóa
    return false;
  };

  return (
    <>
      {/* Process Stepper Header Bar (Compact & Close Proximity) */}
      <div className="w-fit mx-auto bg-[#0A0D14]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 sm:px-5 sm:py-2 shadow-2xl flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {canGoBack && (
            <button
              type="button"
              onClick={handleBackClick}
              disabled={isCancellingSession || isPublishing}
              className="p-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                currentStep === 2
                  ? 'Hủy phiên xác thực & mở khóa vé'
                  : currentStep === 4 && priceSubStep === 'confirm'
                  ? 'Quay lại chỉnh giá vé'
                  : currentStep === 5
                  ? 'Quay lại Bước 4 (Chỉnh giá bán)'
                  : 'Quay lại bước trước'
              }
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="font-mono font-bold text-white text-xs sm:text-sm tracking-wide shrink-0">
            {currentStep === 1 && 'Step 1: Enter Ticket Code'}
            {currentStep === 2 && 'Step 2: Organizer Verification'}
            {currentStep === 3 && 'Step 3: Confirm Ticket Details'}
            {currentStep === 4 && (priceSubStep === 'confirm' ? 'Step 4: Confirm Price & Mode' : 'Step 4: Set Resale Price')}
            {currentStep === 5 && 'Step 5: Review & Publish'}
            {currentStep === 6 && 'Step 6: Listing Complete'}
          </span>
        </div>

        <div className="w-px h-3.5 bg-white/15 shrink-0 hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {[1, 2, 3, 4, 5, 6].map((stepNum) => {
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const clickable = isStepClickable(stepNum);

            return (
              <React.Fragment key={stepNum}>
                <button
                  type="button"
                  onClick={() => {
                    if (clickable) setCurrentStep(stepNum);
                  }}
                  disabled={!clickable}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/30 scale-105 ring-2 ring-[#FF5722]/30'
                      : isCompleted
                      ? clickable
                        ? 'bg-emerald-500 text-black cursor-pointer hover:scale-105'
                        : 'bg-emerald-500/50 text-black/60 cursor-not-allowed'
                      : 'bg-[#151B26] text-slate-400 border border-white/5 cursor-default'
                  }`}
                  title={
                    isCurrent
                      ? `Bước ${stepNum} (Hiện tại)`
                      : isCompleted
                      ? clickable
                        ? `Quay lại Bước ${stepNum}`
                        : `Bước ${stepNum} (Đã khóa, không thể quay lại)`
                      : `Bước ${stepNum}`
                  }
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
