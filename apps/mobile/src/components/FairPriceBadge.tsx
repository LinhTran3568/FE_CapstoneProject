import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Text } from './AppText';
import { Scale, Tag, ShieldCheck } from 'lucide-react-native';
import { theme } from '../theme';
import { styles } from './FairPriceBadge.styles';

interface FairPriceBadgeProps {
  resalePrice: number;
  originalPrice: number;
  discountPercentage?: number;
  style?: StyleProp<ViewStyle>;
}

export function FairPriceBadge({
  resalePrice,
  originalPrice,
  discountPercentage,
  style,
}: FairPriceBadgeProps) {
  // Anti-scalping calculation
  const hasDiscount = originalPrice > resalePrice;
  const calculatedDiscount = hasDiscount
    ? Math.round(((originalPrice - resalePrice) / originalPrice) * 100)
    : 0;
  const effectiveDiscount = discountPercentage && discountPercentage > 0
    ? Math.round(discountPercentage)
    : calculatedDiscount;

  const isExactFaceValue = originalPrice > 0 && resalePrice === originalPrice;
  const isCapped = originalPrice > 0 && resalePrice > originalPrice;

  let label = 'FAIR PRICE';
  let isCapStyle = false;

  if (hasDiscount && effectiveDiscount > 0) {
    label = `FAIR PRICE • -${effectiveDiscount}%`;
  } else if (isExactFaceValue) {
    label = 'FAIR PRICE • 100% FACE VALUE';
  } else if (isCapped) {
    label = 'FAIR RESALE CAP';
    isCapStyle = true;
  }

  const iconColor = isCapStyle ? theme.colors.primary : theme.colors.success;

  return (
    <View
      style={[styles.badge, isCapStyle && styles.badgeCap, style]}
      accessibilityRole="text"
      accessibilityLabel={`Anti-scalping badge: ${label}`}
    >
      {hasDiscount ? (
        <Tag size={10} color={iconColor} />
      ) : (
        <Scale size={10} color={iconColor} />
      )}
      <Text style={[styles.badgeText, isCapStyle && styles.badgeTextCap]}>
        {label}
      </Text>
    </View>
  );
}

