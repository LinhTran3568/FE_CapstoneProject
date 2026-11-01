import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Square,
  Store,
  Ticket,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { Text } from '../../src/components/AppText';
import { EventPoster } from '../../src/components/EventPoster';
import { EventSeatMap, SeatMapZone } from '../../src/components/EventSeatMap';
import { FintechButton } from '../../src/components/FintechButton';
import { FintechInput } from '../../src/components/FintechInput';
import {
  eventsApi,
  organizersApi,
  organizerStoreApi,
  resaleListingsApi,
  OrganizerBackendTier,
  OrganizerCheckoutResponse,
  OrganizerDto,
  ResaleListingDetailDto,
  TrendingEventDto,
} from '@ticketshield/api-client';
import { useAuthStore } from '../../src/stores/authStore';
import { theme } from '../../src/theme';
import { formatEventDateTime, formatPrice, initialsOf } from '../../src/utils/format';
import { styles } from '../../src/styles/event-detail.styles';

interface OrganizerCatalogEvent {
  externalEventId?: string;
  name?: string;
  artist?: string;
  category?: string;
  city?: string;
  venue?: string;
  description?: string;
  eventStartAt?: string;
  eventEndAt?: string;
  resaleDeadline?: string;
  tiers?: Array<{ tierName?: string; price?: number; description?: string }>;
}

interface SellerSnapshot {
  sellerId: string;
  fullName: string;
  activeListings: number;
  minPrice: number;
  maxDiscount: number;
  tiers: string[];
}

