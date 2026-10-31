import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Ticket,
  Store,
  Sparkles,
  ArrowRight,
  Calendar,
  MapPin,
  CheckCircle2,
  ScanLine,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';

export default function MobileHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Thành viên TicketShield'}</Text>
        </View>
        <View style={styles.aiBadge}>
          <Sparkles size={14} color={theme.colors.accent} />
          <Text style={styles.aiBadgeText}>AI Protected</Text>
        </View>
      </View>

      {/* Gateway Status Badge */}
      <View style={styles.section}>
        <GatewayStatusBadge />
      </View>

      {/* Hero Escrow Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <ShieldCheck size={28} color={theme.colors.success} />
          <View style={styles.secureTag}>
            <Text style={styles.secureTagText}>SECURE ESCROW 100%</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Sàn Mua Bán Vé Chống Bot & Lừa Đảo</Text>
        <Text style={styles.heroDesc}>
          Tiền giữ trong tài khoản Escrow an toàn đến khi check-in thành công. Mã QR xoay vòng chống phe vé.
        </Text>
      </View>

      {/* Quick Action Cards Grid */}
      <Text style={styles.sectionHeading}>Chức Năng Chính</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: theme.colors.primaryLight }]}>
            <Store size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Chợ Vé Sang Nhượng</Text>
          <Text style={styles.actionSubtitle}>Mua vé P2P đã duyệt</Text>
          <ArrowRight size={16} color={theme.colors.primary} style={styles.actionArrow} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/tickets')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: theme.colors.secondaryLight }]}>
            <Ticket size={22} color={theme.colors.secondary} />
          </View>
          <Text style={styles.actionTitle}>Ví Vé Của Tôi</Text>
          <Text style={styles.actionSubtitle}>Mã QR xoay vòng vào cổng</Text>
          <ArrowRight size={16} color={theme.colors.secondary} style={styles.actionArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGridSecond}>
        <TouchableOpacity
          style={styles.actionCardWide}
          onPress={() => router.push('/verify')}
          activeOpacity={0.8}
        >
          <View style={styles.actionWideLeft}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <ScanLine size={22} color={theme.colors.accent} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Xác Thực Vé AI & Đăng Bán</Text>
              <Text style={styles.actionSubtitle}>Kiểm tra vé gốc & niêm yết bán lên sàn</Text>
            </View>
          </View>
          <ArrowRight size={18} color={theme.colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Featured Primary Concert Event */}
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Sự Kiện Nổi Bật Mở Bán</Text>
          <TouchableOpacity onPress={() => router.push('/event/atsh-2026')}>
            <Text style={styles.viewMoreText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.eventFeaturedCard}
          onPress={() => router.push('/event/atsh-2026')}
          activeOpacity={0.85}
        >
          <View style={styles.eventHeaderRow}>
            <View style={styles.officialTag}>
              <CheckCircle2 size={12} color={theme.colors.success} />
              <Text style={styles.officialTagText}>MỞ BÁN CHÍNH THỨC BTC</Text>
            </View>
            <Text style={styles.eventPriceFrom}>Từ 800.000 đ</Text>
          </View>

          <Text style={styles.featuredTourName}>THE GRAND ARENA WORLD TOUR</Text>
          <Text style={styles.featuredEventTitle}>ANH TRAI SAY HI LIVE CONCERT 2025</Text>

          <View style={styles.eventMetaRow}>
            <Calendar size={13} color={theme.colors.textSecondary} />
            <Text style={styles.eventMetaText}>Thứ Bảy, 19/04/2025 • 19:30</Text>
          </View>

          <View style={styles.eventMetaRow}>
            <MapPin size={13} color={theme.colors.textSecondary} />
            <Text style={styles.eventMetaText}>Sân vận động Quân Khu 7, TP.HCM</Text>
          </View>

          <View style={styles.eventCardFooter}>
            <Text style={styles.organizerName}>VieON & Vie Channel</Text>
            <View style={styles.bookNowBtn}>
              <Text style={styles.bookNowText}>Đặt Mua Ngay</Text>
              <ArrowRight size={14} color="#0b0f19" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.accent,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  secureTag: {
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  secureTagText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  heroDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionsGridSecond: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
  actionCardWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  actionWideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  actionArrow: {
    marginTop: theme.spacing.sm,
  },
  featuredSection: {
    marginTop: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  eventFeaturedCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  officialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  officialTagText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
  },
  eventPriceFrom: {
    fontSize: 12,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  featuredTourName: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  featuredEventTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  organizerName: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
  },
  bookNowText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    color: '#0b0f19',
  },
});
