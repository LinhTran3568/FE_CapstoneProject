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
  ShieldCheck,
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
} from 'lucide-react-native';
import { useAuthStore } from '../../src/stores/authStore';
import type { ResaleListingDetailDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { theme } from '../../src/theme';
import { EventPoster } from '../../src/components/EventPoster';
import { FintechButton } from '../../src/components/FintechButton';
import { CategoryFilterBar } from '../../src/components/CategoryFilterBar';
import { FairPriceBadge } from '../../src/components/FairPriceBadge';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [listings, setListings] = useState<ResaleListingDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedListing, setSelectedListing] = useState<ResaleListingDetailDto | null>(null);

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

  
  const inferCategory = (eventName: string, organizer?: string): string => {
    const text = `${eventName} ${organizer || ''}`.toLowerCase();
    if (/derby|bóng đá|match|tournament|sport|clb|v-league|football|cúp/i.test(text)) return 'SPORTS';
    if (/festival|edm|rave|ravolution|music festival/i.test(text)) return 'FESTIVAL';
    if (/kịch|theater|thể nghiệm|sân khấu|play|opera|vở kịch/i.test(text)) return 'THEATER';
    if (/workshop|hội thảo|seminar|talk|masterclass|chia sẻ/i.test(text)) return 'WORKSHOP';
    return 'CONCERT';
  };

  const matchesCategory = (listing: ResaleListingDetailDto, category: string): boolean => {
    if (category === 'ALL') return true;
    const cat = (listing as any).category
      ? String((listing as any).category).toUpperCase()
      : inferCategory(listing.eventName, listing.organizerName);
    return cat === category;
  };

  const filteredListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          matchesBand(listing.resalePrice, priceBand) &&
          matchesCategory(listing, selectedCategory)
      ),
    [listings, priceBand, selectedCategory]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings(debouncedKeyword, true);
    setRefreshing(false);
  };

  const resetFilters = () => {
    setPriceBand('ALL');
    setSelectedCategory('ALL');
    setKeyword('');
  };



  const renderListing = ({ item }: { item: ResaleListingDetailDto }) => {
    const hasDiscount = item.discountPercentage > 0;
    const isOwnListing = Boolean(
      user && (
        (item.sellerId && user.id && item.sellerId.toLowerCase() === user.id.toLowerCase()) ||
        (item.sellerFullName && user.fullName && item.sellerFullName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
        ((item as any).userId && user.id && (item as any).userId.toLowerCase() === user.id.toLowerCase())
      )
    );

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={isOwnListing ? 1 : 0.92}
        disabled={isOwnListing}
        onPress={() => !isOwnListing && setSelectedListing(item)}
      >
        <View style={styles.posterWrap}>
          <EventPoster seed={`${item.eventId}-${item.listingId}`} height={148} />
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={theme.colors.success} />
              <Text style={styles.verifiedBadgeText}>VERIFIED ESCROW</Text>
            </View>
            <FairPriceBadge
              resalePrice={item.resalePrice}
              originalPrice={item.originalPrice}
              discountPercentage={item.discountPercentage}
            />
          </View>
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

          <View style={styles.seatRow}>
            <View style={styles.seatChip}>
              <Text style={styles.seatLabel}>Tier</Text>
              <Text style={styles.seatValue} numberOfLines={1}>
                {item.tierName}
              </Text>
            </View>
            <View style={styles.seatDivider} />
            <View style={styles.seatChip}>
              <Text style={styles.seatLabel}>Zone / Seat</Text>
              <Text style={styles.seatValue} numberOfLines={1}>
                {item.seatZone || 'General Admission'}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.sellerRow}>
              <UserRound size={14} color={theme.colors.textMuted} />
              <Text style={styles.sellerName} numberOfLines={1}>
                {item.sellerFullName}
              </Text>
            </View>
            <View style={styles.priceBlock}>
              {hasDiscount && (
                <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
              )}
              <Text style={styles.resalePrice}>{formatPrice(item.resalePrice)}</Text>
            </View>
          </View>

          <View style={[styles.cardCta, isOwnListing && styles.cardCtaDisabled]}>
            <Text style={[styles.cardCtaText, isOwnListing && styles.cardCtaDisabledText]}>
              Buy Ticket
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
          <Text style={styles.subtitle}>Verified fan-to-fan resale tickets backed by escrow</Text>
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

            <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        prependNode={
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
        }
      />

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
          data={filteredListings}
          keyExtractor={(item) => item.listingId}
          renderItem={renderListing}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.resultCount}>
                {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} available
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
        onClose={() => setSelectedListing(null)}
      />
    </SafeAreaView>
  );
}
