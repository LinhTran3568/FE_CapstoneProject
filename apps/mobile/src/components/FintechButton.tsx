import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../theme';

interface FintechButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const FintechButton: React.FC<FintechButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isActionDisabled = disabled || loading;

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'success':
        return styles.btnSuccess;
      case 'danger':
        return styles.btnDanger;
      case 'outline':
        return styles.btnOutline;
      case 'primary':
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      case 'primary':
        return styles.textPrimary;
      default:
        return styles.textLight;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getVariantStyle(),
        isActionDisabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isActionDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.primary : '#0b0f19'}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 50,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.glow,
  },
  btnSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  btnSuccess: {
    backgroundColor: theme.colors.success,
  },
  btnDanger: {
    backgroundColor: theme.colors.danger,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: '#0b0f19', // Dark high contrast text on cyan
  },
  textLight: {
    color: theme.colors.white,
  },
  textOutline: {
    color: theme.colors.text,
  },
});

