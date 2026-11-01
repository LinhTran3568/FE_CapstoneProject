import React from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  ShieldAlert,
  Clock3,
  CircleDashed,
  LogOut,
  Lock,
  Mail,
  Phone,
  Ticket,
  ReceiptText,
  Building2,
  ScanLine,
  ChevronRight,
  CreditCard,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';
import { initialsOf } from '../../src/utils/format';
import { styles } from '../../src/styles/profile.styles';

const ROLE_LABELS: Record<string, string> = {
  BUYER: 'Buyer',
  RESELLER: 'Seller',
  ORGANIZER: 'Organizer',
  ADMIN: 'Administrator',
};

const KYC_STATES = {
  VERIFIED: {
    label: 'ID Verified',
    color: theme.colors.success,
    background: theme.colors.successLight,
    Icon: ShieldCheck,
  },
  PENDING: {
    label: 'Pending Review',
    color: theme.colors.warning,
    background: theme.colors.warningLight,
    Icon: Clock3,
  },
  REJECTED: {
    label: 'Verification Failed',
    color: theme.colors.danger,
    background: theme.colors.dangerLight,
    Icon: ShieldAlert,
  },
  NOT_STARTED: {
    label: 'Unverified',
    color: theme.colors.textSecondary,
    background: theme.colors.surfaceHighlight,
    Icon: CircleDashed,
  },
} as const;

export default function MobileProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const kyc = KYC_STATES[user?.kycStatus ?? 'NOT_STARTED'];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of TicketShield on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(user?.fullName)}</Text>
        </View>

        <Text style={styles.userName}>{user?.fullName || 'TicketShield Member'}</Text>
        <Text style={styles.userEmail}>{user?.email || '—'}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {ROLE_LABELS[user?.role ?? 'BUYER'] ?? user?.role}
            </Text>
          </View>

          <View style={[styles.kycBadge, { backgroundColor: kyc.background }]}>
            <kyc.Icon size={13} color={kyc.color} />
            <Text style={[styles.kycBadgeText, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
        </View>
      </View>

      {/* Primary Actions (Matching Web: Tickets, Orders) */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push('/(tabs)/tickets')}
          activeOpacity={0.85}
        >
          <View style={styles.quickIcon}>
            <Ticket size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.quickTitle}>My Tickets</Text>
          <Text style={styles.quickSubtitle}>Active digital passes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push('/(tabs)/orders')}
          activeOpacity={0.85}
        >
          <View style={[styles.quickIcon, styles.quickIconNeutral]}>
            <ReceiptText size={20} color={theme.colors.text} />
          </View>
          <Text style={styles.quickTitle}>Orders</Text>
          <Text style={styles.quickSubtitle}>Escrow transaction logs</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Group matching Web Menu */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Activity & Services</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/verify')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconSlot, { backgroundColor: theme.colors.successLight }]}>
            <ScanLine size={18} color={theme.colors.success} />
          </View>
          <View style={styles.menuTextSlot}>
            <Text style={styles.menuTitle}>Sell Ticket</Text>
            <Text style={styles.menuDesc}>Verify ticket code & list for resale</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/origin')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconSlot, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
            <Building2 size={18} color="#38BDF8" />
          </View>
          <View style={styles.menuTextSlot}>
            <Text style={styles.menuTitle}>Origin Store</Text>
            <Text style={styles.menuDesc}>Official organizer box office</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuRow, styles.noBorderBottom]}
          onPress={() => router.push('/payout-accounts')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconSlot, { backgroundColor: theme.colors.primaryLight }]}>
            <CreditCard size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.menuTextSlot}>
            <Text style={styles.menuTitle}>Payout Accounts</Text>
            <Text style={styles.menuDesc}>Bank accounts for resale disbursements</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Account Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailIconSlot}>
            <Mail size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.detailTextSlot}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user?.email || '—'}</Text>
          </View>
        </View>

        <View style={[styles.detailRow, styles.noBorderBottom]}>
          <View style={styles.detailIconSlot}>
            <Phone size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.detailTextSlot}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{user?.phoneNumber || 'Not provided'}</Text>
          </View>
        </View>
      </View>

      {/* Device Security */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Device Security</Text>

        <View style={[styles.securityItem, !__DEV__ && styles.noBorderBottom]}>
          <Lock size={16} color={theme.colors.success} />
          <View style={styles.securityTextGroup}>
            <Text style={styles.securityTitle}>Encrypted Session Storage</Text>
            <Text style={styles.securityDesc}>
              Authentication tokens are securely stored in hardware Keystore/Keychain via SecureStore.
            </Text>
          </View>
        </View>

        {__DEV__ && (
          <View style={[styles.securityItem, styles.noBorderBottom]}>
            <View style={styles.securityTextGroup}>
              <Text style={styles.securityTitle}>LAN Gateway (Dev)</Text>
              <View style={styles.gatewayWrapper}>
                <GatewayStatusBadge />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={theme.colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
