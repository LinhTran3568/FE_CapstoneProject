// TicketShield Mobile Dark Fintech Color Palette

export const colors = {
  // Base Backgrounds
  background: '#0b0f19',
  backgroundSecondary: '#0f172a',
  surface: '#161e2e',
  surfaceElevated: '#1e293b',
  surfaceHighlight: '#24324a',
  inputBackground: '#101726',

  // Borders
  border: '#26334d',
  borderSubtle: '#1a2333',
  borderFocus: '#06b6d4',
  borderError: '#f43f5e',

  // Brand Accents
  primary: '#06b6d4',          // Cyber Cyan
  primaryHover: '#22d3ee',
  primaryMuted: '#0891b2',
  primaryGlow: 'rgba(6, 182, 212, 0.25)',
  primaryLight: 'rgba(6, 182, 212, 0.12)',

  secondary: '#3b82f6',        // Electric Blue
  secondaryLight: 'rgba(59, 130, 246, 0.12)',

  accent: '#8b5cf6',           // AI Violet
  accentLight: 'rgba(139, 92, 246, 0.12)',

  // Semantic Status Colors
  success: '#10b981',          // Shield Escrow Emerald
  successLight: 'rgba(16, 185, 129, 0.12)',
  warning: '#f59e0b',          // Escrow Pending Amber
  warningLight: 'rgba(245, 158, 11, 0.12)',
  danger: '#f43f5e',           // Alert Crimson
  dangerLight: 'rgba(244, 63, 94, 0.12)',
  info: '#38bdf8',             // Light Sky Blue

  // Typography
  text: '#f8fafc',             // High contrast Slate 50
  textSecondary: '#94a3b8',    // Slate 400
  textMuted: '#64748b',        // Slate 500
  textPlaceholder: '#475569',  // Slate 600
  textInverse: '#0b0f19',      // Dark contrast

  // Transparent & Overlays
  overlay: 'rgba(11, 15, 25, 0.8)',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  transparent: 'transparent',
  white: '#ffffff',
} as const;

export type ColorName = keyof typeof colors;

