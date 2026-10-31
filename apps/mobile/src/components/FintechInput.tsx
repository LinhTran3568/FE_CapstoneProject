import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme, fontFamilies } from '../theme';
import { Text } from './AppText';

interface FintechInputProps extends TextInputProps {
  label: string;
  icon?: React.ReactNode;
  error?: string | null;
  isPassword?: boolean;
}

export const FintechInput: React.FC<FintechInputProps> = ({
  label,
  icon,
  error,
  isPassword = false,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {icon && <View style={styles.iconSlot}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textPlaceholder}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={theme.colors.primary}
          autoCapitalize="none"
          allowFontScaling
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={18} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.spacing['5xl'] + 4,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  iconSlot: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: theme.typography.sizes.base,
    minHeight: theme.spacing['5xl'] + 2,
    paddingVertical: theme.spacing.sm,
  },
  eyeBtn: {
    width: theme.spacing['5xl'] - 4,
    height: theme.spacing['5xl'] - 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.weights.medium,
  },
});
