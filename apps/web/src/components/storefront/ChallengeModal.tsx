import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, provider: 'turnstile' | 'recaptcha' | 'sequential') => void;
  tierName?: string;
  initialProvider?: 'turnstile' | 'recaptcha' | 'sequential';
  failCount?: number;
  onFail?: (failCount: number) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

// Official test keys (always pass on localhost)
const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

const getCooldownSeconds = (fails: number) => {
  if (fails <= 0) return 0;
  if (fails === 1) return 5;
  if (fails === 2) return 15;
  if (fails >= 5) return 900;
  return 60;
};

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tierName,
  initialProvider = 'recaptcha',
  failCount = 0,
  onFail,
}) => {
  // If sequential, step 1 is turnstile, step 2 is recaptcha
  const isSequential = initialProvider === 'sequential';
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [activeProvider, setActiveProvider] = useState<'turnstile' | 'recaptcha'>(
    isSequential ? 'turnstile' : initialProvider === 'turnstile' ? 'turnstile' : 'recaptcha'
  );

  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [internalFailCount, setInternalFailCount] = useState<number>(failCount);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(getCooldownSeconds(failCount));
  const [isVerifying, setIsVerifying] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef(onSuccess);
  useEffect(() => { successRef.current = onSuccess; }, [onSuccess]);

  // Cooldown timer tick down (SCRUM-398 Anti-bot brute-force protection)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Reset widget refs when modal closes or opens
  useEffect(() => {
    if (isOpen) {
      setInternalFailCount(failCount);
      setCooldownSeconds(getCooldownSeconds(failCount));
      setWidgetError(null);
      setIsVerifying(false);
    }
  }, [isOpen, failCount]);

  useEffect(() => {
    if (!isOpen || cooldownSeconds > 0) return;
    const cloudflare = activeProvider === 'turnstile';
    const container = cloudflare ? turnstileContainerRef.current : recaptchaContainerRef.current;
    if (!container) return;
    const mount = document.createElement('div');
    container.appendChild(mount);
    let disposed = false;
    let answered = false;
    let turnstileId: string | undefined;
    let googleId: number | undefined;
    setWidgetError(null);
    const onError = () => {
      if (!disposed) {
        handleFailChallenge('Không thể tải mã xác thực. Vui lòng thử lại sau.');
      }
    };
    const answer = (token: string) => {
      if (disposed || answered || cooldownSeconds > 0) return;
      answered = true;
      if (isSequential && cloudflare) {
        setCurrentStep(2);
        setActiveProvider('recaptcha');
      } else {
        setInternalFailCount(0);
        onFail?.(0);
        successRef.current(token, isSequential ? 'sequential' : activeProvider);
      }
    };
    const render = () => {
      if (disposed || cooldownSeconds > 0) return;
      try {
        if (cloudflare && window.turnstile) {
          turnstileId = window.turnstile.render(mount, {
            sitekey: TURNSTILE_SITE_KEY, theme: 'dark', callback: answer, 'error-callback': onError,
          });
        } else if (!cloudflare && window.grecaptcha) {
          window.grecaptcha.ready(() => {
            if (disposed || !window.grecaptcha || cooldownSeconds > 0) return;
            try {
              googleId = window.grecaptcha.render(mount, {
                sitekey: RECAPTCHA_SITE_KEY, theme: 'light', callback: answer, 'error-callback': onError,
              });
            } catch { onError(); }
          });
        } else { onError(); }
      } catch { onError(); }
    };
    const id = cloudflare ? 'cf-turnstile-script' : 'google-recaptcha-script';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');
    const loadError = () => { script.remove(); onError(); };
    if (cloudflare ? window.turnstile : window.grecaptcha?.ready) {
      render();
    } else {
      script.addEventListener('load', render);
      script.addEventListener('error', loadError);
      if (!existing) {
        script.id = id;
        script.async = true;
        script.src = cloudflare
          ? 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
          : 'https://www.google.com/recaptcha/api.js?render=explicit&hl=vi';
        document.head.appendChild(script);
      }
    }
    return () => {
      disposed = true;
      script.removeEventListener('load', render);
      script.removeEventListener('error', loadError);
      try {
        if (turnstileId !== undefined) window.turnstile?.remove(turnstileId);
        if (googleId !== undefined) window.grecaptcha?.reset(googleId);
      } finally { mount.remove(); }
    };
  }, [isOpen, activeProvider, isSequential, cooldownSeconds]);

  if (!isOpen) return null;

  const handleFailChallenge = (customMsg?: string) => {
    const nextFails = internalFailCount + 1;
    setInternalFailCount(nextFails);
    onFail?.(nextFails);

    if (nextFails >= 5) {
      setCooldownSeconds(900);
      setWidgetError('Bạn đã giải sai 5 lần liên tiếp. Phiên mua vé bị hủy để nhả vé về kho chung (Khóa 15 phút).');
      setTimeout(() => {
        onClose();
      }, 3500);
      return;
    }

    const cd = getCooldownSeconds(nextFails);
    setCooldownSeconds(cd);
    setWidgetError(customMsg || `Xác thực chưa đúng (Lần ${nextFails}/5). Vui lòng chờ ${cd}s trước khi thử lại.`);
  };

  const handleSimulatePass = () => {
    if (cooldownSeconds > 0) return;
    setIsVerifying(true);
    setTimeout(() => {
      const dummyToken = `simulated_${activeProvider}_${Date.now()}`;
      setInternalFailCount(0);
      onFail?.(0);
      successRef.current(dummyToken, isSequential ? 'sequential' : activeProvider);
      setIsVerifying(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#111622] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4cd7f6]/10 flex items-center justify-center text-[#4cd7f6] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Xác thực thao tác</h3>
              {tierName && <p className="text-xs text-slate-300">{tierName}</p>}
              {isSequential && (
                <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                  Bước {currentStep}/2: {currentStep === 1 ? 'Kiểm tra an ninh' : 'Thử thách hình ảnh'}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sequential Step Progress Bar (Only visible when sequential mode active) */}
        {isSequential && (
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 flex-1 rounded-full bg-cyan-500" />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${currentStep === 2 ? 'bg-cyan-500' : 'bg-white/10'}`} />
          </div>
        )}

        {/* Challenge Widget Area - Clean, Centered Container with Cooldown Lock (SCRUM-398) */}
        <div className="min-h-[140px] flex flex-col items-center justify-center p-5 bg-[#0a0f1a] border border-white/5 rounded-xl relative overflow-visible">
          {cooldownSeconds > 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">
                  Tạm thời khóa thử lại ({internalFailCount} lần chưa đúng)
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vui lòng chờ <span className="font-mono font-bold text-amber-400 text-sm">{cooldownSeconds}s</span> trước khi thử lại
                </p>
              </div>
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(cooldownSeconds / getCooldownSeconds(internalFailCount)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {activeProvider === 'turnstile' && (
                <div ref={turnstileContainerRef} className="flex justify-center" />
              )}

              {activeProvider === 'recaptcha' && (
                <div className="flex justify-center w-full">
                  <div ref={recaptchaContainerRef} className="flex justify-center shadow-md rounded overflow-visible" />
                </div>
              )}

              {widgetError && (
                <p className="text-[11px] text-amber-400 text-center mt-3 font-mono">
                  {widgetError}
                </p>
              )}

              {isVerifying && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mt-3">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xác nhận kết quả...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSimulatePass}
              disabled={isVerifying || cooldownSeconds > 0}
              className="text-[11px] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors font-mono cursor-pointer"
            >
              Simulate Pass (Dev)
            </button>
            <span className="text-white/10">|</span>
            <button
              type="button"
              onClick={() => handleFailChallenge()}
              disabled={isVerifying || cooldownSeconds > 0}
              className="text-[11px] text-rose-400/80 hover:text-rose-300 disabled:opacity-30 transition-colors font-mono cursor-pointer"
            >
              Simulate Fail (Dev)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
