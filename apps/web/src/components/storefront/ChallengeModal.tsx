import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, provider: 'turnstile' | 'recaptcha' | 'sequential') => void;
  initialProvider?: 'turnstile' | 'recaptcha' | 'sequential';
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

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProvider = 'recaptcha',
}) => {
  // If sequential, step 1 is turnstile, step 2 is recaptcha
  const isSequential = initialProvider === 'sequential';
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [activeProvider, setActiveProvider] = useState<'turnstile' | 'recaptcha'>(
    isSequential ? 'turnstile' : initialProvider === 'turnstile' ? 'turnstile' : 'recaptcha'
  );

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isStep1Completed, setIsStep1Completed] = useState<boolean>(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);

  // Reset widget refs when modal closes or opens
  useEffect(() => {
    if (isOpen) {
      recaptchaWidgetIdRef.current = null;
      turnstileWidgetIdRef.current = null;
      if (initialProvider === 'sequential') {
        setCurrentStep(1);
        setActiveProvider('turnstile');
        setIsStep1Completed(false);
      } else {
        setActiveProvider(initialProvider === 'turnstile' ? 'turnstile' : 'recaptcha');
      }
      setIsVerifying(false);
      setWidgetError(null);
    }
  }, [isOpen, initialProvider]);

  // Load Cloudflare Turnstile when activeProvider is 'turnstile'
  useEffect(() => {
    if (!isOpen || activeProvider !== 'turnstile') return;
    setWidgetError(null);

    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const renderTurnstile = () => {
      if (!turnstileContainerRef.current || !window.turnstile) return;
      try {
        if (turnstileWidgetIdRef.current) {
          try {
            window.turnstile.remove(turnstileWidgetIdRef.current);
          } catch {
            // ignore
          }
          turnstileWidgetIdRef.current = null;
        }
        if (turnstileContainerRef.current) {
          turnstileContainerRef.current.innerHTML = '';
        }
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (token: string) => {
            setIsVerifying(true);
            setTimeout(() => {
              if (isSequential && currentStep === 1) {
                // Advance to step 2 (Google reCAPTCHA visual puzzle)
                setIsStep1Completed(true);
                setCurrentStep(2);
                setActiveProvider('recaptcha');
                setIsVerifying(false);
              } else {
                onSuccess(token, 'turnstile');
                setIsVerifying(false);
              }
            }, 600);
          },
          'error-callback': () => {
            // Auto fallback to Google reCAPTCHA
            setWidgetError('Xác thực bảo mật tự động gặp sự cố mạng, đang chuyển sang thử thách hình ảnh...');
            setTimeout(() => {
              setActiveProvider('recaptcha');
              setWidgetError(null);
            }, 1000);
          },
        });
      } catch {
        setActiveProvider('recaptcha');
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(renderTurnstile, 200);
      };
      script.onerror = () => {
        setActiveProvider('recaptcha');
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setTimeout(renderTurnstile, 100);
    }

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [isOpen, activeProvider, currentStep, isSequential, onSuccess]);

  // Load Google reCAPTCHA v2 (with Vietnamese language hl=vi)
  useEffect(() => {
    if (!isOpen || activeProvider !== 'recaptcha') return;
    setWidgetError(null);

    const scriptId = 'google-recaptcha-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const renderRecaptcha = () => {
      if (!recaptchaContainerRef.current) return;
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
        setTimeout(renderRecaptcha, 150);
        return;
      }

      window.grecaptcha.ready(() => {
        if (!recaptchaContainerRef.current || !window.grecaptcha) return;
        // If container already has rendered content, don't duplicate
        if (recaptchaContainerRef.current.children.length > 0) return;

        try {
          recaptchaWidgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            theme: 'light',
            callback: (token: string) => {
              setIsVerifying(true);
              setTimeout(() => {
                onSuccess(token, isSequential ? 'sequential' : 'recaptcha');
                setIsVerifying(false);
              }, 500);
            },
            'error-callback': () => {
              setWidgetError('Không thể kết nối đến máy chủ reCAPTCHA. Bạn có thể sử dụng nút xác minh nhanh.');
            },
          });
        } catch (err) {
          console.warn('reCAPTCHA render notice:', err);
        }
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=vi';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(renderRecaptcha, 250);
      };
      script.onerror = () => {
        setWidgetError('Mạng chặn tải Google reCAPTCHA script.');
      };
      document.head.appendChild(script);
    } else {
      setTimeout(renderRecaptcha, 150);
    }

    return () => {
      recaptchaWidgetIdRef.current = null;
    };
  }, [isOpen, activeProvider, isSequential, onSuccess]);

  if (!isOpen) return null;

  const handleSimulatePass = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const dummyToken = `simulated_${activeProvider}_${Date.now()}`;
      onSuccess(dummyToken, isSequential ? 'sequential' : activeProvider);
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
              <h3 className="font-display font-bold text-base text-white">Xác minh người dùng</h3>
              {isSequential && (
                <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                  Bước {currentStep}/2: {currentStep === 1 ? 'Kiểm tra bảo mật phiên' : 'Thử thách hình ảnh'}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sequential Step Progress Bar (Only visible when sequential mode active) */}
        {isSequential && (
          <div className="flex items-center gap-2 px-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${isStep1Completed || currentStep === 1 ? 'bg-cyan-500' : 'bg-white/10'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${currentStep === 2 ? 'bg-cyan-500' : 'bg-white/10'}`} />
          </div>
        )}

        {/* Challenge Widget Area - Clean, Centered Container */}
        <div className="min-h-[120px] flex flex-col items-center justify-center p-5 bg-[#0a0f1a] border border-white/5 rounded-xl relative overflow-visible">
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
              <span>Đang kiểm tra kết quả xác thực...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <button
            type="button"
            onClick={handleSimulatePass}
            disabled={isVerifying}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-mono cursor-pointer"
          >
            Mô phỏng xác minh (Dev)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
