import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, User as UserIcon, Phone, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { FintechShieldLogo } from '../../src/components/FintechShieldLogo';
import { FintechInput } from '../../src/components/FintechInput';
import { FintechButton } from '../../src/components/FintechButton';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'RESELLER'>('BUYER');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Please enter your phone number';
    }

    if (!password) {
      errors.password = 'Please enter a password';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;

    const success = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      confirmPassword,
      role,
      acceptTerms: true,
    });

    if (success) {
      Alert.alert(
        'Account Created',
        'Your TicketShield account is ready. Welcome to verified escrow ticketing.',
        [
          {
            text: 'Get Started',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={theme.colors.textSecondary} />
            <Text style={styles.backRowText}>Back to Sign In</Text>
          </TouchableOpacity>

          <FintechShieldLogo size={48} showSubtitle={false} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>
              Join TicketShield for verified, escrow-backed ticket exchange
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            <FintechInput
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (validationErrors.fullName) setValidationErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              icon={<UserIcon size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.fullName}
            />

            <FintechInput
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              autoComplete="email"
              icon={<Mail size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.email}
            />

            <FintechInput
              label="Phone Number"
              placeholder="0912 345 678"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (validationErrors.phoneNumber) setValidationErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.phoneNumber}
            />

            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I want to:</Text>
              <View style={styles.roleSegment}>
                <TouchableOpacity
                  style={[styles.roleOption, role === 'BUYER' && styles.roleOptionActive]}
                  onPress={() => setRole('BUYER')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleOptionText, role === 'BUYER' && styles.roleOptionTextActive]}>
                    Buy Tickets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleOption, role === 'RESELLER' && styles.roleOptionActive]}
                  onPress={() => setRole('RESELLER')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleOptionText, role === 'RESELLER' && styles.roleOptionTextActive]}>
                    Resell Tickets
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FintechInput
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: '' }));
              }}
              isPassword
              icon={<Lock size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.password}
            />

            <FintechInput
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (validationErrors.confirmPassword) setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              isPassword
              icon={<Lock size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.confirmPassword}
            />

            <FintechButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
              style={styles.submitBtn}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
                <Text style={styles.loginHighlight}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  backRowText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorBoxText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
    lineHeight: 18,
  },
  roleContainer: {
    marginBottom: theme.spacing.md,
  },
  roleLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleSegment: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 3,
    borderRadius: theme.radii.lg,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
  },
  roleOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  roleOptionText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  roleOptionTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  loginText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  loginHighlight: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});
