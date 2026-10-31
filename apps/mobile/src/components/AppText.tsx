import React from 'react';
import { StyleSheet, Text as RNText, TextProps, TextStyle } from 'react-native';
import { fontFamilies } from '../theme';

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': fontFamilies.regular,
  '200': fontFamilies.regular,
  '300': fontFamilies.regular,
  '400': fontFamilies.regular,
  normal: fontFamilies.regular,
  '500': fontFamilies.medium,
  '600': fontFamilies.semibold,
  '700': fontFamilies.bold,
  '800': fontFamilies.extrabold,
  '900': fontFamilies.extrabold,
  bold: fontFamilies.bold,
};

export function familyForWeight(weight?: TextStyle['fontWeight']): string {
  if (!weight) return fontFamilies.regular;
  return WEIGHT_TO_FAMILY[String(weight)] ?? fontFamilies.regular;
}

/**
 * Brand Text wrapper.
 *
 * React Native does not resolve fontWeight against custom font files, so this
 * maps each weight to its Be Vietnam Pro family and drops fontWeight. Styles
 * without an explicit size/weight are left untouched so nested Text keeps
 * inheriting from its parent.
 */
export const Text = React.forwardRef<RNText, TextProps>(({ style, ...props }, ref) => {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;

  const hasExplicitFamily = !!flat.fontFamily;
  const isBrandFamily = !hasExplicitFamily || String(flat.fontFamily).startsWith('BeVietnamPro');
  const shouldMap = isBrandFamily && (flat.fontSize !== undefined || flat.fontWeight !== undefined);

  if (!shouldMap) {
    return <RNText ref={ref} style={style} {...props} />;
  }

  const { fontWeight: _weight, fontStyle: _style, ...rest } = flat;
  return (
    <RNText
      ref={ref}
      style={[rest, { fontFamily: familyForWeight(_weight) }]}
      {...props}
    />
  );
});

Text.displayName = 'AppText';
