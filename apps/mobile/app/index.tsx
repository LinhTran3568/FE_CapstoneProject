import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

/**
 * Handles the Expo root URL (`/`) after the old Home tab was removed.
 * The tab layout's initialRouteName cannot register a root route by itself.
 */
export default function RootIndexRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return <Redirect href={isAuthenticated ? '/(tabs)/marketplace' : '/(auth)/login'} />;
}
