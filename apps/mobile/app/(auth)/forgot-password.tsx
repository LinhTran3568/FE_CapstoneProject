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
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { authApi } from '@ticketshield/api-client';
import { FintechShieldLogo } from '../../src/components/FintechShieldLogo';
import { FintechInput } from '../../src/components/FintechInput';
import { FintechButton } from '../../src/components/FintechButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<'REQUEST_OTP' | 'RESET_PASS'>('REQUEST_OTP');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('RESET_PASS');
      Alert.alert(
        'Code Sent',
        `Password recovery instructions have been sent to ${email.trim()}.`
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to send recovery code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. You can now sign in with your new password.',
        [
          {
            text: 'Sign In Now',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
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
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardSubtitle}>
              {step === 'REQUEST_OTP'
                ? "Enter your email address and we'll send you a recovery code"
                : `Enter the code sent to ${email}`}
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            {step === 'REQUEST_OTP' ? (
              <>
                <FintechInput
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  icon={<Mail size={18} color={theme.colors.textSecondary} />}
                />

                <FintechButton
                  title="Send Recovery Code"
                  onPress={handleRequestOtp}
                  loading={loading}
                  icon={<Mail size={18} color={theme.colors.onPrimary} />}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                <FintechInput
                  label="Verification Code (OTP)"
                  placeholder="6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  icon={<KeyRound size={18} color={theme.colors.textSecondary} />}
                />

                <FintechInput
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  isPassword
                  icon={<Lock size={18} color={theme.colors.textSecondary} />}
                />

                <FintechInput
                  label="Confirm New Password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  icon={<Lock size={18} color={theme.colors.textSecondary} />}
                />

                <FintechButton
                  title="Confirm & Reset"
                  onPress={handleResetPassword}
                  loading={loading}
                  icon={<CheckCircle2 size={18} color={theme.colors.onPrimary} />}
                  style={styles.submitBtn}
                />

                <TouchableOpacity
                  style={styles.retryRow}
                  onPress={() => setStep('REQUEST_OTP')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryText}>Resend code / Change email</Text>
                </TouchableOpacity>
              </>
            )}
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
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
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
    marginBottom: theme.spacing.lg,
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
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  retryRow: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
});
