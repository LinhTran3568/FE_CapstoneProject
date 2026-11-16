import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tag,
  UserRound,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Ticket,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Lock,
  Layers,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/stores/authStore';
import type { ResaleListingDetailDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { theme } from '../../src/theme';
import { EventPoster } from '../../src/components/EventPoster';
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

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
    const seenBundleIds = new Set<string>();
    return listings
      .filter((item) => {
        if (item.bundleId && (item.bundleTotalTickets ?? 0) > 1) {
          if (seenBundleIds.has(item.bundleId)) return false;
          seenBundleIds.add(item.bundleId);
        }
        return true;
      })
      .filter((item) => {
        const bundleItems = item.bundleId ? bundleMap.get(item.bundleId) || [item] : [item];
        const totalPrice =
          bundleItems.length > 1
            ? bundleItems.reduce((sum, b) => sum + (b.resalePrice || 0), 0)
            : item.bundleTotalTickets && item.bundleTotalTickets >= 2
              ? item.resalePrice * item.bundleTotalTickets
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
    const isBundle =
      bundleItems.length > 1 ||
      Boolean(item.bundleTotalTickets && item.bundleTotalTickets >= 2) ||
      Boolean(item.bundleId && (item.bundleTotalTickets ?? 0) > 1);

    const bundleCount =
      item.bundleTotalTickets && item.bundleTotalTickets >= 2
        ? item.bundleTotalTickets
        : bundleItems.length;

    const totalBundleResalePrice =
      isBundle && bundleItems.length > 1
        ? bundleItems.reduce((sum, b) => sum + (b.resalePrice || 0), 0)
        : item.bundleTotalTickets && item.bundleTotalTickets >= 2 && bundleItems.length === 1
          ? item.resalePrice * item.bundleTotalTickets
          : item.resalePrice;

    const totalBundleOriginalPrice =
      isBundle && bundleItems.length > 1
        ? bundleItems.reduce((sum, b) => sum + (b.originalPrice || 0), 0)
        : item.bundleTotalTickets && item.bundleTotalTickets >= 2 && bundleItems.length === 1
          ? item.originalPrice * item.bundleTotalTickets
          : item.originalPrice;

    const hasDiscount = totalBundleOriginalPrice > totalBundleResalePrice;
    const calculatedDiscountPercent = hasDiscount
      ? Math.round(((totalBundleOriginalPrice - totalBundleResalePrice) / totalBundleOriginalPrice) * 100)
      : 0;
    const discountPercentage =
      item.discountPercentage > 0 ? item.discountPercentage : calculatedDiscountPercent;

    const perTicketPrice = Math.round(totalBundleResalePrice / (bundleCount || 1));

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

    const minTicketPrice =
      isBundle && bundleItems.length > 1
        ? Math.min(...bundleItems.map((b) => b.resalePrice || 0))
        : item.resalePrice;

    const seatDisplay = isBundle
      ? bundleItems.length > 1
        ? bundleItems.map((b) => cleanSeatName(b.seatZone)).join(', ')
        : `${cleanSeatName(item.seatZone)} (x${bundleCount})`
      : item.seatZone || 'General Admission';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={isOwnListing ? 1 : 0.92}
        disabled={isOwnListing}
        onPress={() => {
          if (!isOwnListing) {
            setSelectedListing(item);
            setSelectedBundleItems(bundleItems);
          }
        }}
      >
        <View style={styles.posterWrap}>
          <EventPoster seed={`${item.eventId}-${item.listingId}`} height={148} />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.organizer} numberOfLines={1}>
            {item.organizerName || 'Verified Organizer'}
          </Text>
          <Text style={styles.eventName} numberOfLines={2}>
            {item.eventName}
          </Text>

          <View style={styles.metaRow}>
            <Calendar size={14} color={theme.colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatEventDateTime(item.eventStartAt)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={14} color={theme.colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.eventVenue}
            </Text>
          </View>

          {isBundle && bundleItems.length > 1 ? (
            <View style={styles.cardBundleList}>
              <View style={styles.cardBundleHeader}>
                <Text style={styles.cardBundleTitle}>
                  {isRetailAllowed ? 'Tickets Available (Sold Separately)' : `Combo Package (${bundleCount} Tickets)`}
                </Text>
              </View>
              {bundleItems.map((b, idx) => (
                <View key={b.listingId || idx} style={styles.cardBundleItemRow}>
                  <View style={styles.cardBundleItemLeft}>
                    <View>
                      <Text style={styles.cardBundleSeatText} numberOfLines={1}>
                        {cleanSeatName(b.seatZone)}
                      </Text>
                      <Text style={styles.cardBundleTierText}>
                        {b.tierName}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardBundlePriceText}>
                    {formatPrice(b.resalePrice)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.seatRow}>
              <View style={styles.seatChip}>
                <Text style={styles.seatLabel}>Tier</Text>
                <Text style={styles.seatValue} numberOfLines={1}>
                  {item.tierName}
                </Text>
              </View>
              <View style={styles.seatDivider} />
              <View style={[styles.seatChip, isBundle && { flex: 1.4 }]}>
                <Text style={styles.seatLabel}>
                  {isBundle ? `Seats (${bundleCount})` : 'Zone / Seat'}
                </Text>
                <Text style={styles.seatValue} numberOfLines={2}>
                  {seatDisplay}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.priceRow}>
            <View style={styles.sellerRow}>
              <UserRound size={14} color={theme.colors.textMuted} />
              <Text style={styles.sellerName} numberOfLines={1}>
                {item.sellerFullName}
              </Text>
            </View>
            <View style={styles.priceBlock}>
              {hasDiscount && (
                <Text style={styles.originalPrice}>{formatPrice(totalBundleOriginalPrice)}</Text>
              )}
              <Text style={styles.resalePrice}>{formatPrice(totalBundleResalePrice)}</Text>
              {isBundle && (
                <Text style={styles.perTicketPrice}>
                  {isRetailAllowed
                    ? `(from ${formatPrice(minTicketPrice)}/ticket)`
                    : `(${formatPrice(perTicketPrice)}/ticket)`}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.cardCta, isOwnListing && styles.cardCtaDisabled]}>
            <Text style={[styles.cardCtaText, isOwnListing && styles.cardCtaDisabledText]}>
              {isRetailAllowed
                ? `Select Tickets (from ${formatPrice(minTicketPrice)})`
                : isBundle
                  ? `Buy Combo (${bundleCount} Tickets)`
                  : 'Buy Ticket'}
            </Text>
            {isOwnListing ? (
              <Lock size={15} color={theme.colors.textMuted} />
            ) : (
              <ArrowRight size={16} color={theme.colors.primary} />
            )}
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
