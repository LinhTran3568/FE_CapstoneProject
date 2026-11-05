import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { theme } from '../src/theme';
import { useAuthStore } from '../src/stores/authStore';
import { FintechShieldLogo } from '../src/components/FintechShieldLogo';
import { Text } from '../src/components/AppText';
import { styles } from '../src/styles/root-layout.styles';

// Keep the splash screen visible while resources & auth session load
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if running in unsupported environment
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthNavigationCoordinator() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, loadStoredAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    (loadStoredAuth || checkAuth)();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Protected Route Guard: Intercept navigation based on authentication status
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Unauthenticated user attempting to access protected screens -> redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Marketplace is the app entry point after authentication.
      router.replace('/(tabs)/marketplace');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <FintechShieldLogo size={64} showSubtitle={false} />
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
        <Text style={styles.loadingText}>Securing TicketShield session...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: theme.typography.families.bold,
            fontSize: theme.typography.sizes.lg,
          },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ticket/[id]" options={{ title: 'Digital Pass' }} />
        <Stack.Screen name="verify" options={{ title: 'Verify Ticket' }} />
        <Stack.Screen name="payout-accounts" options={{ title: 'Payout Accounts' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, isLoading]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthNavigationCoordinator />
    </QueryClientProvider>
  );
}
