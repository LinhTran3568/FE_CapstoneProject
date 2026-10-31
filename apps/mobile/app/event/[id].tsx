import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
  AlertTriangle,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { eventsApi, organizerStoreApi, TrendingEventDto, OrganizerBackendTier } from '@ticketshield/api-client';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const eventId = typeof id === 'string' && id ? id : 'atsh-2026';

  const [eventData, setEventData] = useState<TrendingEventDto | null>(null);
  const [tiers, setTiers] = useState<OrganizerBackendTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<OrganizerBackendTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEventAndTiers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch real event details from Gateway
      const trending = await eventsApi.getTrendingEvents({ limit: 10 });
      const found = trending.find((e) => (e.eventId || e.id) === eventId) || trending[0];
      setEventData(found || null);

      // 2. Fetch real ticket tiers from Organizer Box Office
      try {
        const remoteTiers = await organizerStoreApi.getEventTiers(eventId);
        if (remoteTiers && remoteTiers.length > 0) {
          setTiers(remoteTiers);
          setSelectedTier(remoteTiers[0]);
        } else {
          // Default tier derived from event pricing
          const fallbackTier: OrganizerBackendTier = {
            id: 'tier-standard',
            eventId,
            tierName: 'General Admission',
            price: found?.originalPriceFrom || found?.minResalePrice || 500000,
            totalQuantity: 100,
            availableQuantity: 50,
          };
          setTiers([fallbackTier]);
          setSelectedTier(fallbackTier);
        }
      } catch {
        // Default tier if organizer is unreachable
        const fallbackTier: OrganizerBackendTier = {
          id: 'tier-standard',
          eventId,
          tierName: 'Standard Admission',
          price: found?.originalPriceFrom || found?.minResalePrice || 500000,
          totalQuantity: 100,
          availableQuantity: 50,
        };
        setTiers([fallbackTier]);
        setSelectedTier(fallbackTier);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load event details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventAndTiers();
  }, [loadEventAndTiers]);

  const handlePrimaryBuy = async () => {
    if (!selectedTier) return;
    setIsBuying(true);
    try {
      const res = await organizerStoreApi.checkout({
        tierId: selectedTier.id,
        quantity,
        buyerEmail: user?.email || 'buyer@ticketshield.vn',
        buyerName: user?.fullName || 'Ticket Buyer',
        buyerPhone: user?.phoneNumber || '0900000000',
      });

      Alert.alert(
        'Purchase Successful',
        `Successfully placed order ${res.orderId} for ${quantity}x ${res.tierName}. Your tickets are ready.`,
        [
          {
            text: 'View in Wallet',
            onPress: () => router.push('/(tabs)/tickets'),
          },
        ]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to checkout with organizer.';
      Alert.alert('Checkout Notice', message, [
        {
          text: 'Browse Marketplace',
          onPress: () => router.push('/(tabs)/marketplace'),
        },
        { text: 'Close', style: 'cancel' },
      ]);
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error || !eventData) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={32} color={theme.colors.danger} />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorDesc}>{error || 'The requested event is not available.'}</Text>
        <FintechButton
          title="Back to Home"
          onPress={() => router.replace('/(tabs)')}
          style={styles.retryBtn}
        />
      </View>
    );
  }

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
          <EventPoster seed={eventData.eventId || eventData.name} height={200} />
          <View style={styles.heroBody}>
            <View style={styles.officialBadge}>
              <ShieldCheck size={13} color={theme.colors.success} />
              <Text style={styles.officialBadgeText}>Official Organizer Event</Text>
            </View>
            <Text style={styles.eventCategory}>
              {eventData.category || eventData.artist || 'CONCERT'}
            </Text>
            <Text style={styles.eventTitle}>{eventData.name}</Text>
            <Text style={styles.organizerName}>
              Organized by {eventData.organizerName || 'Verified Organizer'}
            </Text>

            <View style={styles.metaRow}>
              <Calendar size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>{formatEventDateTime(eventData.eventStartAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>
                {eventData.venue} {eventData.city ? `• ${eventData.city}` : ''}
              </Text>
            </View>
            {eventData.description && (
              <Text style={styles.description}>{eventData.description}</Text>
            )}
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
          {tiers.map((tier) => {
            const isSelected = selectedTier?.id === tier.id;
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
                      {tier.tierName}
                    </Text>
                    <Text style={styles.tierZone}>
                      {tier.availableQuantity > 0
                        ? `${tier.availableQuantity} tickets remaining`
                        : 'Available'}
                    </Text>
                  </View>
                  <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
                </View>

                <View style={styles.perksContainer}>
                  <View style={styles.perkRow}>
                    <Check size={13} color={theme.colors.success} />
                    <Text style={styles.perkText}>Guaranteed admission with dynamic QR pass</Text>
                  </View>
                  <View style={styles.perkRow}>
                    <Check size={13} color={theme.colors.success} />
                    <Text style={styles.perkText}>Anti-bot protected official inventory</Text>
                  </View>
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

        {selectedTier && (
          <View style={styles.checkoutPanel}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total Price ({quantity} ticket{quantity > 1 ? 's' : ''})
              </Text>
              <Text style={styles.totalValue}>{formatPrice(selectedTier.price * quantity)}</Text>
            </View>
            <FintechButton
              title="Checkout & Receive Passes"
              onPress={handlePrimaryBuy}
              loading={isBuying}
              icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
            />
          </View>
        )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  errorDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: theme.spacing.md,
    minWidth: 160,
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
  eventCategory: {
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
