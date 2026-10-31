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
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Địa chỉ email không đúng định dạng';
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(phoneNumber.trim())) {
      errors.phoneNumber = 'Số điện thoại Việt Nam không hợp lệ';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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
        'Đăng Ký Thành Công!',
        'Tài khoản của bạn đã được khởi tạo và phiên bảo mật đã được lưu an toàn.',
        [
          {
            text: 'Bắt đầu sử dụng',
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

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tạo Tài Khoản Mới</Text>
            <Text style={styles.cardSubtitle}>
              Tham gia mạng lưới giao dịch vé an toàn TicketShield AI
            </Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            <FintechInput
              label="Họ và Tên"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (validationErrors.fullName) setValidationErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              icon={<UserIcon size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.fullName}
            />

            <FintechInput
              label="Email"
              placeholder="nhap.email@vidu.com"
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
              label="Số điện thoại"
              placeholder="0987654321"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (validationErrors.phoneNumber) setValidationErrors((prev) => ({ ...prev, phoneNumber: '' }));
              }}
              keyboardType="phone-pad"
              icon={<Phone size={18} color={theme.colors.textSecondary} />}
              error={validationErrors.phoneNumber}
            />

            {/* Role selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Mục đích sử dụng chính:</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'BUYER' && styles.roleBtnActive]}
                  onPress={() => setRole('BUYER')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleBtnText, role === 'BUYER' && styles.roleBtnTextActive]}>
                    Người Mua Vé
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleBtn, role === 'RESELLER' && styles.roleBtnActive]}
                  onPress={() => setRole('RESELLER')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleBtnText, role === 'RESELLER' && styles.roleBtnTextActive]}>
                    Người Bán Sang Nhượng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FintechInput
              label="Mật khẩu (Tối thiểu 8 ký tự)"
              placeholder="••••••••"
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
              label="Xác nhận mật khẩu"
              placeholder="••••••••"
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
              title="Đăng Ký Tài Khoản"
              onPress={handleRegister}
              loading={isLoading}
              variant="primary"
              icon={<ShieldCheck size={18} color="#0b0f19" />}
              style={styles.submitBtn}
            />

            {/* Login Link */}
            <View style={styles.footerLinkRow}>
              <Text style={styles.footerLinkText}>Đã có tài khoản?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLinkHighlight}>Đăng nhập ngay</Text>
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
  roleContainer: {
    marginBottom: theme.spacing.lg,
  },
  roleLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
  },
  roleBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  roleBtnTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: theme.spacing.sm,
  },
  footerLinkText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  footerLinkHighlight: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});

