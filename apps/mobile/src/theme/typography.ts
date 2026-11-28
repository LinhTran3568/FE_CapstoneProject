// TicketShield Mobile Typography Tokens
import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
  },
  // Vietnamese text needs generous leading; caps labels need tracking.
  lineHeights: {
    tight: 1.22,
    normal: 1.45,
    relaxed: 1.65,
  },
  tracking: {
    tight: -0.4,
    normal: 0,
    label: 0.6,
    caps: 1.2,
  },
  families: fontFamilies,
} as const;

export type FontWeightToken = keyof typeof typography.weights;
