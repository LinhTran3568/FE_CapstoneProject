import React, { useState } from 'react';
import { QrCode, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface VietQrPanelProps {
  qrImageUrl?: string | null;
  quickLinkUrl?: string | null;
  isExpired?: boolean;
  amount?: number;
  currency?: string;
  className?: string;
}

export const VietQrPanel: React.FC<VietQrPanelProps> = ({
  qrImageUrl,
  isExpired = false,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`flex flex-col items-center justify-between p-4 rounded-2xl bg-[#1A2335] border border-[#28354D] relative overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722] shadow-sm">
            <QrCode className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold tracking-wider uppercase text-zinc-200">
            VietQR 247
          </h4>
        </div>
      </div>

      {/* QR Code Container with High-Contrast White Background & Expanded Size */}
      <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[310px] p-1.5 rounded-2xl bg-white shadow-xl shadow-black/60 flex items-center justify-center border border-zinc-200 my-auto shrink-0 transition-transform duration-200">
        {/* Shimmer skeleton while image is loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-1.5 rounded-xl bg-zinc-100 flex flex-col items-center justify-center animate-pulse overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 mb-1.5 flex items-center justify-center text-zinc-400">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div className="h-2 w-20 bg-zinc-200 rounded mb-1" />
            <div className="h-1.5 w-12 bg-zinc-200 rounded" />
          </div>
        )}

        {/* Real Dynamic VietQR Image */}
        {qrImageUrl && !imageError ? (
          <img
            src={qrImageUrl}
            alt="VietQR Payment Code"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            className={`w-full h-full object-contain rounded-lg transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isExpired ? 'filter grayscale blur-[2px] opacity-40' : ''}`}
          />
        ) : (
          <div className="text-center p-3 text-zinc-400 flex flex-col items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 mb-1" />
            <p className="text-[11px] font-medium text-zinc-700">Unable to load QR</p>
            <p className="text-[9px] text-zinc-400">Please use the account details beside</p>
          </div>
        )}

        {/* Expired Overlay */}
        {isExpired && (
          <div className="absolute inset-0 rounded-2xl bg-black/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center z-20 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
              QR Code Expired
            </span>
            <p className="text-[10px] text-zinc-300 mt-0.5">
              Hold session has ended
            </p>
          </div>
        )}
      </div>

      {/* Short instruction text below QR */}
      <div className="w-full mt-2 pt-1.5 border-t border-[#28354D] text-center shrink-0">
        <p className="text-[11px] text-zinc-400 font-medium">
          Scan to pay with Banking App
        </p>
      </div>
    </div>
  );
};
