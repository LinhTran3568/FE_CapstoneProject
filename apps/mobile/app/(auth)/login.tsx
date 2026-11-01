import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { ResponseType } from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { FintechShieldLogo } from '../../src/components/FintechShieldLogo';
import { FintechInput } from '../../src/components/FintechInput';
import { FintechButton } from '../../src/components/FintechButton';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';
import { GoogleIcon } from '../../src/components/GoogleIcon';
import { styles } from '../../src/styles/login.styles';

WebBrowser.maybeCompleteAuthSession();

declare const process: { env: Record<string, string | undefined> };

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

// Auto-detect environment: Expo Go in development vs Standalone/Production build
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const GOOGLE_REDIRECT_URI = isExpoGo
  ? 'https://auth.expo.io/@anonymous/ticketshield-mobile'
  : AuthSession.makeRedirectUri({ scheme: 'ticketshield' });

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    responseType: ResponseType.IdToken,
    redirectUri: GOOGLE_REDIRECT_URI,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setIsGoogleLoading(true);
        googleLogin(id_token).finally(() => setIsGoogleLoading(false));
      }
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    clearError();
    setIsGoogleLoading(true);
    try {
      if (request) {
        if (isExpoGo && request.url) {
          const defaultReturnUrl = AuthSession.getDefaultReturnUrl();
          const startUrl = `https://auth.expo.io/@anonymous/ticketshield-mobile/start?authUrl=${encodeURIComponent(request.url)}&returnUrl=${encodeURIComponent(defaultReturnUrl)}`;
          const result = await WebBrowser.openAuthSessionAsync(startUrl, defaultReturnUrl);
          if (result.type === 'success' && result.url) {
            const parsed = request.parseReturnUrl(result.url);
            if (parsed.type === 'success') {
              let idToken: string | undefined = parsed.params?.id_token;
              if (!idToken && parsed.params?.code) {
                try {
                  const tokenResponse = await AuthSession.exchangeCodeAsync(
                    {
                      clientId: GOOGLE_WEB_CLIENT_ID || '',
                      code: parsed.params.code,
                      redirectUri: GOOGLE_REDIRECT_URI,
                      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
                    },
                    Google.discovery
                  );
                  idToken = tokenResponse.idToken;
                } catch {
                  // Fallback exchange failed
                }
              }
              if (idToken) {
                await googleLogin(idToken);
              }
            }
          }
        } else if (promptAsync) {
          const result = await promptAsync();
          if (result?.type === 'success' && result.params?.id_token) {
            await googleLogin(result.params.id_token);
          }
        }
      }
    } catch (err: any) {
      console.log('[GoogleSignIn] Info:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

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

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, (isGoogleLoading || isLoading) && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color={theme.colors.text} />
              ) : (
                <GoogleIcon size={19} />
              )}
              <Text style={styles.googleBtnText}>
                {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
