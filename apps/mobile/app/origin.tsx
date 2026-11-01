import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  MapPin,
  Ticket,
} from 'lucide-react-native';
import { Text } from '../src/components/AppText';
import { EventPoster } from '../src/components/EventPoster';
import { FintechButton } from '../src/components/FintechButton';
import { eventsApi, organizerStoreApi, TrendingEventDto } from '@ticketshield/api-client';
import { theme } from '../src/theme';
import { formatEventDateTime, formatPrice } from '../src/utils/format';
import { eventNamesMatch, OrganizerCatalogEvent } from '../src/utils/organizerCatalog';
import { styles } from '../src/styles/origin.styles';

interface OriginTier {
  id: string;
  name: string;
  price: number;
  availableQuantity?: number;
  totalQuantity?: number;
}

interface OriginEvent {
  externalEventId: string;
  name: string;
  artist?: string;
  category?: string;
  city?: string;
  venue?: string;
  eventStartAt?: string;
  tiers: OriginTier[];
  minPrice: number;
  totalAvailable?: number;
}

export default function OriginStoreScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<OriginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const [catalog, trendingResult] = await Promise.all([
        organizerStoreApi.getEventsCatalog(),
        eventsApi.getTrendingEvents({ limit: 50 }).catch(() => [] as TrendingEventDto[]),
      ]);
      const catalogEvents = Array.isArray(catalog) ? (catalog as OrganizerCatalogEvent[]) : [];
      const trendingEvents = Array.isArray(trendingResult) ? trendingResult : [];

      const resolved = await Promise.all(
        catalogEvents.map(async (event): Promise<OriginEvent | null> => {
          const externalEventId = event.externalEventId;
          if (!externalEventId) return null;

          const liveTiers = await organizerStoreApi
            .getEventTiers(externalEventId, event.name)
            .catch(() => []);

          const tiers: OriginTier[] = liveTiers.length
            ? liveTiers.map((tier) => ({
                id: tier.id,
                name: tier.tierName,
                price: tier.price,
                availableQuantity: tier.availableQuantity,
                totalQuantity: tier.totalQuantity,
              }))
            : (event.tiers || []).map((tier, index) => ({
                id: `${externalEventId}-${index}`,
                name: tier.tierName || 'General admission',
                price: Number(tier.price) || 0,
              }));

          const pricedTiers = tiers.filter((tier) => tier.price > 0);
          if (pricedTiers.length === 0) return null;

          const hasLiveAvailability = pricedTiers.every(
            (tier) => typeof tier.availableQuantity === 'number'
          );
          const coreEvent = trendingEvents.find((candidate) =>
            eventNamesMatch(candidate.name, event.name)
          );

          return {
            externalEventId,
            name: coreEvent?.name || event.name || externalEventId,
            artist: coreEvent?.artist || event.artist,
            category: coreEvent?.category || event.category,
            city: coreEvent?.city || event.city,
            venue: coreEvent?.venue || event.venue,
            eventStartAt: coreEvent?.eventStartAt || event.eventStartAt,
            tiers: pricedTiers,
            minPrice: Math.min(...pricedTiers.map((tier) => tier.price)),
            totalAvailable: hasLiveAvailability
              ? pricedTiers.reduce(
                  (total, tier) => total + (tier.availableQuantity || 0),
                  0
                )
              : undefined,
          };
        })
      );

      setEvents(
        resolved
          .filter((event): event is OriginEvent => event !== null)
          .sort((a, b) => {
            const left = new Date(a.eventStartAt || '').getTime();
            const right = new Date(b.eventStartAt || '').getTime();
            if (Number.isNaN(left) && Number.isNaN(right)) return 0;
            if (Number.isNaN(left)) return 1;
            if (Number.isNaN(right)) return -1;
            return left - right;
          })
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load official organizer events.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCatalog(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading official organizer inventory...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.intro}>
        <View style={styles.introGlow} />
        <View style={styles.introIcon}>
          <Building2 size={22} color={theme.colors.info} />
        </View>
        <Text style={styles.introEyebrow}>Official tickets</Text>
        <Text style={styles.introTitle}>Origin Store</Text>
        <Text style={styles.introDesc}>
          Buy directly from verified organizers at face value. No resale markup, no hidden
          middlemen.
        </Text>
        <View style={styles.introMeta}>
          <View style={styles.countChip}>
            <Ticket size={13} color={theme.colors.textSecondary} />
            <Text style={styles.countChipText}>
              {events.length} event{events.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.faceValueChip}>
            <CheckCircle size={13} color={theme.colors.success} />
            <Text style={styles.faceValueChipText}>Face value</Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.stateCard}>
          <AlertTriangle size={26} color={theme.colors.danger} />
          <Text style={styles.stateTitle}>Unable to load Origin Store</Text>
          <Text style={styles.stateDesc}>{error}</Text>
          <FintechButton
            title="Try Again"
            onPress={() => loadCatalog()}
            variant="secondary"
            style={styles.retryButton}
          />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.stateCard}>
          <Building2 size={26} color={theme.colors.info} />
          <Text style={styles.stateTitle}>No official events yet</Text>
          <Text style={styles.stateDesc}>
            Verified organizer events will appear here as soon as they connect their inventory.
          </Text>
        </View>
      ) : (
        events.map((event) => {
          const soldOut = event.totalAvailable === 0;
          return (
            <TouchableOpacity
              key={event.externalEventId}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/event/${event.externalEventId}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open official tickets for ${event.name}`}
            >
              <View style={styles.posterWrap}>
                <EventPoster seed={event.externalEventId} height={150} />
                <View style={styles.posterBadge}>
                  <Building2 size={12} color={theme.colors.info} />
                  <Text style={styles.posterBadgeText}>Official</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.topRow}>
                  <Text style={styles.category}>
                    {event.category || event.artist || 'Live event'}
                  </Text>
                  <View
                    style={[
                      styles.availabilityBadge,
                      soldOut && styles.soldOutBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityBadgeText,
                        soldOut && styles.soldOutBadgeText,
                      ]}
                    >
                      {soldOut
                        ? 'Sold out'
                        : typeof event.totalAvailable === 'number'
                          ? `${event.totalAvailable} seats left`
                          : 'Official inventory'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.title}>{event.name}</Text>
                {event.artist && <Text style={styles.artist}>{event.artist}</Text>}

                <View style={styles.metaRow}>
                  <Calendar size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {event.eventStartAt
                      ? formatEventDateTime(event.eventStartAt)
                      : 'Date to be announced'}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {[event.venue, event.city].filter(Boolean).join(', ') || 'Venue to be announced'}
                  </Text>
                </View>

                <View style={styles.tierList}>
                  {event.tiers.slice(0, 3).map((tier) => (
                    <View key={tier.id} style={styles.tierChip}>
                      <Text style={styles.tierName} numberOfLines={1}>
                        {tier.name}
                      </Text>
                      <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
                    </View>
                  ))}
                  {event.tiers.length > 3 && (
                    <View style={styles.tierChip}>
                      <Text style={styles.tierName}>More tiers</Text>
                      <Text style={styles.tierPrice}>+{event.tiers.length - 3}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.footer}>
                  <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>From</Text>
                    <Text style={styles.priceValue}>{formatPrice(event.minPrice)}</Text>
                  </View>
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>View tickets</Text>
                    <ArrowRight size={14} color={theme.colors.onPrimary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
