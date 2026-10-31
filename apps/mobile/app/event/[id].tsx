import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Tag,
  Check,
  Store,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { marketplaceService } from '../../src/services/marketplaceService';
import { useAuthStore } from '../../src/stores/authStore';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Default Event Details matching ATSH / Seeded
  const eventData = {
    id: id || 'atsh-2026',
    title: 'ANH TRAI SAY HI LIVE CONCERT 2025',
    tourName: 'THE GRAND ARENA TOUR',
    organizerName: 'VieON & Vie Channel',
    organizerBadge: 'Đơn vị phân phối chính thức',
    dateDisplay: 'Thứ Bảy, 19/04/2025 • 19:30',
    venueName: 'Sân vận động Quân Khu 7',
    venueAddress: '202 Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP.HCM',
    description:
      'Đại nhạc hội bùng nổ nhất năm quy tụ dàn anh trai với hệ thống âm thanh d&b audiotechnik chuẩn quốc tế và hiệu ứng thị giác laser đa chiều. Vé được bảo vệ chống đầu cơ bởi TicketShield AI.',
    tiers: [
      {
        id: 'tier-vip-a',
        name: 'VIP A - Sát Sân Khấu',
        price: 2500000,
        seatZone: 'Khu A1 - Cửa Gate 1',
        available: 18,
        perks: ['Ghế ngồi sát sân khấu', 'Bộ quà tặng VIP độc quyền', 'Lối vào riêng biệt'],
      },
      {
        id: 'tier-ga',
        name: 'GA STANDING - Khu B',
        price: 1200000,
        seatZone: 'Khu B2 - Cửa Gate 3',
        available: 64,
        perks: ['Khu vực đứng sôi động', 'Vòng tay check-in phát sáng'],
      },
      {
        id: 'tier-tribune',
        name: 'TRIBUNE - Khán Đài C',
        price: 800000,
        seatZone: 'Khán Đài Tầng 2',
        available: 120,
        perks: ['Tầm nhìn toàn cảnh sân khấu', 'Ghế ngồi có mái che'],
      },
    ],
  };

  const [selectedTier, setSelectedTier] = useState(eventData.tiers[0]);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handlePrimaryBuy = async () => {
    setIsBuying(true);
    try {
      const ticketPassCode = `TS-ORG-${selectedTier.id.toUpperCase().slice(-5)}-${Math.floor(
        100000 + Math.random() * 900000
      )}`;
      const qrData = `TS:PRIMARY:${ticketPassCode}:${Date.now()}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        qrData
      )}`;

      await marketplaceService.saveLocalTicket({
        escrowId: `primary-${Date.now()}`,
        listingId: `primary-${eventData.id}`,
        eventId: eventData.id,
        eventName: eventData.title,
        eventVenue: `${eventData.venueName}, ${eventData.venueAddress}`,
        eventStartAt: '2025-04-19T19:30:00Z',
        tierName: selectedTier.name,
        seatZone: selectedTier.seatZone,
        ticketPassCode,
        totalAmountPaid: selectedTier.price * quantity,
        status: 'VALID',
        recipientName: user?.fullName || 'Khách Hàng',
        recipientEmail: user?.email || 'buyer@ticketshield.vn',
        qrCodeData: qrData,
        qrCodeImageUrl: qrImageUrl,
        purchasedAt: new Date().toISOString(),
      });

      Alert.alert(
        'Đặt Mua Thành Công!',
        `Bạn đã mua thành công ${quantity} vé ${selectedTier.name}. Vé đã được chuyển an toàn vào Ví vé điện tử của bạn.`,
        [
          {
            text: 'Mở Ví Vé',
            onPress: () => router.push('/(tabs)/tickets'),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Lỗi đặt vé', e?.message || 'Không thể đặt vé lúc này.');
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Chi Tiết Sự Kiện & Mua Vé',
          headerBackTitle: 'Quay lại',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Event Header Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.officialBadge}>
              <ShieldCheck size={12} color={theme.colors.success} />
              <Text style={styles.officialBadgeText}>CHÍNH HÃNG BTC</Text>
            </View>
            <View style={styles.aiBadge}>
              <Sparkles size={12} color={theme.colors.accent} />
              <Text style={styles.aiBadgeText}>AI ANTI-BOT SHIELD</Text>
            </View>
          </View>

          <Text style={styles.tourName}>{eventData.tourName}</Text>
          <Text style={styles.eventTitle}>{eventData.title}</Text>
          <Text style={styles.organizerName}>Đơn vị tổ chức: {eventData.organizerName}</Text>

          <View style={styles.metaRow}>
            <Calendar size={14} color={theme.colors.primary} />
            <Text style={styles.metaText}>{eventData.dateDisplay}</Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={14} color={theme.colors.primary} />
            <Text style={styles.metaText}>
              {eventData.venueName} • {eventData.venueAddress}
            </Text>
          </View>
        </View>

        {/* Resale Shortcut Banner */}
        <TouchableOpacity
          style={styles.resaleShortcut}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.8}
        >
          <View style={styles.resaleShortcutLeft}>
            <Store size={18} color={theme.colors.primary} />
            <View>
              <Text style={styles.resaleShortcutTitle}>Tìm vé sang nhượng giá tốt?</Text>
              <Text style={styles.resaleShortcutSubtitle}>Xem các vé Resale được bảo vệ bởi Escrow trên Chợ vé</Text>
            </View>
          </View>
          <ArrowRight size={16} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Tier Selection */}
        <Text style={styles.sectionHeading}>Chọn Hạng Vé</Text>
        <View style={styles.tiersContainer}>
          {eventData.tiers.map((t) => {
            const isSelected = selectedTier.id === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                onPress={() => setSelectedTier(t)}
                activeOpacity={0.85}
              >
                <View style={styles.tierTop}>
                  <View style={styles.tierNameGroup}>
                    <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                      {t.name}
                    </Text>
                    <Text style={styles.seatZone}>{t.seatZone}</Text>
                  </View>
                  <Text style={styles.tierPrice}>{formatPrice(t.price)}</Text>
                </View>

                {/* Perks list */}
                <View style={styles.perksList}>
                  {t.perks.map((p, idx) => (
                    <View key={idx} style={styles.perkRow}>
                      <Check size={12} color={theme.colors.success} />
                      <Text style={styles.perkText}>{p}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.tierBottom}>
                  <Text style={styles.quotaText}>Còn lại {t.available} vé</Text>
                  {isSelected && (
                    <View style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>Đang chọn</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quantity Selector & Summary */}
        <View style={styles.checkoutBar}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Số lượng vé:</Text>
            <View style={styles.counterBox}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setQuantity((q) => Math.min(4, q + 1))}
              >
                <Plus size={14} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalPrice}>{formatPrice(selectedTier.price * quantity)}</Text>
            </View>

            <FintechButton
              title="Đặt Mua Ngay"
              onPress={handlePrimaryBuy}
              loading={isBuying}
              variant="primary"
              style={styles.buyBtn}
            />
          </View>
        </View>
      </ScrollView>
    </>
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
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  officialBadge: {
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
  officialBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.accent,
  },
  tourName: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  organizerName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  resaleShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  resaleShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  resaleShortcutTitle: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  resaleShortcutSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tiersContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  tierCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
  },
  tierCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#111b2b',
    ...theme.shadows.glow,
  },
  tierTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  tierNameGroup: {
    flex: 1,
  },
  tierName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  tierNameSelected: {
    color: theme.colors.primary,
  },
  seatZone: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  tierPrice: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  perksList: {
    gap: 4,
    marginVertical: theme.spacing.xs,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  tierBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.xs,
  },
  quotaText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  selectedPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  selectedPillText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: '#0b0f19',
  },
  checkoutBar: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
  },
  counterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  counterValue: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.md,
  },
  totalLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  totalPrice: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  buyBtn: {
    width: 140,
  },
});
