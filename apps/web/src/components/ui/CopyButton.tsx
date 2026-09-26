import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'accent' | 'warning' | 'ghost';
  ariaLabel?: string;
  onCopySuccess?: () => void;
  onCopyError?: (err: Error) => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  label = 'Sao chép',
  copiedLabel = 'Đã sao chép',
  className = '',
  iconOnly = false,
  size = 'sm',
  variant = 'default',
  ariaLabel,
  onCopySuccess,
  onCopyError,
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for older browsers / non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        if (!successful) throw new Error('execCommand failed');
      }

      setError(false);
      setCopied(true);
      if (onCopySuccess) {
        onCopySuccess();
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (err: any) {
      console.error('Failed to copy to clipboard:', err);
      setError(true);
      setCopied(false);
      if (onCopyError) {
        onCopyError(err instanceof Error ? err : new Error(String(err)));
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  const getVariantStyles = () => {
    if (error) {
      return 'bg-red-500/15 text-red-400 border-red-500/40';
    }
    if (copied) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    }

    switch (variant) {
      case 'accent':
        return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 active:scale-95';
      case 'warning':
        return 'bg-[#151C2B] hover:bg-[#1E293B] text-zinc-200 border-[#293548] hover:border-zinc-500 active:scale-95';
      case 'ghost':
        return 'bg-transparent hover:bg-white/10 text-zinc-300 border-transparent hover:border-white/10';
      case 'default':
      default:
        return 'bg-[#151C2B] hover:bg-[#1E293B] text-zinc-200 border-[#293548] hover:border-zinc-500 active:scale-95';
    }
  };

  const sizeStyles =
    size === 'md'
      ? `h-8 px-3 text-xs gap-1.5 rounded-lg ${iconOnly ? 'w-8' : 'min-w-[110px]'}`
      : `h-7 px-2.5 text-[11px] gap-1.5 rounded-lg ${iconOnly ? 'w-7' : 'min-w-[100px]'}`;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel || (copied ? copiedLabel : `${label} ${value}`)}
      className={`relative inline-flex items-center justify-center font-medium font-sans border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none shadow-sm ${getVariantStyles()} ${sizeStyles} ${className}`}
    >
      {error ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          {!iconOnly && <span className="font-semibold text-red-300 text-[10px]">Lỗi sao chép</span>}
        </>
      ) : copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5] animate-in fade-in zoom-in duration-150" />
          {!iconOnly && <span className="font-semibold text-emerald-300">{copiedLabel}</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 shrink-0 opacity-80" />
          {!iconOnly && <span className="font-medium">{label}</span>}
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : error ? 'Lỗi sao chép' : ''}
      </span>
    </button>
  );
};
