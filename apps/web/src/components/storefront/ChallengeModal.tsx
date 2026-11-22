import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, provider: 'turnstile' | 'recaptcha' | 'sequential') => void;
  tierName?: string;
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
  tierName,
  initialProvider = 'recaptcha',
}) => {
  // If sequential, step 1 is turnstile, step 2 is recaptcha
  const isSequential = initialProvider === 'sequential';
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [activeProvider, setActiveProvider] = useState<'turnstile' | 'recaptcha'>(
    isSequential ? 'turnstile' : initialProvider === 'turnstile' ? 'turnstile' : 'recaptcha'
  );

  const [widgetError, setWidgetError] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef(onSuccess);
  useEffect(() => { successRef.current = onSuccess; }, [onSuccess]);

  useEffect(() => {
    if (!isOpen) return;
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
      if (!disposed) setWidgetError('Verification could not load. Close this dialog and try again.');
    };
    const answer = (token: string) => {
      if (disposed || answered) return;
      answered = true;
      if (isSequential && cloudflare) {
        setCurrentStep(2);
        setActiveProvider('recaptcha');
      } else {
        successRef.current(token, isSequential ? 'sequential' : activeProvider);
      }
    };
    const render = () => {
      if (disposed) return;
      try {
        if (cloudflare && window.turnstile) {
          turnstileId = window.turnstile.render(mount, {
            sitekey: TURNSTILE_SITE_KEY, theme: 'dark', callback: answer, 'error-callback': onError,
          });
        } else if (!cloudflare && window.grecaptcha) {
          window.grecaptcha.ready(() => {
            if (disposed || !window.grecaptcha) return;
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
          : 'https://www.google.com/recaptcha/api.js?render=explicit&hl=en';
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
  }, [isOpen, activeProvider, isSequential]);

  if (!isOpen) return null;

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
              <h3 className="font-display font-bold text-base text-white">Security Verification</h3>
              {tierName && <p className="text-xs text-slate-300">{tierName}</p>}
              {isSequential && (
                <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                  Step {currentStep}/2: {currentStep === 1 ? 'Session Security Check' : 'Visual Puzzle Challenge'}
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
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end border-t border-white/5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
