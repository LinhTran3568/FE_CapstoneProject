import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  MapPin,
  AlertTriangle,
  Store,
  Building2,
  ScanLine,
  Ticket,
} from 'lucide-react-native';
import { eventsApi, organizerStoreApi, TrendingEventDto } from '@ticketshield/api-client';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';
import { EventPoster } from '../../src/components/EventPoster';
import { initialsOf, formatEventDateTime } from '../../src/utils/format';
import {
  eventNamesMatch,
  mapCatalogEventToTrending,
  OrganizerCatalogEvent,
} from '../../src/utils/organizerCatalog';
import { FintechButton } from '../../src/components/FintechButton';
import { styles } from '../../src/styles/home.styles';

export default function MobileHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width: windowWidth } = useWindowDimensions();

  const [trendingEvents, setTrendingEvents] = useState<TrendingEventDto[]>([]);
  const [catalogEvents, setCatalogEvents] = useState<OrganizerCatalogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardGap = 14;
  const cardWidth = Math.min(Math.round(windowWidth * 0.86), 360);

  const fetchHomeData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [eventsResult, catalogResult] = await Promise.all([
        eventsApi.getTrendingEvents({ limit: 12 }).catch(() => null),
        organizerStoreApi.getEventsCatalog().catch(() => null),
      ]);

      if (eventsResult === null && catalogResult === null) {
        throw new Error('Unable to connect to events service.');
      }

      setTrendingEvents(Array.isArray(eventsResult) ? eventsResult : []);
      setCatalogEvents(Array.isArray(catalogResult) ? (catalogResult as OrganizerCatalogEvent[]) : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to events service.';
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData(true);
    setRefreshing(false);
  };

  const homeEvents = useMemo<TrendingEventDto[]>(() => {
    const officialEvents = catalogEvents
      .filter((event) => Boolean(event.externalEventId))
      .map((event) => {
        const mapped = mapCatalogEventToTrending(event, event.externalEventId || '');
        const coreEvent = trendingEvents.find((candidate) =>
          eventNamesMatch(candidate.name, event.name)
        );

        if (!coreEvent) return mapped;

        return {
          ...coreEvent,
          id: mapped.id,
          eventId: mapped.eventId,
          name: coreEvent.name || mapped.name,
          originalPriceFrom: mapped.originalPriceFrom ?? coreEvent.originalPriceFrom,
          totalAvailableListings: coreEvent.totalAvailableListings ?? 0,
        };
      });

    if (officialEvents.length === 0) return trendingEvents;

    const resaleOnlyEvents = trendingEvents.filter(
      (event) =>
        (event.totalAvailableListings || 0) > 0 &&
        !officialEvents.some((officialEvent) => eventNamesMatch(officialEvent.name, event.name))
    );

    return [...officialEvents, ...resaleOnlyEvents];
  }, [catalogEvents, trendingEvents]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (cardWidth + cardGap));
    if (index >= 0 && index < homeEvents.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

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

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Connecting to TicketShield Gateway...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <AlertTriangle size={24} color={theme.colors.danger} />
          <Text style={styles.errorTitle}>Unable to load events</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <FintechButton
            title="Try Again"
            onPress={() => fetchHomeData()}
            variant="secondary"
            style={styles.retryBtn}
          />
        </View>
      ) : homeEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No events available</Text>
          <Text style={styles.emptySubtitle}>Upcoming events will appear here soon.</Text>
        </View>
      ) : (
        <>
          {/* Horizontal Events Carousel */}
          <View style={styles.carouselContainer}>
            <View style={styles.carouselHeader}>
              <Text style={styles.sectionHeading}>Upcoming Events</Text>
              {homeEvents.length > 1 && (
                <Text style={styles.carouselCounterText}>
                  {activeIndex + 1} / {homeEvents.length}
                </Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + cardGap}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={styles.carouselScrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {homeEvents.map((event, idx) => {
                const eventKey = event.eventId || event.id || event.name;
                const isLast = idx === homeEvents.length - 1;

                return (
                  <TouchableOpacity
                    key={eventKey}
                    style={[
                      styles.carouselCard,
                      {
                        width: cardWidth,
                        marginRight: isLast ? 0 : cardGap,
                      },
                    ]}
                    onPress={() => router.push(`/event/${eventKey}?source=origin`)}
                    activeOpacity={0.9}
                  >
                    <EventPoster seed={eventKey} height={190} />
                    <View style={styles.heroOverlay}>
                      <View style={styles.heroBadge}>
                        <Calendar size={12} color={theme.colors.text} />
                        <Text style={styles.heroBadgeText}>
                          {formatEventDateTime(event.eventStartAt)}
                        </Text>
                      </View>

                      <Text style={styles.heroEyebrow}>
                        {event.category || event.artist || 'FEATURED EVENT'}
                      </Text>
                      <Text style={styles.heroTitle} numberOfLines={2}>
                        {event.name}
                      </Text>

                      <View style={styles.heroFooter}>
                        <View style={styles.heroVenue}>
                          <MapPin size={13} color={theme.colors.textSecondary} />
                          <Text style={styles.heroVenueText} numberOfLines={1}>
                            {event.venue}
                          </Text>
                        </View>
                        <View style={styles.heroCta}>
                          <Text style={styles.heroCtaText}>Get Tickets</Text>
                          <ArrowRight size={14} color={theme.colors.onPrimary} />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {homeEvents.length > 1 && (
              <View style={styles.paginationDots}>
                {homeEvents.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.paginationDot,
                      i === activeIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Quick Navigation Grid */}
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
              onPress={() => router.push('/origin')}
              activeOpacity={0.85}
            >
              <View style={[styles.gridIcon, styles.gridIconOrigin]}>
                <Building2 size={22} color="#38BDF8" />
              </View>
              <Text style={styles.gridTitle}>Origin Store</Text>
              <Text style={styles.gridSubtitle}>Official event tickets</Text>
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
        </>
      )}
    </ScrollView>
  );
}
