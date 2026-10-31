import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Shield,
  ShieldCheck,
  Server,
  LogOut,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  KeyRound,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';

export default function MobileProfileScreen() {
  const router = useRouter();
  const { user, logout, gatewayInfo } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi TicketShield và xóa phiên bảo mật trên thiết bị này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Điều hướng về /(auth)/login được tự động xử lý bởi AuthNavigationCoordinator trong _layout.tsx
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return theme.colors.danger;
      case 'ORGANIZER':
        return theme.colors.accent;
      case 'RESELLER':
        return theme.colors.warning;
      case 'BUYER':
      default:
        return theme.colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <UserIcon size={36} color={theme.colors.primary} />
        </View>

        <Text style={styles.userName}>{user?.fullName || 'Người Dùng TicketShield'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@ticketshield.vn'}</Text>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.roleBadge,
              { borderColor: getRoleBadgeColor(user?.role) },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                { color: getRoleBadgeColor(user?.role) },
              ]}
            >
              {user?.role || 'BUYER'}
            </Text>
          </View>

          <View style={styles.kycBadge}>
            <CheckCircle2 size={12} color={theme.colors.success} />
            <Text style={styles.kycBadgeText}>Đã Xác Minh KYC</Text>
          </View>
        </View>
      </View>

      {/* Account Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Thông Tin Tài Khoản</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailIconSlot}>
            <Mail size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.detailTextSlot}>
            <Text style={styles.detailLabel}>Email liên kết</Text>
            <Text style={styles.detailValue}>{user?.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconSlot}>
            <Phone size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.detailTextSlot}>
            <Text style={styles.detailLabel}>Số điện thoại</Text>
            <Text style={styles.detailValue}>{user?.phoneNumber || 'Chưa cập nhật'}</Text>
          </View>
        </View>

        <View style={[styles.detailRow, styles.noBorderBottom]}>
          <View style={styles.detailIconSlot}>
            <KeyRound size={16} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.detailTextSlot}>
            <Text style={styles.detailLabel}>Mã định danh User ID</Text>
            <Text style={styles.detailValueMono} numberOfLines={1}>
              {user?.id || '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Dynamic Gateway & Security Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Hạ Tầng Mạng & Bảo Mật (US-9.1)</Text>

        <View style={styles.gatewayWrapper}>
          <GatewayStatusBadge />
        </View>

        <View style={styles.securityItem}>
          <Lock size={16} color={theme.colors.success} />
          <View style={styles.securityTextGroup}>
            <Text style={styles.securityTitle}>Lưu trữ phiên an toàn (SecureStore)</Text>
            <Text style={styles.securityDesc}>
              Access Token & Refresh Token được mã hóa trong phần cứng Keystore/Keychain.
            </Text>
          </View>
        </View>

        <View style={[styles.securityItem, styles.noBorderBottom]}>
          <Server size={16} color={theme.colors.primary} />
          <View style={styles.securityTextGroup}>
            <Text style={styles.securityTitle}>Cổng API Gateway Động</Text>
            <Text style={styles.securityDesc}>
              {gatewayInfo?.url || 'http://localhost:5000/api/v1'}
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={theme.colors.danger} />
        <Text style={styles.logoutBtnText}>Đăng Xuất Khỏi Thiết Bị</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>
        TicketShield Mobile v1.0.0 • Dark Fintech Edition
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 2,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.glow,
  },
  userName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.success,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  kycBadgeText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.success,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  detailIconSlot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  detailTextSlot: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  detailValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginTop: 2,
  },
  detailValueMono: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  noBorderBottom: {
    borderBottomWidth: 0,
  },
  gatewayWrapper: {
    marginBottom: theme.spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  securityTextGroup: {
    flex: 1,
  },
  securityTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  securityDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1.2,
    borderColor: theme.colors.danger,
    borderRadius: theme.radii.md,
    height: 48,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
