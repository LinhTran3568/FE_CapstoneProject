import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../theme';
import { Text } from './AppText';
import { styles } from './FintechButton.styles';

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
