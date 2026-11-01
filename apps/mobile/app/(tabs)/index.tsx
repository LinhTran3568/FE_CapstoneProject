import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import {
  Ticket,
  Store,
  ArrowRight,
  Calendar,
  MapPin,
  ScanLine,
  Building2,
  AlertTriangle,
} from 'lucide-react-native';
import { eventsApi, TrendingEventDto } from '@ticketshield/api-client';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';
import { EventPoster } from '../../src/components/EventPoster';
import { formatPrice, initialsOf, formatEventDateTime } from '../../src/utils/format';
import { FintechButton } from '../../src/components/FintechButton';
import { styles } from '../../src/styles/home.styles';

export default function MobileHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [trendingEvents, setTrendingEvents] = useState<TrendingEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const events = await eventsApi.getTrendingEvents({ limit: 6 });
      setTrendingEvents(events || []);
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

  const heroEvent = trendingEvents[0];
  const listEvents = trendingEvents.slice(1);

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
      ) : (
        <>
          {/* Hero Featured Event */}
          {heroEvent && (
            <TouchableOpacity
              style={styles.heroCard}
              onPress={() => router.push(`/event/${heroEvent.eventId || heroEvent.id || 'featured'}`)}
              activeOpacity={0.9}
            >
              <EventPoster seed={heroEvent.eventId || heroEvent.name} height={190} />
              <View style={styles.heroOverlay}>
                <View style={styles.heroBadge}>
                  <Calendar size={12} color={theme.colors.text} />
                  <Text style={styles.heroBadgeText}>
                    {formatEventDateTime(heroEvent.eventStartAt)}
                  </Text>
                </View>
                <Text style={styles.heroEyebrow}>
                  {heroEvent.category || heroEvent.artist || 'FEATURED EVENT'}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {heroEvent.name}
                </Text>
                <View style={styles.heroFooter}>
                  <View style={styles.heroVenue}>
                    <MapPin size={13} color={theme.colors.textSecondary} />
                    <Text style={styles.heroVenueText} numberOfLines={1}>
                      {heroEvent.venue}
                    </Text>
                  </View>
                  <View style={styles.heroCta}>
                    <Text style={styles.heroCtaText}>Get Tickets</Text>
                    <ArrowRight size={14} color={theme.colors.onPrimary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}

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
              onPress={() =>
                router.push(
                  heroEvent
                    ? `/event/${heroEvent.eventId || heroEvent.id}`
                    : '/(tabs)/marketplace'
                )
              }
              activeOpacity={0.85}
            >
              <View style={[styles.gridIcon, styles.gridIconOrigin]}>
                <Building2 size={22} color="#38BDF8" />
              </View>
              <Text style={styles.gridTitle}>Origin Store</Text>
              <Text style={styles.gridSubtitle}>Direct from organizer</Text>
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


          {/* Section Header */}
          {listEvents.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeading}>Trending Events</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/marketplace')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.viewMoreText}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Event Cards */}
              {listEvents.map((event) => {
                const eventKey = event.eventId || event.id || event.name;
                const price = event.minResalePrice || event.originalPriceFrom || 0;
                return (
                  <TouchableOpacity
                    key={eventKey}
                    style={styles.eventCard}
                    onPress={() => router.push(`/event/${eventKey}`)}
                    activeOpacity={0.9}
                  >
                    <EventPoster seed={eventKey} height={120} />
                    <View style={styles.eventBody}>
                      <View style={styles.eventTopRow}>
                        <Text style={styles.eventCategory}>
                          {event.category || event.artist || 'LIVE'}
                        </Text>
                        {price > 0 && (
                          <Text style={styles.eventPriceFrom}>From {formatPrice(price)}</Text>
                        )}
                      </View>
                      <Text style={styles.eventTitle}>{event.name}</Text>
                      <View style={styles.eventMetaRow}>
                        <Calendar size={13} color={theme.colors.textSecondary} />
                        <Text style={styles.eventMetaText}>
                          {formatEventDateTime(event.eventStartAt)}
                        </Text>
                      </View>
                      <View style={styles.eventMetaRow}>
                        <MapPin size={13} color={theme.colors.textSecondary} />
                        <Text style={styles.eventMetaText} numberOfLines={1}>
                          {event.venue}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
