// TicketShield Dark Fintech Unified Theme System
import { colors } from './colors';
import { typography } from './typography';
import { spacing, radii, shadows } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  isDark: true,
} as const;

export type Theme = typeof theme;

export const useTheme = () => theme;

export * from './colors';
export * from './typography';
export * from './spacing';

