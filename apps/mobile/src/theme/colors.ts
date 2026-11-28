// TicketShield Mobile — Warm Concert-First Dark Palette
// Signature orange leads; cyan/violet are retired. Green = success only,
// amber = countdown only, red = error only, blue = payment/escrow info only.

export const colors = {
  // Base Backgrounds (warm near-black, like a venue at night)
  background: '#0C0A09',
  backgroundSecondary: '#14100E',
  surface: '#1C1714',
  surfaceElevated: '#241D19',
  surfaceHighlight: '#2E2521',
  inputBackground: '#17120F',

  // Borders
  border: '#332A25',
  borderSubtle: '#241D19',
  borderFocus: '#FF6B4A',
  borderError: '#F43F5E',

  // Brand — TicketShield signature orange
  primary: '#FF6B4A',
  primaryHover: '#FF8A70',
  primaryMuted: '#D9573B',
  primaryGlow: 'rgba(255, 107, 74, 0.28)',
  primaryLight: 'rgba(255, 107, 74, 0.12)',
  primaryBorder: 'rgba(255, 107, 74, 0.4)',
  onPrimary: '#24110B',
  primarySoft: '#FFD9CD',

  // Supporting warm neutrals (quiet buttons, stage smoke)
  secondary: '#3B2F2A',
  secondaryLight: 'rgba(255, 232, 214, 0.08)',
  onSecondary: '#FDF8F5',

  // Spotlight accent (decorative only, never status)
  accent: '#FFB86B',
  accentLight: 'rgba(255, 184, 107, 0.14)',

  // Semantic — each color has one job
  success: '#34D399',          // escrow released / verified
  successLight: 'rgba(52, 211, 153, 0.12)',
  successBorder: 'rgba(52, 211, 153, 0.35)',
  successStrong: '#059669',
  onSuccess: '#03261C',
  warning: '#FBBF24',          // countdown / pending only
  warningLight: 'rgba(251, 191, 36, 0.12)',
  warningBorder: 'rgba(251, 191, 36, 0.35)',
  onWarning: '#2A1A05',
  danger: '#F43F5E',           // errors / destructive only
  dangerLight: 'rgba(244, 63, 94, 0.12)',
  dangerBorder: 'rgba(244, 63, 94, 0.35)',
  onDanger: '#2A0A0F',
  info: '#60A5FA',             // payment / escrow info only
  infoLight: 'rgba(96, 165, 250, 0.12)',
  onInfo: '#0B1B33',

  // Typography (warm whites with AA/AAA contrast on background)
  text: '#FDF8F5',
  textSecondary: '#C9B8AE',
  textMuted: '#A18D82',
  textPlaceholder: '#93837B',
  textInverse: '#1A0F0B',

  // Transparent & Overlays
  overlay: 'rgba(12, 10, 9, 0.82)',
  badgeScrim: 'rgba(12, 10, 9, 0.72)',
  lightBorder: 'rgba(255, 255, 255, 0.12)',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',
  white: '#ffffff',
} as const;

export type ColorName = keyof typeof colors;
