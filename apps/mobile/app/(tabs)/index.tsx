import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Store,
  ScanLine,
  Ticket,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';
import { initialsOf } from '../../src/utils/format';
import { styles } from '../../src/styles/home.styles';

export default function MobileHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'TicketShield Member'}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Open Profile"
        >
          <Text style={styles.avatarText}>{initialsOf(user?.fullName)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gatewaySlot}>
        <GatewayStatusBadge />
      </View>

      <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push('/(tabs)/marketplace')}
              activeOpacity={0.85}
            >
              <View style={styles.gridIcon}>
                <Store size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridTitle}>Marketplace</Text>
              <Text style={styles.gridSubtitle}>Fan-to-fan resale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push('/verify')}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIcon, styles.gridIconSell]}>
                <ScanLine size={22} color={theme.colors.success} />
              </View>
              <Text style={styles.gridTitle}>Sell Ticket</Text>
              <Text style={styles.gridSubtitle}>Verify & list ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push('/(tabs)/tickets')}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIcon, styles.gridIconNeutral]}>
                <Ticket size={22} color={theme.colors.text} />
              </View>
              <Text style={styles.gridTitle}>My Tickets</Text>
              <Text style={styles.gridSubtitle}>Live digital passes</Text>
            </TouchableOpacity>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
}
