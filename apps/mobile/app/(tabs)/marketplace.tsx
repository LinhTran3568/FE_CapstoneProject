import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Calendar,
  MapPin,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Ticket,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Lock,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/stores/authStore';
import type { ResaleListingDetailDto } from '@ticketshield/types';
import { API_CONFIG, resaleListingsApi } from '@ticketshield/api-client';
import * as signalR from '@microsoft/signalr';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { BuyTicketBottomSheet } from '../../src/components/BuyTicketBottomSheet';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';
import { styles } from '../../src/styles/marketplace.styles';

type PriceBand = 'ALL' | 'UNDER_1M' | 'FROM_1M_TO_2M' | 'OVER_2M';

const PRICE_BANDS: { key: PriceBand; label: string; fullLabel: string }[] = [
  { key: 'ALL', label: 'All Prices', fullLabel: 'All Prices' },
  { key: 'UNDER_1M', label: '< 1M ₫', fullLabel: 'Under 1.000.000 ₫' },
  { key: 'FROM_1M_TO_2M', label: '1M – 2M ₫', fullLabel: '1.000.000 ₫ – 2.000.000 ₫' },
  { key: 'OVER_2M', label: '> 2M ₫', fullLabel: 'Over 2.000.000 ₫' },
];

function matchesBand(price: number, band: PriceBand): boolean {
  if (band === 'UNDER_1M') return price < 1_000_000;
  if (band === 'FROM_1M_TO_2M') return price >= 1_000_000 && price <= 2_000_000;
  if (band === 'OVER_2M') return price > 2_000_000;
  return true;
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [priceBand, setPriceBand] = useState<PriceBand>('ALL');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [listings, setListings] = useState<ResaleListingDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedListing, setSelectedListing] = useState<ResaleListingDetailDto | null>(null);
  const [selectedBundleItems, setSelectedBundleItems] = useState<ResaleListingDetailDto[]>([]);
  const latestSearchTerm = useRef('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    latestSearchTerm.current = debouncedKeyword;
  }, [debouncedKeyword]);

  const loadListings = useCallback(async (term: string, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await resaleListingsApi.getMarketplaceListings({
        keyword: term.trim() || undefined,
        size: 50,
      });
      setListings(res?.items || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load marketplace listings.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(debouncedKeyword);
  }, [debouncedKeyword, loadListings]);

  useFocusEffect(
    useCallback(() => {
      loadListings(debouncedKeyword, true);
    }, [debouncedKeyword, loadListings])
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    let disposed = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_CONFIG.baseURL.replace(/\/api\/v1\/?$/, '')}/hubs/payment`, {
        // Hermes/whatwg-fetch cannot represent Android's network status 0
        // during SignalR Long Polling. Marketplace realtime is WebSocket-only.
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();
    const onMarketplaceListingChanged = () => {
      void loadListings(latestSearchTerm.current, true);
    };
    connection.on('MarketplaceListingChanged', onMarketplaceListingChanged);

    void connection.start()
      .then(async () => {
        // The auth coordinator can redirect while WebSocket negotiation is in flight.
        // Do not join a group for a screen that has already been disposed.
        if (disposed) {
          await connection.stop();
          return;
        }
        await connection.invoke('JoinMarketplace');
      })
      .catch((error) => {
        if (!disposed) {
          console.warn('[Marketplace realtime] Unable to connect:', error);
        }
      });

    return () => {
      disposed = true;
      connection.off('MarketplaceListingChanged', onMarketplaceListingChanged);
      // Calling stop while start() is still negotiating produces SignalR's misleading
      // "Failed to start ... before stop()" error. The start continuation above closes it.
      if (connection.state !== signalR.HubConnectionState.Connecting) {
        void connection.stop().catch(() => {});
      }
    };
  }, [isAuthenticated, loadListings]);

  // Group listings by bundleId to combine bundle/combo packages
  const bundleMap = useMemo(() => {
    const map = new Map<string, ResaleListingDetailDto[]>();
    for (const item of listings) {
      if (item.bundleId) {
        const group = map.get(item.bundleId) || [];
        group.push(item);
        map.set(item.bundleId, group);
      }
    }
    return map;
  }, [listings]);

  // Dedup bundle combos so only 1 representative card is displayed in the list
  const dedupedListings = useMemo(() => {
    const bundleRepresentatives = new Map<string, ResaleListingDetailDto>();
    listings.forEach((item) => {
      if (!item.bundleId || (item.bundleTotalTickets ?? 0) <= 1) return;
      const current = bundleRepresentatives.get(item.bundleId);
      if (!current || (item.listingStatus || '').toLowerCase() === 'transacting') {
        bundleRepresentatives.set(item.bundleId, item);
      }
    });
    return listings
      .filter((item) => {
        if (item.bundleId && (item.bundleTotalTickets ?? 0) > 1) {
          return bundleRepresentatives.get(item.bundleId)?.listingId === item.listingId;
        }
        return true;
      })
      .filter((item) => {
        const bundleItems = item.bundleId ? bundleMap.get(item.bundleId) || [item] : [item];
        const totalPrice =
          bundleItems.length > 1
            ? bundleItems.reduce((sum, b) => sum + (b.resalePrice || 0), 0)
            : item.resalePrice;
        return matchesBand(totalPrice, priceBand);
      });
  }, [listings, priceBand, bundleMap]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings(debouncedKeyword, true);
    setRefreshing(false);
  };

  const resetFilters = () => {
    setPriceBand('ALL');
    setKeyword('');
  };

  const renderListing = ({ item }: { item: ResaleListingDetailDto }) => {
    const bundleItems = item.bundleId ? bundleMap.get(item.bundleId) || [item] : [item];
    // `bundleTotalTickets` is historical package metadata. Once one ticket
    // is sold separately, display and price only the listings still returned
    // by the marketplace query.
    const isBundle = bundleItems.length > 1;
    const bundleCount = bundleItems.length;

    const totalBundleResalePrice =
      isBundle
        ? bundleItems.reduce((sum, b) => sum + (b.resalePrice || 0), 0)
        : item.resalePrice;

    const totalBundleOriginalPrice =
      isBundle
        ? bundleItems.reduce((sum, b) => sum + (b.originalPrice || 0), 0)
        : item.originalPrice;

    const hasDiscount = totalBundleOriginalPrice > totalBundleResalePrice;
    const calculatedDiscountPercent = hasDiscount
      ? Math.round(((totalBundleOriginalPrice - totalBundleResalePrice) / totalBundleOriginalPrice) * 100)
      : 0;
    const discountPercentage =
      item.discountPercentage > 0 ? item.discountPercentage : calculatedDiscountPercent;

    const isOwnListing = Boolean(
      user && (
        (item.sellerId && user.id && item.sellerId.toLowerCase() === user.id.toLowerCase()) ||
        (item.sellerFullName && user.fullName && item.sellerFullName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
        ((item as any).userId && user.id && (item as any).userId.toLowerCase() === user.id.toLowerCase()) ||
        bundleItems.some(
          (b) =>
            (b.sellerId && user.id && b.sellerId.toLowerCase() === user.id.toLowerCase()) ||
            (b.sellerFullName && user.fullName && b.sellerFullName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
            ((b as any).userId && user.id && (b as any).userId.toLowerCase() === user.id.toLowerCase())
        )
      )
    );

    const cleanSeatName = (seat?: string | null) => {
      if (!seat) return 'GA';
      if (!item.tierName) return seat;
      const stripped = seat.replace(new RegExp(`^${item.tierName}\\s*[-–•:]\\s*`, 'i'), '').trim();
      return stripped || seat;
    };

    const isRetailAllowed = isBundle && item.isBundleAllOrNothing === false;
    const isReserved = [item, ...bundleItems].some(
      (listing) => (listing.listingStatus || '').toLowerCase() === 'transacting'
    );

    const seatDisplay = isBundle
      ? bundleItems.length > 1
        ? bundleItems.map((b) => cleanSeatName(b.seatZone)).join(', ')
        : `${cleanSeatName(item.seatZone)} (x${bundleCount})`
      : item.seatZone || 'General Admission';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={isOwnListing || isReserved ? 1 : 0.92}
        disabled={isOwnListing || isReserved}
        onPress={() => {
          if (!isOwnListing && !isReserved) {
            setSelectedListing(item);
            setSelectedBundleItems(bundleItems);
          }
        }}
      >
        <View style={styles.ticketInfoPanel}>
          <View style={styles.ticketTierChip}>
            <View style={styles.ticketTierDot} />
            <Text style={styles.ticketTierText} numberOfLines={1}>{item.tierName || 'General Admission'}</Text>
          </View>
          <Text style={styles.ticketEventName} numberOfLines={2}>{item.eventName}</Text>

          <View style={styles.ticketDetailRow}>
            <Ticket size={13} color={theme.colors.warning} />
            <Text style={styles.ticketDetailEmphasis} numberOfLines={1}>
              {isBundle ? `${bundleCount} tickets${isRetailAllowed ? ' · individual sale' : ' · combo'}` : seatDisplay}
            </Text>
          </View>
          <View style={styles.ticketDetailRow}>
            <Calendar size={13} color={theme.colors.textMuted} />
            <Text style={styles.ticketDetailText} numberOfLines={1}>{formatEventDateTime(item.eventStartAt)}</Text>
          </View>
          <View style={styles.ticketDetailRow}>
            <MapPin size={13} color={theme.colors.textMuted} />
            <Text style={styles.ticketDetailText} numberOfLines={1}>{item.eventVenue}</Text>
          </View>
          <Text style={styles.ticketSellerText} numberOfLines={1}>Seller: {item.sellerFullName || 'Verified seller'}</Text>

          {isReserved && (
            <View style={styles.reservedBadge}>
              <Lock size={11} color={theme.colors.warning} />
              <Text style={styles.reservedBadgeText}>Reserved by another buyer</Text>
            </View>
          )}
        </View>

        <View style={styles.ticketDivider}>
          <View style={styles.ticketNotchTop} />
          <View style={styles.ticketNotchBottom} />
        </View>

        <View style={styles.ticketPricePanel}>
          <Text style={styles.ticketCode} numberOfLines={1}>{item.maskedTicketCode || 'AT********'}</Text>
          <Text style={styles.ticketPriceLabel}>{isBundle ? `Combo (${bundleCount})` : 'Price'}</Text>
          {hasDiscount && <Text style={styles.ticketOriginalPrice}>{formatPrice(totalBundleOriginalPrice)}</Text>}
          <Text style={styles.ticketPriceValue} numberOfLines={1}>{formatPrice(totalBundleResalePrice)}</Text>
          <Text style={styles.ticketPriceCurrency}>VND</Text>
          <View style={[styles.ticketCta, (isOwnListing || isReserved) && styles.ticketCtaDisabled]}>
            {isOwnListing || isReserved ? <Lock size={13} color={theme.colors.textMuted} /> : null}
            <Text style={[styles.ticketCtaText, (isOwnListing || isReserved) && styles.ticketCtaDisabledText]} numberOfLines={1}>
              {isReserved ? 'Reserved' : isOwnListing ? 'Your ticket' : isBundle ? 'Choose' : 'Buy'}
            </Text>
            {!isOwnListing && !isReserved && <ArrowRight size={14} color={theme.colors.onPrimary} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Marketplace</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh listings"
        >
          <RefreshCw size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, artists, venues..."
          placeholderTextColor={theme.colors.textPlaceholder}
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {keyword.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setKeyword('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.priceFilterRow}>
        <TouchableOpacity
          style={[
            styles.priceTriggerPill,
            priceBand !== 'ALL' && styles.priceTriggerPillActive,
          ]}
          onPress={() => setIsPriceModalOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Filter by price"
        >
          <SlidersHorizontal
            size={13}
            color={priceBand !== 'ALL' ? theme.colors.onPrimary : theme.colors.primary}
          />
          <Text
            style={[
              styles.priceTriggerText,
              priceBand !== 'ALL' && styles.priceTriggerTextActive,
            ]}
          >
            {priceBand === 'ALL'
              ? 'Price'
              : PRICE_BANDS.find((b) => b.key === priceBand)?.label || 'Price'}
          </Text>
          <ChevronDown
            size={13}
            color={priceBand !== 'ALL' ? theme.colors.onPrimary : theme.colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.stateText}>Loading marketplace...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <View style={styles.stateIcon}>
            <AlertTriangle size={26} color={theme.colors.danger} />
          </View>
          <Text style={styles.stateTitle}>Unable to load marketplace</Text>
          <Text style={styles.stateText}>{error}</Text>
          <View style={styles.stateAction}>
            <FintechButton
              title="Try Again"
              onPress={() => loadListings(debouncedKeyword)}
              variant="secondary"
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={dedupedListings}
          keyExtractor={(item) => item.listingId}
          renderItem={renderListing}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.resultCount}>
                {dedupedListings.length} {dedupedListings.length === 1 ? 'listing' : 'listings'} available
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <View style={styles.stateIcon}>
                <Ticket size={26} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.stateTitle}>No tickets found</Text>
              <Text style={styles.stateText}>
                Try searching with different keywords or adjust your price filter.
              </Text>
              <View style={styles.stateAction}>
                <FintechButton title="Reset Filters" onPress={resetFilters} variant="secondary" />
              </View>
            </View>
          }
        />
      )}

      {/* Unified Price Filter Modal Sheet */}
      <Modal
        visible={isPriceModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPriceModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filter by Price</Text>
                <Text style={styles.sheetSubtitle}>Show tickets within your budget</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsPriceModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close price filter"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.priceModalOptions}>
              {PRICE_BANDS.map((band) => {
                const isSelected = priceBand === band.key;
                return (
                  <TouchableOpacity
                    key={band.key}
                    style={[
                      styles.priceOptionItem,
                      isSelected && styles.priceOptionItemSelected,
                    ]}
                    onPress={() => {
                      setPriceBand(band.key);
                      setIsPriceModalOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.priceOptionText,
                        isSelected && styles.priceOptionTextSelected,
                      ]}
                    >
                      {band.fullLabel}
                    </Text>
                    {isSelected && (
                      <Check size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {priceBand !== 'ALL' && (
              <View style={{ marginTop: theme.spacing.md }}>
                <FintechButton
                  title="Clear Price Filter"
                  variant="outline"
                  onPress={() => {
                    setPriceBand('ALL');
                    setIsPriceModalOpen(false);
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <BuyTicketBottomSheet
        visible={!!selectedListing}
        listing={selectedListing}
        bundleItems={selectedBundleItems}
        onClose={() => {
          setSelectedListing(null);
          setSelectedBundleItems([]);
        }}
      />
    </SafeAreaView>
  );
}
