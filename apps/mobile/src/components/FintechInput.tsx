import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../theme';
import { Text } from './AppText';
import { styles } from './FintechInput.styles';

interface FintechInputProps extends TextInputProps {
  label?: string;
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
      {!!label && <Text style={styles.label}>{label}</Text>}
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
