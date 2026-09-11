import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TicketShieldLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      {/* Standalone 3D Glowing Ticket Pass SVG Icon (NO Black Container Box) */}
      <div className={`${sizeClasses[size]} shrink-0 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-[0_0_12px_rgba(255,90,54,0.5)]`}>
        <svg viewBox="0 0 512 512" className="w-full h-full">
          <defs>
            <linearGradient id="navTicketGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6B4A" />
              <stop offset="50%" stopColor="#FF5A36" />
              <stop offset="100%" stopColor="#E03E15" />
            </linearGradient>

            <linearGradient id="navGlassHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="navShieldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>

          {/* Standalone Tilted Ticket Pass */}
          <g transform="rotate(-8 256 256)">
            {/* Ticket Body Path with Cutout Notch */}
            <path d="M 64 160 
                     A 24 24 0 0 1 88 136 
                     L 424 136 
                     A 24 24 0 0 1 448 160 
                     L 448 212 
                     A 36 36 0 0 0 448 284 
                     L 448 352 
                     A 24 24 0 0 1 424 376 
                     L 88 376 
                     A 24 24 0 0 1 64 352 
                     Z" 
                  fill="url(#navTicketGlow)" 
                  stroke="#FFA58C" 
                  strokeWidth="4" />

            {/* Glass Top Highlight */}
            <path d="M 64 160 
                     A 24 24 0 0 1 88 136 
                     L 424 136 
                     A 24 24 0 0 1 448 160 
                     L 448 230 
                     L 64 230 
                     Z" 
                  fill="url(#navGlassHighlight)" />

            {/* Dashed Stub Line */}
            <line x1="336" y1="148" x2="336" y2="364" stroke="#000000" strokeWidth="6" strokeDasharray="10,10" opacity="0.35" />
            <line x1="336" y1="148" x2="336" y2="364" stroke="#FFFFFF" strokeWidth="5" strokeDasharray="10,10" opacity="0.5" />

            {/* Metallic Shield Emblem (Left Side) */}
            <g transform="translate(112, 176)">
              <path d="M 56 0 
                       C 12 0, 0 16, 0 16 
                       V 72 
                       C 0 120, 44 148, 56 152 
                       C 68 148, 112 120, 112 72 
                       V 16 
                       C 112 16, 100 0, 56 0 Z" 
                    fill="url(#navShieldMetal)" />

              {/* Orange Checkmark Inside Shield */}
              <path d="M 32 72 L 48 88 L 80 52" 
                    fill="none" 
                    stroke="#FF5A36" 
                    strokeWidth="14" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" />
            </g>

            {/* Sparkle Star Accent */}
            <g transform="translate(376, 236)">
              <path d="M 20 0 L 24 14 L 38 18 L 24 22 L 20 36 L 16 22 L 2 18 L 16 14 Z" fill="#FFFFFF" />
            </g>
          </g>
        </svg>
      </div>

      {/* Brand Text */}
      <span className="font-display font-extrabold tracking-tight text-[#F5F5F2] text-xl sm:text-2xl group-hover:text-[#FF5A36] transition-colors">
        TicketShield
      </span>
    </div>
  );
};
