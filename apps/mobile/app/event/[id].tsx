import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Check,
  Store,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { marketplaceService } from '../../src/services/marketplaceService';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice } from '../../src/utils/format';

const EVENT_START_AT = '2026-09-19T19:30:00+07:00';

const EVENT_DATA = {
  title: 'Anh Trai Say Hi Live Concert 2026',
  tourName: 'The Grand Arena World Tour',
  organizerName: 'VieON & Vie Channel',
  dateDisplay: 'Saturday, Sep 19, 2026 • 19:30',
  venueName: 'Military Zone 7 Stadium',
  venueAddress: '202 Hoang Van Thu, Phu Nhuan, HCMC',
  description:
    'Experience the premier stadium concert with state-of-the-art international d&b audiotechnik acoustics and multidimensional laser visuals. Official tickets issued and verified through TicketShield with guaranteed escrow protection.',
  tiers: [
    {
      id: 'tier-vip-a',
      name: 'VIP A — Stage Front',
      price: 2500000,
      seatZone: 'Zone A1 • Gate 1',
      available: 18,
      perks: ['Stage-front dedicated seats', 'Exclusive VIP merchandise kit', 'Dedicated entrance gate'],
    },
    {
      id: 'tier-ga',
      name: 'GA Standing — Zone B',
      price: 1200000,
      seatZone: 'Zone B2 • Gate 3',
      available: 64,
      perks: ['High-energy standing zone', 'Light-up festival wristband'],
    },
    {
      id: 'tier-tribune',
      name: 'Tribune — Grandstand C',
      price: 800000,
      seatZone: 'Tier 2 Grandstand',
      available: 120,
      perks: ['Panoramic stage view', 'Covered grandstand seating'],
    },
  ],
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [selectedTier, setSelectedTier] = useState(EVENT_DATA.tiers[0]);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const eventId = typeof id === 'string' && id ? id : 'atsh-2026';

  const handlePrimaryBuy = async () => {
    setIsBuying(true);
    try {
      const purchasedAt = new Date().toISOString();
      const orderId = `primary-${Date.now()}`;

      for (let index = 0; index < quantity; index += 1) {
        const ticketPassCode = `TS-ORG-${selectedTier.id.toUpperCase().slice(-5)}-${Math.floor(
          100000 + Math.random() * 900000
        )}`;
        const qrData = `TS:PRIMARY:${ticketPassCode}:${Date.now()}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          qrData
        )}`;

        await marketplaceService.saveLocalTicket({
          escrowId: `${orderId}-${index + 1}`,
          listingId: `primary-${eventId}`,
          eventId,
          eventName: EVENT_DATA.title,
          eventVenue: `${EVENT_DATA.venueName}, ${EVENT_DATA.venueAddress}`,
          eventStartAt: EVENT_START_AT,
          tierName: selectedTier.name,
          seatZone:
            quantity > 1 ? `${selectedTier.seatZone} • Ticket ${index + 1}/${quantity}` : selectedTier.seatZone,
          ticketPassCode,
          totalAmountPaid: selectedTier.price,
          status: 'VALID',
          recipientName: user?.fullName || 'Ticket Buyer',
          recipientEmail: user?.email || 'buyer@ticketshield.vn',
          qrCodeData: qrData,
          qrCodeImageUrl: qrImageUrl,
          purchasedAt,
        });
      }

      Alert.alert(
        'Purchase Successful',
        `You have purchased ${quantity}x ${selectedTier.name} tickets. Your digital passes are now in your Ticket Wallet.`,
        [
          {
            text: 'View in Wallet',
            onPress: () => router.push('/(tabs)/tickets'),
          },
        ]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to complete purchase.';
      Alert.alert('Purchase Error', message);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Event Details',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <EventPoster seed={eventId} height={200} />
          <View style={styles.heroBody}>
            <View style={styles.officialBadge}>
              <ShieldCheck size={13} color={theme.colors.success} />
              <Text style={styles.officialBadgeText}>Official Organizer Tickets</Text>
            </View>
            <Text style={styles.tourName}>{EVENT_DATA.tourName}</Text>
            <Text style={styles.eventTitle}>{EVENT_DATA.title}</Text>
            <Text style={styles.organizerName}>Organized by {EVENT_DATA.organizerName}</Text>

            <View style={styles.metaRow}>
              <Calendar size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>{EVENT_DATA.dateDisplay}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>
                {EVENT_DATA.venueName} • {EVENT_DATA.venueAddress}
              </Text>
            </View>
            <Text style={styles.description}>{EVENT_DATA.description}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.resaleShortcut}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.85}
        >
          <View style={styles.resaleShortcutIcon}>
            <Store size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.resaleShortcutText}>
            <Text style={styles.resaleShortcutTitle}>Check Secondary Resale Deals</Text>
            <Text style={styles.resaleShortcutSubtitle}>
              Verified fan-to-fan resale tickets backed by escrow
            </Text>
          </View>
          <ArrowRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Select Ticket Tier</Text>
        <View style={styles.tiersContainer}>
          {EVENT_DATA.tiers.map((tier) => {
            const isSelected = selectedTier.id === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                onPress={() => setSelectedTier(tier)}
                activeOpacity={0.85}
              >
                <View style={styles.tierTop}>
                  <View style={styles.tierNameGroup}>
                    <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                      {tier.name}
                    </Text>
                    <Text style={styles.tierZone}>{tier.seatZone}</Text>
                  </View>
                  <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
                </View>

                <View style={styles.perksContainer}>
                  {tier.perks.map((perk) => (
                    <View key={perk} style={styles.perkRow}>
                      <Check size={13} color={theme.colors.success} />
                      <Text style={styles.perkText}>{perk}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quantityCard}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={16} color={quantity <= 1 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.min(4, q + 1))}
              disabled={quantity >= 4}
            >
              <Plus size={16} color={quantity >= 4 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.checkoutPanel}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price ({quantity} ticket{quantity > 1 ? 's' : ''})</Text>
            <Text style={styles.totalValue}>{formatPrice(selectedTier.price * quantity)}</Text>
          </View>
          <FintechButton
            title="Checkout & Receive Passes"
            onPress={handlePrimaryBuy}
            loading={isBuying}
            icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
          />
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
    gap: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    marginBottom: 4,
  },
  officialBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  tourName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  eventTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.text,
    lineHeight: 30,
  },
  organizerName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  description: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  resaleShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resaleShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resaleShortcutText: {
    flex: 1,
  },
  resaleShortcutTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  resaleShortcutSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  tiersContainer: {
    gap: theme.spacing.md,
  },
  tierCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  tierCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceElevated,
  },
  tierTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  tierZone: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  tierPrice: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.text,
  },
  perksContainer: {
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
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
  quantityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quantityLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quantityValue: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  checkoutPanel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
});
