import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, ShieldCheck, Zap, User, ArrowRight } from 'lucide-react-native';
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
  const [activeDemo, setActiveDemo] = useState<'buyer' | 'reseller' | 'organizer' | null>(null);

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
    // Navigation coordinator handles routing to /(tabs) automatically
  };

  const handleQuickFill = (type: 'buyer' | 'reseller' | 'organizer', demoEmail: string, demoPass: string) => {
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
          {/* Top Network Status Pill */}
          <View style={styles.topHeader}>
            <GatewayStatusBadge />
          </View>

          {/* 3D Ticket Branding */}
          <FintechShieldLogo size={70} />

          {/* Glassmorphic Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Đăng Nhập Tài Khoản</Text>
              <Text style={styles.cardSubtitle}>
                Bảo mật đa tầng với hạ tầng Escrow & Keystore
              </Text>
            </View>

            {/* Error Notification */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            {/* Email Field */}
            <FintechInput
              label="Địa chỉ Email"
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

            {/* Password Field */}
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

            {/* Forgot Password Link */}
            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
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
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
                <Text style={styles.registerHighlight}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>

            {/* Refined Demo Account Switcher */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeader}>
                <Zap size={13} color={theme.colors.warning} />
                <Text style={styles.demoHeaderText}>Tài khoản thử nghiệm nhanh (Development)</Text>
              </View>
              <View style={styles.demoSegment}>
                <TouchableOpacity
                  style={[styles.demoTab, activeDemo === 'buyer' && styles.demoTabActive]}
                  onPress={() => handleQuickFill('buyer', 'buyer@ticketshield.vn', 'Password123!')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.demoTabText, activeDemo === 'buyer' && styles.demoTabTextActive]}>
                    Buyer (Mua vé)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoTab, activeDemo === 'reseller' && styles.demoTabActive]}
                  onPress={() => handleQuickFill('reseller', 'reseller@ticketshield.vn', 'Password123!')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.demoTabText, activeDemo === 'reseller' && styles.demoTabTextActive]}>
                    Seller (Bán lại)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoTab, activeDemo === 'organizer' && styles.demoTabActive]}
                  onPress={() => handleQuickFill('organizer', 'organizer@ticketshield.vn', 'Password123!')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.demoTabText, activeDemo === 'organizer' && styles.demoTabTextActive]}>
                    Organizer (BTC)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Security Trust Footer */}
          <View style={styles.securityFooter}>
            <ShieldCheck size={14} color={theme.colors.success} />
            <Text style={styles.securityFooterText}>
              Bảo mật bởi mã hóa phần cứng SecureStore & Escrow Smart Lock
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
    paddingBottom: theme.spacing['4xl'],
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: 'rgba(22, 30, 46, 0.95)',
    borderWidth: 1,
    borderColor: '#24324a',
    borderRadius: theme.radii['2xl'],
    padding: theme.spacing.xl,
    width: '100%',
    ...theme.shadows.md,
  },
  cardHeader: {
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: theme.typography.weights.extrabold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
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
    fontSize: 13,
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
    borderTopColor: 'rgba(38, 51, 77, 0.6)',
    paddingTop: theme.spacing.md,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  demoHeaderText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textMuted,
  },
  demoSegment: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 2,
  },
  demoTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
  },
  demoTabActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  demoTabText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  demoTabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xl,
    opacity: 0.85,
  },
  securityFooterText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
