import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
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
import { styles } from '../../src/styles/event-detail.styles';

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
