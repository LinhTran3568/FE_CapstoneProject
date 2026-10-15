import React, { useState } from 'react';

interface InteractiveStadiumMapProps {
  selectedTierKey: 'diamond' | 'vipa' | 'ga' | 'tribune';
  onSelectTier: (tierKey: 'diamond' | 'vipa' | 'ga' | 'tribune') => void;
}

export const InteractiveStadiumMap: React.FC<InteractiveStadiumMapProps> = ({
  selectedTierKey,
  onSelectTier,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoverLabel, setHoverLabel] = useState<string>('Nhấp vào khu vực để chọn');

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.7, Math.min(1.8, +(prev + delta).toFixed(1))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#0c0e16] overflow-hidden shadow-2xl ring-1 ring-[#33343d]/40 flex flex-col">
      {/* Control Bar on Top of Map */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-[#282a32]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-[#33343d]/50">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff5945] animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            Live Stadium View
          </span>
          <span className="text-[#aa8984]">|</span>
          <span className="text-xs text-[#4cd7f6] font-semibold">{hoverLabel}</span>
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#282a32]/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-[#33343d]/50">
          <button
            type="button"
            onClick={() => handleZoom(0.2)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#e3beb8] hover:text-white hover:bg-[#33343d] transition-all"
            title="Phóng to"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.2)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#e3beb8] hover:text-white hover:bg-[#33343d] transition-all"
            title="Thu nhỏ"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#e3beb8] hover:text-white hover:bg-[#33343d] transition-all"
            title="Đặt lại góc nhìn"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          </button>
        </div>
      </div>

      {/* SVG Visual Stadium Canvas */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] flex items-center justify-center p-3 select-none overflow-hidden bg-gradient-to-b from-[#11131b] via-[#0c0e16] to-[#08090d]">
        {/* Ambient Stage Glows */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-gradient-to-b from-[#ff5945]/20 via-[#571bc1]/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-16 left-1/4 w-32 h-32 bg-[#4cd7f6]/15 blur-2xl pointer-events-none" />
        <div className="absolute top-16 right-1/4 w-32 h-32 bg-[#ff5945]/20 blur-2xl pointer-events-none" />

        <svg
          className="w-full h-full max-h-[580px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
          viewBox="0 0 800 600"
        >
          <defs>
            <linearGradient id="mainStageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#373942" />
              <stop offset="100%" stopColor="#191B23" />
            </linearGradient>
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF5945" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF5945" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="diamondGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D0BCFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#571BC1" stopOpacity="0.1" />
            </radialGradient>
            <filter id="neonFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Laser Beams */}
          <polygon points="400,60 200,0 260,0" fill="url(#laserGrad)" opacity="0.35" />
          <polygon points="400,60 600,0 540,0" fill="url(#laserGrad)" opacity="0.35" />
          <polygon points="400,60 120,40 180,40" fill="url(#laserGrad)" opacity="0.25" />
          <polygon points="400,60 680,40 620,40" fill="url(#laserGrad)" opacity="0.25" />

          {/* MAIN STAGE */}
          <g className="cursor-default">
            <path
              d="M 270 50 L 530 50 L 510 110 L 290 110 Z"
              fill="url(#mainStageGrad)"
              stroke="#aa8984"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <rect x="300" y="58" width="200" height="8" rx="3" fill="#FF5945" filter="url(#neonFilter)" opacity="0.9" />
            <text x="400" y="92" textAnchor="middle" fill="#E1E1ED" fontFamily="Space Grotesk" fontSize="14" fontWeight="700" letterSpacing="3">
              MAIN STAGE
            </text>
          </g>

          {/* T-Walk Runway to Stage B */}
          <path d="M 385 110 L 415 110 L 415 220 L 385 220 Z" fill="#282A32" stroke="#AA8984" strokeWidth="1" strokeOpacity="0.3" />
          <rect x="360" y="220" width="80" height="40" rx="8" fill="#33343D" stroke="#AA8984" strokeWidth="1" strokeOpacity="0.4" />
          <text x="400" y="245" textAnchor="middle" fill="#E1E1ED" fontFamily="Space Grotesk" fontSize="11" fontWeight="600" letterSpacing="1">
            STAGE B
          </text>

          {/* ZONE 1: DIAMOND LOUNGE VIP */}
          <g
            className="cursor-pointer transition-all duration-200 group"
            onClick={() => onSelectTier('diamond')}
            onMouseEnter={() => setHoverLabel('Diamond Lounge VIP • 4.500.000₫')}
            onMouseLeave={() => setHoverLabel('Nhấp vào khu vực để chọn')}
          >
            {/* Pit Left */}
            <path
              d="M 270 125 L 375 125 L 375 220 L 320 220 L 250 160 Z"
              fill="#571BC1"
              fillOpacity={selectedTierKey === 'diamond' ? 0.9 : 0.65}
              stroke="#D0BCFF"
              strokeWidth={selectedTierKey === 'diamond' ? 3.5 : 2}
              className="group-hover:fill-opacity-90 transition-all"
            />
            {/* Pit Right */}
            <path
              d="M 425 125 L 530 125 L 550 160 L 480 220 L 425 220 Z"
              fill="#571BC1"
              fillOpacity={selectedTierKey === 'diamond' ? 0.9 : 0.65}
              stroke="#D0BCFF"
              strokeWidth={selectedTierKey === 'diamond' ? 3.5 : 2}
              className="group-hover:fill-opacity-90 transition-all"
            />
            <text x="320" y="170" textAnchor="middle" fill="#FFFFFF" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700">
              DIAMOND VIP
            </text>
            <text x="320" y="185" textAnchor="middle" fill="#D0BCFF" fontFamily="Plus Jakarta Sans" fontSize="9" fontWeight="600">
              4.500.000đ
            </text>
            <text x="480" y="170" textAnchor="middle" fill="#FFFFFF" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700">
              DIAMOND VIP
            </text>
            <text x="480" y="185" textAnchor="middle" fill="#D0BCFF" fontFamily="Plus Jakarta Sans" fontSize="9" fontWeight="600">
              4.500.000đ
            </text>
            <circle cx="320" cy="140" r="5" fill="#FF5945" className="animate-ping" />
            <circle cx="320" cy="140" r="3" fill="#FFFFFF" />
          </g>

          {/* ZONE 2: VIP ZONE A & B */}
          <g
            className="cursor-pointer transition-all duration-200 group"
            onClick={() => onSelectTier('vipa')}
            onMouseEnter={() => setHoverLabel('VIP Zone A & B • 2.800.000₫')}
            onMouseLeave={() => setHoverLabel('Nhấp vào khu vực để chọn')}
          >
            <polygon
              points="170,140 240,140 240,260 170,240"
              fill="#FF5945"
              fillOpacity={selectedTierKey === 'vipa' ? 0.65 : 0.25}
              stroke="#FF5945"
              strokeWidth={selectedTierKey === 'vipa' ? 3 : 1.5}
              className="group-hover:fill-opacity-50 transition-all"
            />
            <text x="205" y="200" textAnchor="middle" fill="#FFB4A8" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700">
              VIP ZONE A
            </text>
            <polygon
              points="560,140 630,140 630,240 560,260"
              fill="#FF5945"
              fillOpacity={selectedTierKey === 'vipa' ? 0.65 : 0.25}
              stroke="#FF5945"
              strokeWidth={selectedTierKey === 'vipa' ? 3 : 1.5}
              className="group-hover:fill-opacity-50 transition-all"
            />
            <text x="595" y="200" textAnchor="middle" fill="#FFB4A8" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="700">
              VIP ZONE B
            </text>
          </g>

          {/* ZONE 3: GA STANDING ZONE */}
          <g
            className="cursor-pointer transition-all duration-200 group"
            onClick={() => onSelectTier('ga')}
            onMouseEnter={() => setHoverLabel('GA Standing Zone • 1.200.000₫')}
            onMouseLeave={() => setHoverLabel('Nhấp vào khu vực để chọn')}
          >
            <path
              d="M 260 270 L 540 270 L 520 370 L 280 370 Z"
              fill="#00A0BB"
              fillOpacity={selectedTierKey === 'ga' ? 0.6 : 0.25}
              stroke="#4CD7F6"
              strokeWidth={selectedTierKey === 'ga' ? 3 : 1.5}
              className="group-hover:fill-opacity-50 transition-all"
            />
            <text x="400" y="315" textAnchor="middle" fill="#ACEDFF" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700" letterSpacing="1">
              GA STANDING ZONE
            </text>
            <text x="400" y="335" textAnchor="middle" fill="#E1E1ED" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="500">
              1.200.000đ • Fanzone Sôi Động
            </text>
          </g>

          {/* TRIBUNE C1 & C2 */}
          <g
            className="cursor-pointer transition-all duration-200 group"
            onClick={() => onSelectTier('tribune')}
            onMouseEnter={() => setHoverLabel('Khán đài C1 & C2')}
            onMouseLeave={() => setHoverLabel('Nhấp vào khu vực để chọn')}
          >
            <path
              d="M 80,180 L 150,180 L 150,380 L 80,410 Z"
              fill="#F59E0B"
              fillOpacity={selectedTierKey === 'tribune' ? 0.45 : 0.18}
              stroke="#F59E0B"
              strokeDasharray="4 2"
              strokeWidth="1.5"
              className="group-hover:fill-opacity-35 transition-all"
            />
            <text x="115" y="295" textAnchor="middle" fill="#F59E0B" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" transform="rotate(-90 115 295)">
              KHÁN ĐÀI C1
            </text>
            <path
              d="M 650,180 L 720,180 L 720,410 L 650,380 Z"
              fill="#F59E0B"
              fillOpacity={selectedTierKey === 'tribune' ? 0.45 : 0.18}
              stroke="#F59E0B"
              strokeDasharray="4 2"
              strokeWidth="1.5"
              className="group-hover:fill-opacity-35 transition-all"
            />
            <text x="685" y="295" textAnchor="middle" fill="#F59E0B" fontFamily="Plus Jakarta Sans" fontSize="11" fontWeight="600" transform="rotate(90 685 295)">
              KHÁN ĐÀI C2
            </text>
          </g>

          {/* TRIBUNE UPPER CAT 3 (SOLD OUT) */}
          <g className="cursor-not-allowed opacity-40">
            <path d="M 170 400 L 630 400 L 610 490 L 190 490 Z" fill="#33343D" stroke="#AA8984" strokeWidth="1" />
            <text x="400" y="440" textAnchor="middle" fill="#AA8984" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700">
              TRIBUNE UPPER D1 (HẾT VÉ)
            </text>
            <text x="400" y="460" textAnchor="middle" fill="#FFB4AB" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="500">
              SOLD OUT
            </text>
          </g>

          {/* FOH Booth */}
          <rect x="365" y="380" width="70" height="15" rx="3" fill="#11131B" stroke="#33343D" strokeWidth="1" />
          <text x="400" y="391" textAnchor="middle" fill="#AA8984" fontFamily="Space Grotesk" fontSize="8" fontWeight="600">
            FOH TECH
          </text>
        </svg>

        {/* Bottom Perforation Indicator */}
        <div className="absolute bottom-3 left-4 text-xs text-[#aa8984] flex items-center gap-1.5 font-mono">
          <span className="material-symbols-outlined text-[15px]">sports_score</span>
          <span>SVĐ Quân Khu 7 • Sức chứa 25.000 khán giả</span>
        </div>
      </div>

      {/* Color Legend Bar */}
      <div className="p-4 bg-[#191b23] flex flex-wrap items-center justify-between gap-3 border-t border-[#33343d]/30">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => onSelectTier('diamond')}
            className={`flex items-center gap-1.5 transition-all p-1 rounded-md ${
              selectedTierKey === 'diamond' ? 'bg-[#571bc1]/30 ring-1 ring-[#d0bcff]' : ''
            }`}
          >
            <span className="w-3 h-3 rounded-sm bg-[#571bc1] ring-1 ring-[#d0bcff]" />
            <span className="font-semibold text-white">Diamond VIP</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTier('vipa')}
            className={`flex items-center gap-1.5 transition-all p-1 rounded-md ${
              selectedTierKey === 'vipa' ? 'bg-[#ff5945]/30 ring-1 ring-[#ff5945]' : ''
            }`}
          >
            <span className="w-3 h-3 rounded-sm bg-[#ff5945]" />
            <span className="font-semibold text-white">VIP Zone A/B</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTier('ga')}
            className={`flex items-center gap-1.5 transition-all p-1 rounded-md ${
              selectedTierKey === 'ga' ? 'bg-[#00a0bb]/30 ring-1 ring-[#4cd7f6]' : ''
            }`}
          >
            <span className="w-3 h-3 rounded-sm bg-[#00a0bb] ring-1 ring-[#4cd7f6]" />
            <span className="font-semibold text-white">GA Standing</span>
          </button>
          <div className="flex items-center gap-1.5 opacity-50 cursor-not-allowed">
            <span className="w-3 h-3 rounded-sm bg-[#33343d]" />
            <span className="text-[#aa8984]">Upper CAT (Hết vé)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#4cd7f6] text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>Bảo chứng vị trí Escrow</span>
        </div>
      </div>
    </div>
  );
};
