import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldCheck, Zap } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { FintechShieldLogo } from '../../src/components/FintechShieldLogo';
import { FintechInput } from '../../src/components/FintechInput';
import { FintechButton } from '../../src/components/FintechButton';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';

type DemoRole = 'buyer' | 'reseller' | 'organizer';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [activeDemo, setActiveDemo] = useState<DemoRole | null>(null);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Please enter your password';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    await login({
      email: email.trim(),
      password,
    });
  };

  const handleQuickFill = (type: DemoRole, demoEmail: string, demoPass: string) => {
    setActiveDemo(type);
    setEmail(demoEmail);
    setPassword(demoPass);
    setValidationErrors({});
    clearError();
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
          <View style={styles.gatewaySlot}>
            <GatewayStatusBadge />
          </View>

          <FintechShieldLogo size={68} subtitle="Secure Ticket Exchange & Escrow" />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <Text style={styles.cardSubtitle}>
                Access your tickets and verified escrow purchases
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            <FintechInput
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              keyboardType="email-address"
              autoComplete="email"
              icon={<Mail size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.email}
            />

            <FintechInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              isPassword
              icon={<Lock size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.password}
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <FintechButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
              style={styles.submitBtn}
            />

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.registerHighlight}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && (
              <View style={styles.demoSection}>
                <View style={styles.demoHeader}>
                  <Zap size={14} color={theme.colors.primary} />
                  <Text style={styles.demoHeaderText}>Quick Demo Accounts</Text>
                </View>
                <View style={styles.demoSegment}>
                  {(
                    [
                      {
                        key: 'buyer',
                        label: 'Buyer',
                        email: 'buyer@ticketshield.vn',
                      },
                      {
                        key: 'reseller',
                        label: 'Seller',
                        email: 'reseller@ticketshield.vn',
                      },
                      {
                        key: 'organizer',
                        label: 'Organizer',
                        email: 'organizer@ticketshield.vn',
                      },
                    ] as { key: DemoRole; label: string; email: string }[]
                  ).map((demo) => (
                    <TouchableOpacity
                      key={demo.key}
                      style={[styles.demoTab, activeDemo === demo.key && styles.demoTabActive]}
                      onPress={() => handleQuickFill(demo.key, demo.email, 'Password123!')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.demoTabText,
                          activeDemo === demo.key && styles.demoTabTextActive,
                        ]}
                      >
                        {demo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.securityFooter}>
            <ShieldCheck size={15} color={theme.colors.success} />
            <Text style={styles.securityFooterText}>
              Hardware-backed security via device SecureStore
            </Text>
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
  gatewaySlot: {
    marginBottom: theme.spacing.xs,
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
  cardHeader: {
    marginBottom: theme.spacing.lg,
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
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 2,
    marginBottom: theme.spacing.lg,
  },
  forgotText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  submitBtn: {
    marginTop: theme.spacing.xs,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  registerHighlight: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  demoSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  demoHeaderText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  demoSegment: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 3,
    borderRadius: theme.radii.lg,
  },
  demoTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTabActive: {
    backgroundColor: theme.colors.primary,
  },
  demoTabText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  demoTabTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  securityFooterText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
