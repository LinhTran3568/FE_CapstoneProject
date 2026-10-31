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
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react-native';
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
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('RESET_PASS');
      Alert.alert(
        'Đã gửi mã OTP!',
        `Mã xác nhận khôi phục mật khẩu đã được gửi đến email ${email.trim()}.`
      );
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi mã khôi phục. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
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
        'Đổi Mật Khẩu Thành Công!',
        'Mật khẩu của bạn đã được cập nhật thành công. Hãy đăng nhập bằng mật khẩu mới.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      setError(err?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.');
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={theme.colors.textSecondary} />
            <Text style={styles.backRowText}>Quay lại Đăng nhập</Text>
          </TouchableOpacity>

          {/* Logo */}
          <FintechShieldLogo size={46} showSubtitle={false} />

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Khôi Phục Mật Khẩu</Text>
            <Text style={styles.cardSubtitle}>
              {step === 'REQUEST_OTP'
                ? 'Nhập email liên kết với tài khoản để nhận mã OTP xác thực'
                : `Nhập mã OTP đã gửi đến ${email} và mật khẩu mới`}
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            {step === 'REQUEST_OTP' ? (
              <>
                <FintechInput
                  label="Email tài khoản"
                  placeholder="nhap.email@vidu.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  icon={<Mail size={18} color={theme.colors.textSecondary} />}
                />

                <FintechButton
                  title="Gửi Mã Xác Nhận OTP"
                  onPress={handleRequestOtp}
                  loading={loading}
                  variant="primary"
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                <FintechInput
                  label="Mã xác thực OTP"
                  placeholder="Nhập mã 6 chữ số"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  icon={<KeyRound size={18} color={theme.colors.textSecondary} />}
                />

                <FintechInput
                  label="Mật khẩu mới (Tối thiểu 8 ký tự)"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  isPassword
                  icon={<Lock size={18} color={theme.colors.textSecondary} />}
                />

                <FintechInput
                  label="Xác nhận mật khẩu mới"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  icon={<Lock size={18} color={theme.colors.textSecondary} />}
                />

                <FintechButton
                  title="Cập Nhật Mật Khẩu"
                  onPress={handleResetPassword}
                  loading={loading}
                  variant="primary"
                  icon={<CheckCircle2 size={18} color="#0b0f19" />}
                  style={styles.submitBtn}
                />
              </>
            )}

            {/* Link back */}
            <View style={styles.footerLinkRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLinkHighlight}>Trở lại màn hình Đăng nhập</Text>
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
    paddingBottom: theme.spacing['4xl'],
    alignItems: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginVertical: theme.spacing.sm,
  },
  backRowText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
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
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
  },
  footerLinkHighlight: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});

