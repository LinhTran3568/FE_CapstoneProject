import React, { useState } from 'react';
import {
  View,
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
import { styles } from '../../src/styles/login.styles';

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
