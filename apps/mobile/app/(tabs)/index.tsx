import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Ticket,
  Store,
  ArrowRight,
  Calendar,
  MapPin,
  ScanLine,
  Building2,
  ChevronRight,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { GatewayStatusBadge } from '../../src/components/GatewayStatusBadge';
import { EventPoster } from '../../src/components/EventPoster';
import { formatPrice, initialsOf } from '../../src/utils/format';

const FEATURED_EVENT = {
  id: 'atsh-2026',
  title: 'Anh Trai Say Hi Live Concert 2026',
  tour: 'The Grand Arena World Tour',
  dateLabel: 'Saturday, Sep 19, 2026 • 19:30',
  venue: 'Military Zone 7 Stadium, HCMC',
  priceFrom: 800000,
  organizer: 'VieON & Vie Channel',
};

const TRENDING_EVENTS = [
  {
    id: 'my-tam-tri-am',
    title: 'My Tam - Live Concert Tri Am',
    dateLabel: 'Saturday, May 10, 2026',
    venue: 'My Dinh National Stadium, Hanoi',
    priceFrom: 1200000,
    category: 'Concert & Live',
  },
  {
    id: 'ravolution-asia',
    title: 'Ravolution Music Festival Asia 2026',
    dateLabel: 'Sunday, Dec 20, 2026',
    venue: 'SECC, District 7, HCMC',
    priceFrom: 750000,
    category: 'Festival EDM',
  },
];

export default function MobileHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
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

      {/* Hero Featured Event */}
      <TouchableOpacity
        style={styles.heroCard}
        onPress={() => router.push('/event/atsh-2026')}
        activeOpacity={0.9}
      >
        <EventPoster seed="atsh-2026" height={190} />
        <View style={styles.heroOverlay}>
          <View style={styles.heroBadge}>
            <Calendar size={12} color={theme.colors.text} />
            <Text style={styles.heroBadgeText}>{FEATURED_EVENT.dateLabel}</Text>
          </View>
          <Text style={styles.heroEyebrow}>{FEATURED_EVENT.tour}</Text>
          <Text style={styles.heroTitle}>{FEATURED_EVENT.title}</Text>
          <View style={styles.heroFooter}>
            <View style={styles.heroVenue}>
              <MapPin size={13} color={theme.colors.textSecondary} />
              <Text style={styles.heroVenueText} numberOfLines={1}>
                {FEATURED_EVENT.venue}
              </Text>
            </View>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Get Tickets</Text>
              <ArrowRight size={14} color={theme.colors.onPrimary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Navigation Quick Menu (Matching Web: Marketplace, Origin Store, Sell, My Tickets) */}
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
          onPress={() => router.push('/event/atsh-2026')}
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

      {/* Trust & Escrow Guarantee Banner */}
      <View style={styles.escrowBanner}>
        <ShieldCheck size={20} color={theme.colors.success} />
        <View style={styles.escrowBannerText}>
          <Text style={styles.escrowBannerTitle}>100% Escrow Protection</Text>
          <Text style={styles.escrowBannerDesc}>
            Funds are held in secure escrow and only released to the seller after successful venue entry.
          </Text>
        </View>
      </View>

      {/* Section Header */}
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
      {TRENDING_EVENTS.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.eventCard}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.9}
        >
          <EventPoster seed={event.id} height={120} />
          <View style={styles.eventBody}>
            <View style={styles.eventTopRow}>
              <Text style={styles.eventCategory}>{event.category}</Text>
              <Text style={styles.eventPriceFrom}>From {formatPrice(event.priceFrom)}</Text>
            </View>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMetaRow}>
              <Calendar size={13} color={theme.colors.textSecondary} />
              <Text style={styles.eventMetaText}>{event.dateLabel}</Text>
            </View>
            <View style={styles.eventMetaRow}>
              <MapPin size={13} color={theme.colors.textSecondary} />
              <Text style={styles.eventMetaText} numberOfLines={1}>
                {event.venue}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
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
    marginBottom: theme.spacing.md,
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.base,
  },
  gatewaySlot: {
    marginBottom: theme.spacing.xs,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroOverlay: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
  },
  heroEyebrow: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.text,
    marginTop: 4,
    marginBottom: 12,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  heroVenueText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
  },
  heroCtaText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.onPrimary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  gridItem: {
    width: '48.5%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridIconOrigin: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  gridIconSell: {
    backgroundColor: theme.colors.successLight,
  },
  gridIconNeutral: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  gridTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  gridSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  escrowBannerText: {
    flex: 1,
  },
  escrowBannerTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  escrowBannerDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  viewMoreText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  eventBody: {
    padding: theme.spacing.md,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventCategory: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  eventPriceFrom: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  eventTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eventMetaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