interface ResaleStats {
  total: number;
  lowestPrice: number;
  highestPrice: number;
  lowestFaceValue: number;
  highestFaceValue: number;
  aboveFaceCount: number;
  maxObservedMarkup: number;
  maxDiscount: number;
}

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeKey(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function namesMatch(a?: string | null, b?: string | null): boolean {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (left.length < 4 || right.length < 4) return left === right;
  return left === right || left.includes(right) || right.includes(left);
}

function tierMatches(a?: string | null, b?: string | null): boolean {
  return namesMatch(a, b);
}

function mapCatalogEvent(event: OrganizerCatalogEvent, fallbackRef: string): TrendingEventDto {
  return {
    id: event.externalEventId || fallbackRef,
    eventId: event.externalEventId || fallbackRef,
    name: event.name || fallbackRef,
    artist: event.artist,
    category: event.category,
    city: event.city,
    venue: event.venue || 'Venue to be announced',
    description: event.description,
    eventStartAt: event.eventStartAt || '',
    eventEndAt: event.eventEndAt,
    originalPriceFrom: event.tiers?.reduce<number | undefined>((lowest, tier) => {
      if (typeof tier.price !== 'number') return lowest;
      return lowest === undefined ? tier.price : Math.min(lowest, tier.price);
    }, undefined),
    totalAvailableListings: 0,
  };
}

export default function EventDetailScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const isOriginParam = source === 'origin';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const eventRef = useMemo(() => {
    const raw = typeof id === 'string' && id ? id : 'atsh-2026';
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw;
    }
  }, [id]);

  const [eventData, setEventData] = useState<TrendingEventDto | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerDto | null>(null);
  const [officialTiers, setOfficialTiers] = useState<OrganizerBackendTier[]>([]);
  const [listings, setListings] = useState<ResaleListingDetailDto[]>([]);
  const [selectedTierQuantities, setSelectedTierQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState(user?.fullName || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phoneNumber || '');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    terms?: string;
  }>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrganizerCheckoutResponse | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isOfficialEvent, setIsOfficialEvent] = useState(false);
  const isOriginMode = isOriginParam || isOfficialEvent;

  useEffect(() => {
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
  }, [user]);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHeroImageFailed(false);

    try {
      const [trendingResult, catalogResult] = await Promise.all([
        eventsApi.getTrendingEvents({ limit: 50 }),
        organizerStoreApi.getEventsCatalog().catch(() => [] as OrganizerCatalogEvent[]),
      ]);

      const trendingEvents = Array.isArray(trendingResult) ? trendingResult : [];
      const catalogEvents = Array.isArray(catalogResult) ? (catalogResult as OrganizerCatalogEvent[]) : [];

      let matchedCatalog =
        catalogEvents.find((event) => normalizeKey(event.externalEventId) === normalizeKey(eventRef)) || null;

      let matchedCore =
        trendingEvents.find(
          (event) => normalizeKey(event.id) === normalizeKey(eventRef) || normalizeKey(event.eventId) === normalizeKey(eventRef)
        ) || null;

      if (!matchedCore && !GUID_PATTERN.test(eventRef)) {
        matchedCore = trendingEvents.find((event) => namesMatch(event.name, eventRef)) || null;
      }

      if (!matchedCore && matchedCatalog) {
        matchedCore = trendingEvents.find((event) => namesMatch(event.name, matchedCatalog?.name)) || null;
      }

      if (!matchedCatalog && matchedCore) {
        matchedCatalog = catalogEvents.find((event) => namesMatch(event.name, matchedCore?.name)) || null;
      }

      const resolvedEvent = matchedCore || (matchedCatalog ? mapCatalogEvent(matchedCatalog, eventRef) : null);
      if (!resolvedEvent) {
        throw new Error('This event is not available in the TicketShield catalogue.');
      }

      setEventData(resolvedEvent);
      setIsOfficialEvent(!!matchedCatalog);

      const coreEventId = GUID_PATTERN.test(resolvedEvent.id || '')
        ? resolvedEvent.id
        : GUID_PATTERN.test(resolvedEvent.eventId || '')
          ? resolvedEvent.eventId
          : null;

      const [tiersResult, listingsResult, organizersResult] = await Promise.all([
        matchedCatalog?.externalEventId
          ? organizerStoreApi
              .getEventTiers(matchedCatalog.externalEventId, matchedCatalog.name || resolvedEvent.name)
              .catch(() => [] as OrganizerBackendTier[])
          : Promise.resolve([] as OrganizerBackendTier[]),
        matchedCatalog
          ? Promise.resolve(null)
          : (coreEventId
              ? resaleListingsApi.getMarketplaceListings({ eventId: coreEventId, size: 50 })
              : resaleListingsApi.getMarketplaceListings({ keyword: resolvedEvent.name, size: 50 })
            ).catch(() => null),
        organizersApi.getOrganizers().catch(() => [] as OrganizerDto[]),
      ]);

      setOfficialTiers(Array.isArray(tiersResult) ? tiersResult : []);
      setListings(Array.isArray(listingsResult?.items) ? listingsResult!.items : []);

      const organizerName = resolvedEvent.organizerName || (matchedCatalog ? 'Official organizer' : undefined);
      setOrganizerProfile(
        (Array.isArray(organizersResult) ? organizersResult : []).find((organizer) =>
          namesMatch(organizer.name, organizerName)
        ) || null
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load this event.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [eventRef]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const activeListings = useMemo(
    () => listings.filter((listing) => listing.listingStatus === 'Verified'),
    [listings]
  );

  const seatZones = useMemo<SeatMapZone[]>(() => {
    if (officialTiers.length > 0) {
      return officialTiers
        .map((tier) => {
          const matching = activeListings.filter((listing) => tierMatches(listing.tierName, tier.tierName));
          const minResalePrice = matching.length
            ? matching.reduce((lowest, listing) => Math.min(lowest, listing.resalePrice), Number.POSITIVE_INFINITY)
            : undefined;

          return {
            key: tier.id,
            name: tier.tierName,
            originalPrice: tier.price,
            minResalePrice: Number.isFinite(minResalePrice) ? minResalePrice : undefined,
            availableListings: matching.length,
            totalQuantity: tier.totalQuantity,
            availableQuantity: tier.availableQuantity,
            isOfficial: true,
            seatZones: Array.from(new Set(matching.map((listing) => listing.seatZone).filter(Boolean))) as string[],
          };
        })
        .sort((a, b) => b.originalPrice - a.originalPrice);
    }

    const groups = new Map<string, ResaleListingDetailDto[]>();
    activeListings.forEach((listing) => {
      const key = listing.tierName || 'Verified resale';
      const bucket = groups.get(key) ?? [];
      bucket.push(listing);
      groups.set(key, bucket);
    });

    return Array.from(groups.entries())
      .map(([name, group]) => ({
        key: normalizeKey(name) || name,
        name,
        originalPrice: group.reduce((lowest, listing) => Math.min(lowest, listing.originalPrice), Number.POSITIVE_INFINITY),
        minResalePrice: group.reduce((lowest, listing) => Math.min(lowest, listing.resalePrice), Number.POSITIVE_INFINITY),
        availableListings: group.length,
        totalQuantity: undefined,
        availableQuantity: undefined,
        isOfficial: false,
        seatZones: Array.from(new Set(group.map((listing) => listing.seatZone).filter(Boolean))) as string[],
      }))
      .sort((a, b) => b.originalPrice - a.originalPrice);
  }, [officialTiers, activeListings]);

  const handleQuantityChange = useCallback((tierKey: string, qty: number) => {
    setSelectedTierQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[tierKey];
      } else {
        next[tierKey] = qty;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (seatZones.length === 0) {
      setSelectedTierQuantities({});
      return;
    }
    setSelectedTierQuantities((prev) => {
      const hasAny = Object.values(prev).some((qty) => qty > 0);
      if (hasAny) return prev;
      const firstAvailable = seatZones.find((z) => (z.availableQuantity ?? 1) > 0) || seatZones[0];
      if (firstAvailable) {
        return { [firstAvailable.key]: 1 };
      }
      return prev;
    });
  }, [seatZones]);

  const selectedItems = useMemo(() => {
    return seatZones
      .filter((zone) => (selectedTierQuantities[zone.key] || 0) > 0)
      .map((zone) => {
        const qty = selectedTierQuantities[zone.key] || 0;
        const officialTier = officialTiers.find((t) => t.id === zone.key || tierMatches(t.tierName, zone.name));
        return {
          zone,
          quantity: qty,
          officialTier,
        };
      });
  }, [seatZones, selectedTierQuantities, officialTiers]);

  const totalQuantity = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  const totalPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.zone.originalPrice * item.quantity, 0);
  }, [selectedItems]);

  const canCheckout =
    selectedItems.length > 0 &&
    selectedItems.every(
      (item) => !!item.officialTier && (item.officialTier.availableQuantity ?? 0) >= item.quantity
    );

  const resaleStats = useMemo<ResaleStats | null>(() => {
    if (activeListings.length === 0) return null;

    let lowestPrice = Number.POSITIVE_INFINITY;
    let highestPrice = 0;
    let lowestFaceValue = Number.POSITIVE_INFINITY;
    let highestFaceValue = 0;
    let aboveFaceCount = 0;
    let maxObservedMarkup = 0;
    let maxDiscount = 0;

    activeListings.forEach((listing) => {
      lowestPrice = Math.min(lowestPrice, listing.resalePrice);
      highestPrice = Math.max(highestPrice, listing.resalePrice);
      maxDiscount = Math.max(maxDiscount, listing.discountPercentage || 0);

      if (listing.originalPrice > 0) {
        lowestFaceValue = Math.min(lowestFaceValue, listing.originalPrice);
        highestFaceValue = Math.max(highestFaceValue, listing.originalPrice);
        if (listing.resalePrice > listing.originalPrice) {
          aboveFaceCount += 1;
          maxObservedMarkup = Math.max(
            maxObservedMarkup,
            ((listing.resalePrice - listing.originalPrice) / listing.originalPrice) * 100
          );
        }
      }
    });

    return {
      total: activeListings.length,
      lowestPrice: Number.isFinite(lowestPrice) ? lowestPrice : 0,
      highestPrice,
      lowestFaceValue: Number.isFinite(lowestFaceValue) ? lowestFaceValue : 0,
      highestFaceValue,
      aboveFaceCount,
      maxObservedMarkup,
      maxDiscount,
    };
  }, [activeListings]);

  const sellers = useMemo<SellerSnapshot[]>(() => {
    const grouped = new Map<string, SellerSnapshot>();

    activeListings.forEach((listing) => {
      const current = grouped.get(listing.sellerId);
      if (current) {
        current.activeListings += 1;
        current.minPrice = Math.min(current.minPrice, listing.resalePrice);
        current.maxDiscount = Math.max(current.maxDiscount, listing.discountPercentage || 0);
        if (!current.tiers.includes(listing.tierName)) current.tiers.push(listing.tierName);
        return;
      }
      grouped.set(listing.sellerId, {
        sellerId: listing.sellerId,
        fullName: listing.sellerFullName || 'Verified seller',
        activeListings: 1,
        minPrice: listing.resalePrice,
        maxDiscount: listing.discountPercentage || 0,
        tiers: [listing.tierName],
      });
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.activeListings - a.activeListings || a.minPrice - b.minPrice)
      .slice(0, 8);
  }, [activeListings]);

  const offers = useMemo(
    () =>
      [...activeListings]
        .sort((a, b) => b.discountPercentage - a.discountPercentage || a.resalePrice - b.resalePrice)
        .slice(0, 5),
    [activeListings]
  );

  const faceValueFrom =
    officialTiers.length > 0
      ? officialTiers.reduce((lowest, tier) => Math.min(lowest, tier.price), Number.POSITIVE_INFINITY)
      : resaleStats?.lowestFaceValue;

  const verifiedCeiling =
    !resaleStats || (resaleStats.aboveFaceCount === 0 && resaleStats.maxObservedMarkup === 0);

  const prefetchSession = useCallback(async (tierId: string) => {
    try {
      const session = await organizerStoreApi.createSession(tierId);
      if (session?.sessionToken) setSessionToken(session.sessionToken);
    } catch (err) {
      console.log('[EventDetailScreen] Session pre-fetch info:', err);
    }
  }, []);

  useEffect(() => {
    selectedItems.forEach((item) => {
      if (item.officialTier && item.officialTier.availableQuantity > 0) {
        prefetchSession(item.officialTier.id);
      }
    });
  }, [selectedItems, prefetchSession]);

  const openMarketplace = () => router.push('/(tabs)/marketplace');

  const handleOpenCheckoutModal = () => {
    if (!canCheckout || selectedItems.length === 0) return;
    setCheckoutError(null);
    setOrderResult(null);
    setFormErrors({});
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
    selectedItems.forEach((item) => {
      if (item.officialTier) prefetchSession(item.officialTier.id);
    });
    setIsCheckoutModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!buyerName.trim()) {
      errors.name = 'Please enter attendee full name';
    } else if (buyerName.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail.trim()) {
      errors.email = 'Please enter email address';
    } else if (!emailRegex.test(buyerEmail.trim())) {
      errors.email = 'Invalid email address (e.g. user@example.com)';
    }

    const phoneDigits = buyerPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!buyerPhone.trim()) {
      errors.phone = 'Please enter phone number';
    } else if (!phoneRegex.test(phoneDigits)) {
      errors.phone = 'Invalid phone number (must be 10 digits)';
    }

    if (!agreedTerms) {
      errors.terms = 'Please accept the organizer ticketing terms';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmCheckout = async () => {
    if (!canCheckout || selectedItems.length === 0) return;
    if (!validateForm()) return;

    setIsBuying(true);
    setCheckoutError(null);

    try {
      const checkoutPromises = selectedItems.map(async (item) => {
        if (!item.officialTier) throw new Error(`Hạng vé ${item.zone.name} không khả dụng.`);
        let activeSession = sessionToken;
        try {
          const freshSession = await organizerStoreApi.createSession(item.officialTier.id);
          activeSession = freshSession.sessionToken;
        } catch {}

        return organizerStoreApi.checkout({
          tierId: item.officialTier.id,
          quantity: item.quantity,
          buyerEmail: buyerEmail.trim(),
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          sessionToken: activeSession || undefined,
        });
      });

      const results = await Promise.all(checkoutPromises);

      const combinedResult: OrganizerCheckoutResponse = {
        orderId: results.map((r) => r.orderId).join(', '),
        tierId: results.map((r) => r.tierId).join(', '),
        eventId: results[0]?.eventId || '',
        tierName: results.map((r) => `${r.tierName} (${r.quantity})`).join(', '),
        quantity: results.reduce((sum, r) => sum + r.quantity, 0),
        unitPrice: totalPrice / (totalQuantity || 1),
        totalAmount: results.reduce((sum, r) => sum + r.totalAmount, 0),
        status: 'SUCCESS',
        remainingAvailable: results[0]?.remainingAvailable ?? 0,
        tickets: results.flatMap((r) => r.tickets || []),
      };

      setOrderResult(combinedResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete checkout with organizer.';
      setCheckoutError(message);
    } finally {
      setIsBuying(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading live event inventory...</Text>
      </View>
    );
  }

  if (error || !eventData) {
    return (
      <View style={styles.errorCenter}>
        <AlertTriangle size={34} color={theme.colors.danger} />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorDesc}>{error || 'The requested event is not available.'}</Text>
        <FintechButton title="Back to Home" onPress={() => router.replace('/(tabs)')} style={styles.retryBtn} />
      </View>
    );
  }

  const organizerName = eventData.organizerName || organizerProfile?.name || 'Verified organizer';
  const heroDate = formatEventDateTime(eventData.eventStartAt);
  const showHeroImage = !!eventData.bannerUrl && !heroImageFailed;
  const ctaTitle = canCheckout
    ? `Continue (${totalQuantity} ${totalQuantity === 1 ? 'pass' : 'passes'})`
    : totalQuantity > 0
      ? 'Passes selected'
      : offers.length > 0
        ? 'Resale deals'
        : 'No passes yet';
  const ctaDisabled = !canCheckout && offers.length === 0;

  const bottomValue = totalQuantity > 0
    ? formatPrice(totalPrice)
    : resaleStats
      ? formatPrice(resaleStats.lowestPrice)
      : '—';

  const bottomSub = totalQuantity > 0
    ? `${totalQuantity} ${totalQuantity === 1 ? 'pass' : 'passes'} · ` + selectedItems.map((item) => `${item.quantity}× ${item.zone.name}`).join(', ')
    : 'Select passes above';

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 132 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {showHeroImage ? (
            <Image
              source={{ uri: eventData.bannerUrl! }}
              style={styles.heroMedia}
              resizeMode="cover"
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <View style={styles.heroPoster}>
              <EventPoster seed={eventData.eventId || eventData.id || eventData.name} height={408} />
            </View>
          )}

          <Svg style={styles.heroShadeSvg} width="100%" height="100%">
            <Defs>
              <LinearGradient id="event-hero-shade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.colors.background} stopOpacity="0.28" />
                <Stop offset="0.46" stopColor={theme.colors.background} stopOpacity="0.18" />
                <Stop offset="0.76" stopColor={theme.colors.background} stopOpacity="0.82" />
                <Stop offset="1" stopColor={theme.colors.background} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#event-hero-shade)" />
          </Svg>

          <View style={[styles.heroTopBar, { top: insets.top + theme.spacing.sm }]}>
            <TouchableOpacity
              style={styles.heroIconButton}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroIconButton}
              onPress={openMarketplace}
              accessibilityRole="button"
              accessibilityLabel="Open resale marketplace"
            >
              <Store size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{eventData.category || 'EVENT'}</Text>
              </View>
              <View style={styles.inventoryBadge}>
                <ShieldCheck size={12} color={theme.colors.success} />
                <Text style={styles.inventoryBadgeText}>
                  {officialTiers.length > 0 ? 'OFFICIAL INVENTORY LIVE' : 'VERIFIED RESALE MARKET'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{eventData.name}</Text>
            {!!eventData.artist && <Text style={styles.heroArtist}>{eventData.artist}</Text>}

            <View style={styles.heroMetaRow}>
              <Calendar size={14} color={theme.colors.primary} />
              <Text style={styles.heroMetaText}>{heroDate}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <MapPin size={14} color={theme.colors.primary} />
              <Text style={styles.heroMetaText}>
                {eventData.venue}
                {eventData.city ? ` · ${eventData.city}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.statStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeListings.length}</Text>
              <Text style={styles.statLabel}>Resale offers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sellers.length}</Text>
              <Text style={styles.statLabel}>Active sellers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {resaleStats ? formatPrice(resaleStats.lowestPrice) : faceValueFrom ? formatPrice(faceValueFrom) : '—'}
              </Text>
              <Text style={styles.statLabel}>{resaleStats ? 'Lowest resale' : 'Face value from'}</Text>
             </View>
           </View>

          <View style={[styles.ceilingCard, verifiedCeiling ? styles.ceilingCardOk : styles.ceilingCardWarn]}>
            <View style={styles.ceilingHeader}>
              <View style={styles.ceilingIcon}>
                <ShieldCheck
                  size={24}
                  color={verifiedCeiling ? theme.colors.success : theme.colors.warning}
                />
              </View>
              <View style={styles.ceilingTextWrap}>
                <Text style={styles.ceilingTitle}>Face-value resale promise</Text>
                <Text style={styles.ceilingSubtitle}>
                  {resaleStats
                    ? `${resaleStats.total} active ${
                        resaleStats.total === 1 ? 'listing' : 'listings'
                      } checked against the original ticket price.`
                    : 'No active resale listings yet. Every new listing is checked against its original ticket price.'}
                </Text>
              </View>
              <View
                style={[
                  styles.ceilingBadge,
                  verifiedCeiling ? styles.ceilingBadgeOk : styles.ceilingBadgeWarn,
                ]}
              >
                <Text
                  style={[
                    styles.ceilingBadgeText,
                    { color: verifiedCeiling ? theme.colors.success : theme.colors.warning },
                  ]}
                >
                  {verifiedCeiling ? 'PROTECTED' : 'AT RISK'}
                </Text>
              </View>
            </View>

            <View style={styles.ceilingStats}>
              <View style={styles.ceilingStat}>
                <Text style={styles.ceilingStatLabel}>Lowest resale</Text>
                <Text style={styles.ceilingStatValue}>
                  {resaleStats ? formatPrice(resaleStats.lowestPrice) : 'No listings'}
                </Text>
              </View>
              <View style={styles.ceilingStat}>
                <Text style={styles.ceilingStatLabel}>Highest resale</Text>
                <Text style={styles.ceilingStatValue}>
                  {resaleStats ? formatPrice(resaleStats.highestPrice) : '—'}
                </Text>
              </View>
              <View style={styles.ceilingStat}>
                <Text style={styles.ceilingStatLabel}>Above face</Text>
                <Text style={styles.ceilingStatValue}>
                  {resaleStats ? `${resaleStats.aboveFaceCount} of ${resaleStats.total}` : '0 listings'}
                </Text>
              </View>
            </View>

            <Text style={styles.ceilingFoot}>
              {resaleStats
                ? verifiedCeiling
                  ? `Every listing is at or below its original price (highest observed mark-up: ${Math.max(
                      0,
                      resaleStats.maxObservedMarkup
                    ).toFixed(0)}%). Escrow releases only after the pass is delivered.`
                  : `Highest observed mark-up: ${resaleStats.maxObservedMarkup.toFixed(
                      0
                    )}%. TicketShield flags these listings and keeps escrow locked until the transfer is verified.`
                : faceValueFrom
                  ? `Organizer face value starts at ${formatPrice(
                      faceValueFrom
                    )}. Resale sellers must list against this face value before escrow can release.`
                  : 'Resale sellers must match the original ticket price before escrow can release.'}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionEyebrow}>Live seat inventory</Text>
                <Text style={styles.sectionTitle}>Pick your section</Text>
                <Text style={styles.sectionSubtitle}>
                  {officialTiers.length > 0
                    ? `Live availability from ${organizerName}.`
                    : activeListings.length > 0
                      ? 'Zone availability from verified resale listings.'
                      : 'No official inventory is connected for this event yet.'}
                </Text>
              </View>
            </View>

            {seatZones.length > 0 ? (
              <EventSeatMap
                zones={seatZones}
                selectedQuantities={selectedTierQuantities}
                onQuantityChange={handleQuantityChange}
              />
            ) : (
              <View style={styles.emptyCard}>
                <Ticket size={22} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>Seat map not available yet</Text>
                <Text style={styles.emptyText}>
                  The organizer has not connected official inventory for this event. Verified resale passes will
                  appear here automatically.
                </Text>
              </View>
            )}

            {!isOriginMode && selectedItems.some((item) => !item.officialTier) && (
              <View style={styles.availabilityNotice}>
                <Info size={16} color={theme.colors.info} />
                <Text style={styles.availabilityNoticeText}>
                  The official box office is not connected for some sections. Verified resale passes are still
                  protected by escrow.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionEyebrow}>Trust layer</Text>
                <Text style={styles.sectionTitle}>Seller snapshot</Text>
                <Text style={styles.sectionSubtitle}>
                  {sellers.length > 0
                    ? `${sellers.length} verified ${sellers.length === 1 ? 'seller' : 'sellers'} priced against face value.`
                    : 'No resale sellers have listed passes for this event yet.'}
                </Text>
              </View>
            </View>

            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Store size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{organizerName}</Text>
                <Text style={styles.organizerSub} numberOfLines={1}>
                  {organizerProfile?.officialEmail || 'Official event organizer'}
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={10} color={theme.colors.success} />
                <Text style={styles.verifiedPillText}>VERIFIED</Text>
              </View>
            </View>

            {sellers.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.sellerScroll}
                contentContainerStyle={styles.sellerScrollContent}
              >
                {sellers.map((seller) => (
                  <View key={seller.sellerId} style={styles.sellerCard}>
                    <View style={styles.sellerTop}>
                      <View style={styles.sellerAvatar}>
                        <Text style={styles.sellerAvatarText}>{initialsOf(seller.fullName)}</Text>
                      </View>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {seller.fullName}
                      </Text>
                    </View>
                    <Text style={styles.sellerMeta}>
                      {seller.activeListings} active {seller.activeListings === 1 ? 'listing' : 'listings'} ·{' '}
                      {seller.tiers.length} {seller.tiers.length === 1 ? 'zone' : 'zones'}
                    </Text>
                    <Text style={styles.sellerPrice}>from {formatPrice(seller.minPrice)}</Text>
                    {seller.maxDiscount > 0 && (
                      <View style={styles.sellerBadge}>
                        <Text style={styles.sellerBadgeText}>
                          -{Math.round(seller.maxDiscount)}% below face
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <Users size={22} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No resellers yet</Text>
                <Text style={styles.emptyText}>
                  Only verified sellers can appear here. New listings are checked against the original ticket price.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionEyebrow}>Verified passes</Text>
                <Text style={styles.sectionTitle}>Resale offers</Text>
                <Text style={styles.sectionSubtitle}>Best face-value deals available right now.</Text>
              </View>
              {offers.length > 0 && (
                <TouchableOpacity onPress={openMarketplace} accessibilityRole="button">
                  <Text style={styles.sectionAction}>View all</Text>
                </TouchableOpacity>
              )}
            </View>

            {offers.length > 0 ? (
              <View style={styles.resaleList}>
                {offers.map((offer) => (
                  <TouchableOpacity
                    key={offer.listingId}
                    style={styles.resaleRow}
                    onPress={openMarketplace}
                    activeOpacity={0.86}
                    accessibilityRole="button"
                    accessibilityLabel={`${offer.tierName} resale pass, ${formatPrice(
                      offer.resalePrice
                    )}, sold by ${offer.sellerFullName}`}
                  >
                    <View style={styles.resaleIcon}>
                      <Ticket size={17} color={theme.colors.primary} />
                    </View>
                    <View style={styles.resaleInfo}>
                      <Text style={styles.resaleTier} numberOfLines={1}>
                        {offer.tierName}
                      </Text>
                      <Text style={styles.resaleSeat} numberOfLines={1}>
                        {offer.seatZone || 'Verified digital pass'}
                      </Text>
                      <Text style={styles.resaleSeller} numberOfLines={1}>
                        Sold by {offer.sellerFullName}
                      </Text>
                    </View>
                    <View style={styles.resalePriceGroup}>
                      <Text style={styles.resalePrice}>{formatPrice(offer.resalePrice)}</Text>
                      {offer.originalPrice > offer.resalePrice && (
                        <Text style={styles.resaleOriginal}>{formatPrice(offer.originalPrice)}</Text>
                      )}
                      <ArrowRight size={13} color={theme.colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ticket size={22} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>No resale passes yet</Text>
                <Text style={styles.emptyText}>
                  When a verified fan lists a pass, it appears here with its original face value and escrow
                  protection.
                </Text>
                <FintechButton
                  title="Open Resale Market"
                  variant="secondary"
                  onPress={openMarketplace}
                  style={styles.emptyButton}
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionEyebrow}>Plan your night</Text>
                <Text style={styles.sectionTitle}>Event details</Text>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={14} color={theme.colors.primary} />
                </View>
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>Date & time</Text>
                  <Text style={styles.detailValue}>{heroDate}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MapPin size={14} color={theme.colors.primary} />
                </View>
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>Venue</Text>
                  <Text style={styles.detailValue}>
                    {eventData.venue}
                    {eventData.city ? `\n${eventData.city}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Store size={14} color={theme.colors.primary} />
                </View>
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>Organizer</Text>
                  <Text style={styles.detailValue}>
                    {organizerName}
                    {organizerProfile?.officialEmail ? ` · ${organizerProfile.officialEmail}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <ShieldCheck size={14} color={theme.colors.success} />
                </View>
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>Face-value check</Text>
                  <Text style={styles.detailValue}>
                    {faceValueFrom
                      ? `Official prices from ${formatPrice(faceValueFrom)}`
                      : 'Checked against the original ticket price'}
                  </Text>
                </View>
              </View>
            </View>

            {!!eventData.description && (
              <View style={styles.aboutCard}>
                <Text style={styles.sectionEyebrow}>About this event</Text>
                <Text style={styles.aboutText}>{eventData.description}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + theme.spacing.md }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>
            {isOriginMode
              ? totalQuantity > 0
                ? 'Official checkout'
                : 'Official tickets'
              : totalQuantity > 0
                ? canCheckout
                  ? 'Official checkout'
                  : 'Verified resale'
                : 'Resale market'}
          </Text>
          <Text style={styles.bottomValue}>{bottomValue}</Text>
          <Text style={styles.bottomSub} numberOfLines={1}>
            {bottomSub}
          </Text>
        </View>
        <View style={styles.bottomCtaWrap}>
          <FintechButton
            title={ctaTitle}
            onPress={canCheckout ? handleOpenCheckoutModal : openMarketplace}
            disabled={ctaDisabled}
            icon={<ChevronRight size={16} color={theme.colors.onPrimary} />}
            textStyle={{ fontSize: 13 }}
            style={{ minHeight: 48 }}
          />
        </View>
      </View>

      <Modal
        visible={isCheckoutModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCheckoutModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {orderResult ? 'Order Successful' : 'Attendee Information'}
              </Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setIsCheckoutModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close checkout"
              >
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {orderResult ? (
                <View style={styles.successBox}>
                  <View style={styles.successIcon}>
                    <CheckCircle size={36} color={theme.colors.success} />
                  </View>
                  <Text style={styles.successTitle}>Passes ready in your wallet</Text>
                  <Text style={styles.successMessage}>
                    Order #{orderResult.orderId.slice(0, 8)} was confirmed by the official organizer at face value.
                  </Text>

                  {orderResult.tickets && orderResult.tickets.length > 0 && (
                    <View style={styles.ticketCodesBox}>
                      <Text style={styles.ticketCodesLabel}>YOUR OFFICIAL PASS CODES</Text>
                      {orderResult.tickets.map((ticket, index) => (
                        <View key={ticket.ticketCode || index} style={styles.ticketCodeCard}>
                          <View style={styles.ticketCodeBadge}>
                            <Text style={styles.ticketCodeBadgeText}>
                              Pass #{index + 1} · {ticket.seatZone || 'Official Pass'}
                            </Text>
                          </View>
                          <Text style={styles.ticketCodeValue}>{ticket.ticketCode}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
                    <FintechButton
                      title="View in Wallet"
                      onPress={() => {
                        setIsCheckoutModalOpen(false);
                        router.push('/(tabs)/tickets');
                      }}
                      icon={<Ticket size={18} color={theme.colors.onPrimary} />}
                    />
                    <FintechButton
                      title="Done"
                      variant="secondary"
                      onPress={() => setIsCheckoutModalOpen(false)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <View style={styles.orderSummaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Event</Text>
                      <Text style={styles.summaryValue} numberOfLines={1}>
                        {eventData.name}
                      </Text>
                    </View>
                    {selectedItems.map((item) => (
                      <View key={item.zone.key} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{item.zone.name}</Text>
                        <Text style={styles.summaryValue}>
                          {item.quantity} × {formatPrice(item.zone.originalPrice)}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>
                        Total ({totalQuantity} {totalQuantity === 1 ? 'pass' : 'passes'})
                      </Text>
                      <Text style={[styles.summaryValue, { color: theme.colors.primary, fontSize: 16 }]}>
                        {formatPrice(totalPrice)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fairnessNote}>
                    <ShieldCheck size={15} color={theme.colors.success} />
                    <Text style={styles.fairnessNoteText}>
                      Official organizer inventory. This price is the original face value.
                    </Text>
                  </View>

                  {checkoutError && (
                    <View style={styles.submitErrorBox}>
                      <AlertTriangle size={18} color={theme.colors.danger} />
                      <Text style={styles.submitErrorText}>{checkoutError}</Text>
                    </View>
                  )}

                  <FintechInput
                    label="Full Name *"
                    placeholder="Enter your full name"
                    value={buyerName}
                    onChangeText={(value) => {
                      setBuyerName(value);
                      if (formErrors.name) setFormErrors((errors) => ({ ...errors, name: undefined }));
                    }}
                    error={formErrors.name}
                    icon={<User size={18} color={theme.colors.primary} />}
                  />

                  <FintechInput
                    label="Email Address *"
                    placeholder="Enter your email address"
                    value={buyerEmail}
                    onChangeText={(value) => {
                      setBuyerEmail(value);
                      if (formErrors.email) setFormErrors((errors) => ({ ...errors, email: undefined }));
                    }}
                    error={formErrors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Mail size={18} color={theme.colors.primary} />}
                  />

                  <FintechInput
                    label="Phone Number *"
                    placeholder="Enter your phone number"
                    value={buyerPhone}
                    onChangeText={(value) => {
                      setBuyerPhone(value);
                      if (formErrors.phone) setFormErrors((errors) => ({ ...errors, phone: undefined }));
                    }}
                    error={formErrors.phone}
                    keyboardType="phone-pad"
                    icon={<Phone size={18} color={theme.colors.primary} />}
                  />

                  <TouchableOpacity
                    style={styles.termsContainer}
                    onPress={() => {
                      setAgreedTerms(!agreedTerms);
                      if (formErrors.terms) setFormErrors((errors) => ({ ...errors, terms: undefined }));
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: agreedTerms }}
                  >
                    <View style={styles.checkboxBox}>
                      {agreedTerms ? (
                        <CheckSquare size={20} color={theme.colors.primary} />
                      ) : (
                        <Square size={20} color={theme.colors.border} />
                      )}
                    </View>
                    <Text style={styles.termsLabel}>
                      I confirm the attendee details are accurate and agree to the official organizer ticketing
                      terms.
                    </Text>
                  </TouchableOpacity>
                  {formErrors.terms && <Text style={styles.fieldError}>{formErrors.terms}</Text>}

                  <View style={styles.modalFooter}>
                    <FintechButton
                      title="Confirm & Receive Tickets"
                      onPress={handleConfirmCheckout}
                      loading={isBuying}
                      icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
