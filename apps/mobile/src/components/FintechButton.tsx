import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../theme';
import { Text } from './AppText';

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
      case 'secondary':
        return styles.textSecondary;
      case 'success':
        return styles.textSuccess;
      case 'danger':
        return styles.textDanger;
      default:
        return styles.textPrimary;
    }
  };

  const spinnerColor =
    variant === 'outline'
      ? theme.colors.primary
      : variant === 'secondary'
        ? theme.colors.onSecondary
        : variant === 'success'
          ? theme.colors.onSuccess
          : variant === 'danger'
            ? theme.colors.onDanger
            : theme.colors.onPrimary;

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
      accessibilityRole="button"
      accessibilityState={{ disabled: isActionDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: theme.spacing['5xl'] + 4,
    borderRadius: theme.radii.lg,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: theme.colors.onPrimary,
  },
  textSecondary: {
    color: theme.colors.onSecondary,
  },
  textSuccess: {
    color: theme.colors.onSuccess,
  },
  textDanger: {
    color: theme.colors.onDanger,
  },
  textOutline: {
    color: theme.colors.text,
  },
});
