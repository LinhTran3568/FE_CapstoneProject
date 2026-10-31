import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldCheck, Zap } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { FintechShieldLogo } from '../../src/components/FintechShieldLogo';
import { FintechInput } from '../../src/components/FintechInput';
import { FintechButton } from '../../src/components/FintechButton';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Địa chỉ email không đúng định dạng';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
    // Điều hướng vào /(tabs) được tự động xử lý bởi AuthNavigationCoordinator trong _layout.tsx
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
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
          {/* Logo & Branding */}
          <FintechShieldLogo size={52} />

          {/* Dynamic API Gateway Status */}
          <View style={styles.gatewaySection}>
            <GatewayStatusBadge />
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng Nhập Tài Khoản</Text>
            <Text style={styles.cardSubtitle}>
              Xác thực an toàn với hạ tầng TicketShield AI
            </Text>

            {/* Error Notification */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            <FintechInput
              label="Email"
              placeholder="nhap.email@vidu.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoComplete="email"
              icon={<Mail size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.email}
            />

            <FintechInput
              label="Mật khẩu"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: undefined }));
              }}
              isPassword
              icon={<Lock size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.password}
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <FintechButton
              title="Đăng Nhập An Toàn"
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              icon={<ShieldCheck size={18} color="#0b0f19" />}
              style={styles.submitBtn}
            />

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerHighlight}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Demo Accounts for Grading / Testing */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <Zap size={14} color={theme.colors.warning} />
                <Text style={styles.demoHeaderText}>Tài khoản thử nghiệm nhanh (Development)</Text>
              </View>
              <View style={styles.demoRow}>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => handleQuickFill('buyer@ticketshield.vn', 'Password123!')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoPillText}>Buyer Demo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => handleQuickFill('reseller@ticketshield.vn', 'Password123!')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoPillText}>Seller Demo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => handleQuickFill('organizer@ticketshield.vn', 'Password123!')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoPillText}>Organizer Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Security Badge Footer */}
          <View style={styles.securityFooter}>
            <ShieldCheck size={14} color={theme.colors.success} />
            <Text style={styles.securityFooterText}>
              Bảo vệ bởi mã hóa phần cứng SecureStore & Escrow Smart Lock
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
    alignItems: 'center',
  },
  gatewaySection: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    width: '100%',
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorBoxText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  submitBtn: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  registerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  registerHighlight: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  demoSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.md,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  demoHeaderText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  demoPill: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xl,
    opacity: 0.8,
  },
  securityFooterText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
