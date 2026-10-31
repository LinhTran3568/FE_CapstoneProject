import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  ShieldCheck,
  Calendar,
  MapPin,
  Tag,
  Clock,
  CheckCircle2,
  ArrowRight,
  UserRound,
  AlertTriangle,
  RefreshCw,
  Ticket,
} from 'lucide-react-native';
import type { ResaleListingDetailDto, HoldListingForPurchaseResponse } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { theme } from '../../src/theme';
import { fontFamilies } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/authStore';
import { EventPoster } from '../../src/components/EventPoster';
import { FintechButton } from '../../src/components/FintechButton';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';

type PriceBand = 'ALL' | 'UNDER_1M' | 'FROM_1M_TO_2M' | 'OVER_2M';

const PRICE_BANDS: { key: PriceBand; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'UNDER_1M', label: '< 1M ₫' },
  { key: 'FROM_1M_TO_2M', label: '1M – 2M ₫' },
  { key: 'OVER_2M', label: '> 2M ₫' },
];

function matchesBand(price: number, band: PriceBand): boolean {
  if (band === 'UNDER_1M') return price < 1_000_000;
  if (band === 'FROM_1M_TO_2M') return price >= 1_000_000 && price <= 2_000_000;
  if (band === 'OVER_2M') return price > 2_000_000;
  return true;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [priceBand, setPriceBand] = useState<PriceBand>('ALL');
  const [listings, setListings] = useState<ResaleListingDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedListing, setSelectedListing] = useState<ResaleListingDetailDto | null>(null);
  const [holdData, setHoldData] = useState<HoldListingForPurchaseResponse | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isCheckingTransfer, setIsCheckingTransfer] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

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
        err instanceof Error ? err.message : 'Unable to load marketplace. Please try again.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(debouncedKeyword);
  }, [debouncedKeyword, loadListings]);

  useEffect(() => {
    if (!holdData?.unlockAt) {
      setSecondsLeft(0);
      return;
    }
    const deadline = new Date(holdData.unlockAt).getTime();
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [holdData?.unlockAt]);

  const filteredListings = useMemo(
    () => listings.filter((listing) => matchesBand(listing.resalePrice, priceBand)),
    [listings, priceBand]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings(debouncedKeyword, true);
    setRefreshing(false);
  };

  const resetFilters = () => {
    setPriceBand('ALL');
    setKeyword('');
  };

  const closeModal = () => {
    if (isCheckingTransfer || isHolding) return;
    setSelectedListing(null);
    setHoldData(null);
    setPurchaseSuccess(false);
    setPaymentNote(null);
  };

  const buyerInfo = {
    fullName: user?.fullName || 'TicketShield Buyer',
    email: user?.email || 'buyer@ticketshield.vn',
    phone: user?.phoneNumber || '0900000000',
  };

  const handleStartPurchase = async () => {
    if (!selectedListing) return;
    setIsHolding(true);
    setPaymentNote(null);
    try {
      const hold = await resaleListingsApi.holdListing(selectedListing.listingId, {
        recipientName: buyerInfo.fullName,
        recipientEmail: buyerInfo.email,
      });
      setHoldData(hold);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to reserve ticket right now. Please try again.';
      setPaymentNote(message);
    } finally {
      setIsHolding(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedListing || !holdData) return;
    setIsCheckingTransfer(true);
    setPaymentNote(null);
    try {
      const status = await resaleListingsApi.getPaymentStatus(selectedListing.listingId);
      const escrowStatus = status?.escrowStatus?.toLowerCase();
      const listingStatus = status?.listingStatus?.toLowerCase();
      const hasFunds =
        escrowStatus === 'funded' ||
        escrowStatus === 'released' ||
        listingStatus === 'transacting' ||
        listingStatus === 'sold';

      if (!hasFunds) {
        setPaymentNote(
          'Payment not detected yet. Please ensure the exact reference was included in your transfer and retry in a moment.'
        );
        return;
      }

      setPurchaseSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to confirm payment. Please try again.';
      setPaymentNote(message);
    } finally {
      setIsCheckingTransfer(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!selectedListing || !holdData) return;
    setIsCheckingTransfer(true);
    try {
      try {
        await resaleListingsApi.simulatePaymentSuccess(selectedListing.listingId);
      } catch {
        await resaleListingsApi.simulatePaymentWebhook(
          holdData.paymentReference,
          holdData.totalBuyerPaid
        );
      }
      setPurchaseSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment simulation failed.';
      setPaymentNote(message);
    } finally {
      setIsCheckingTransfer(false);
    }
  };

  const renderListing = ({ item }: { item: ResaleListingDetailDto }) => {
    const hasDiscount = item.discountPercentage > 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => {
          setSelectedListing(item);
          setHoldData(null);
          setPurchaseSuccess(false);
          setPaymentNote(null);
        }}
      >
        <View style={styles.posterWrap}>
          <EventPoster seed={`${item.eventId}-${item.listingId}`} height={148} />
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color={theme.colors.success} />
              <Text style={styles.verifiedBadgeText}>VERIFIED ESCROW</Text>
            </View>
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Tag size={12} color={theme.colors.onPrimary} />
                <Text style={styles.discountBadgeText}>
                  -{Math.round(item.discountPercentage)}%
                </Text>
              </View>
            )}
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

          <View style={styles.cardCta}>
            <Text style={styles.cardCtaText}>Buy with Escrow</Text>
            <ArrowRight size={16} color={theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Verified fan-to-fan resale tickets</Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersRow}
      >
        {PRICE_BANDS.map((band) => {
          const active = priceBand === band.key;
          return (
            <TouchableOpacity
              key={band.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setPriceBand(band.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {band.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
              <View style={styles.notice}>
                <ShieldCheck size={18} color={theme.colors.success} />
                <Text style={styles.noticeText}>
                  Seller only receives payment after your ticket is scanned at the venue.
                </Text>
              </View>
              <Text style={styles.resultCount}>{filteredListings.length} listings available</Text>
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

      <Modal
        visible={!!selectedListing}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {purchaseSuccess
                  ? 'Purchase Complete'
                  : holdData
                    ? 'Escrow Payment'
                    : 'Ticket Details'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!selectedListing ? null : purchaseSuccess ? (
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <CheckCircle2 size={38} color={theme.colors.success} />
                </View>
                <Text style={styles.successTitle}>Ticket Added to Your Wallet</Text>
                <Text style={styles.successText}>
                  Escrow is securely holding the funds. They will only be released to the seller after your check-in at the venue.
                </Text>
                <FintechButton
                  title="View My Tickets"
                  onPress={() => {
                    closeModal();
                    router.push('/(tabs)/tickets');
                  }}
                />
                <View style={styles.successSecondary}>
                  <FintechButton title="Close" onPress={closeModal} variant="outline" />
                </View>
              </View>
            ) : (
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sheetEventRow}>
                  <EventPoster
                    seed={`${selectedListing.eventId}-${selectedListing.listingId}`}
                    height={72}
                    style={styles.sheetPoster}
                    rounded
                  />
                  <View style={styles.sheetEventInfo}>
                    <Text style={styles.sheetEventName} numberOfLines={2}>
                      {selectedListing.eventName}
                    </Text>
                    <Text style={styles.sheetEventMeta} numberOfLines={1}>
                      {selectedListing.tierName} • {selectedListing.seatZone || 'General Admission'}
                    </Text>
                    <Text style={styles.sheetEventMeta} numberOfLines={1}>
                      {formatEventDateTime(selectedListing.eventStartAt)}
                    </Text>
                  </View>
                </View>

                {!holdData ? (
                  <>
                    <View style={styles.pricePanel}>
                      <View style={styles.pricePanelRow}>
                        <Text style={styles.pricePanelLabel}>Listing Price</Text>
                        <Text style={styles.pricePanelValue}>
                          {formatPrice(selectedListing.resalePrice)}
                        </Text>
                      </View>
                      <View style={styles.pricePanelRow}>
                        <Text style={styles.pricePanelLabel}>Escrow Protection Fee (3%)</Text>
                        <Text style={styles.pricePanelValue}>
                          {formatPrice(Math.round(selectedListing.resalePrice * 0.03))}
                        </Text>
                      </View>
                      <View style={styles.pricePanelDivider} />
                      <View style={styles.pricePanelRow}>
                        <Text style={styles.pricePanelTotal}>Total Amount</Text>
                        <Text style={styles.pricePanelTotalValue}>
                          {formatPrice(Math.round(selectedListing.resalePrice * 1.03))}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sheetNote}>
                      <ShieldCheck size={16} color={theme.colors.success} />
                      <Text style={styles.sheetNoteText}>
                        This ticket will be reserved exclusively for you for 10 minutes.
                      </Text>
                    </View>

                    {paymentNote && (
                      <View style={styles.errorNote}>
                        <AlertTriangle size={16} color={theme.colors.danger} />
                        <Text style={styles.errorNoteText}>{paymentNote}</Text>
                      </View>
                    )}

                    <FintechButton
                      title={isHolding ? 'Reserving Ticket...' : 'Reserve & Proceed to Payment'}
                      onPress={handleStartPurchase}
                      loading={isHolding}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.countdownRow}>
                      <View style={styles.countdownBadge}>
                        <Clock size={14} color={theme.colors.warning} />
                        <Text style={styles.countdownText}>
                          {secondsLeft > 0
                            ? `Held for ${formatCountdown(secondsLeft)}`
                            : 'Hold Expired'}
                        </Text>
                      </View>
                      <Text style={styles.countdownHint}>Scan VietQR or Bank Transfer</Text>
                    </View>

                    <View style={styles.qrCard}>
                      <Image
                        source={{ uri: holdData.qrImageUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrHint}>Open your banking app and scan VietQR</Text>
                    </View>

                    <View style={styles.bankPanel}>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Bank</Text>
                        <Text style={styles.bankValue}>BIN {holdData.bankBin}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Number</Text>
                        <Text style={styles.bankValue}>{holdData.accountNumber}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Holder</Text>
                        <Text style={styles.bankValue} numberOfLines={1}>
                          {holdData.accountName}
                        </Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Amount</Text>
                        <Text style={styles.bankAmount}>{formatPrice(holdData.totalBuyerPaid)}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Reference</Text>
                        <Text style={styles.bankReference}>{holdData.paymentReference}</Text>
                      </View>
                    </View>

                    {secondsLeft === 0 && (
                      <View style={styles.errorNote}>
                        <Clock size={16} color={theme.colors.danger} />
                        <Text style={styles.errorNoteText}>
                          Hold session expired. Close and reserve again to generate a new payment code.
                        </Text>
                      </View>
                    )}

                    {paymentNote && (
                      <View style={styles.errorNote}>
                        <AlertTriangle size={16} color={theme.colors.danger} />
                        <Text style={styles.errorNoteText}>{paymentNote}</Text>
                      </View>
                    )}

                    <FintechButton
                      title={
                        isCheckingTransfer ? 'Verifying Transfer...' : 'I Have Transferred'
                      }
                      onPress={handleConfirmTransfer}
                      loading={isCheckingTransfer}
                      disabled={secondsLeft === 0}
                    />

                    {secondsLeft === 0 && (
                      <View style={styles.successSecondary}>
                        <FintechButton
                          title="Choose Another Ticket"
                          onPress={closeModal}
                          variant="outline"
                        />
                      </View>
                    )}

                    {__DEV__ && (
                      <View style={styles.devBox}>
                        <FintechButton
                          title="Simulate Payment Success"
                          onPress={handleSimulatePayment}
                          variant="success"
                          disabled={isCheckingTransfer}
                        />
                        <Text style={styles.devHint}>
                          Developer button for testing escrow settlement flow.
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    width: theme.layout.tapTarget,
    height: theme.layout.tapTarget,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    minHeight: theme.layout.controlHeight,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.regular,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.spacing.sm,
  },
  filtersScroll: {
    marginTop: theme.spacing.md,
    maxHeight: 46,
  },
  filtersRow: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.semibold,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  listHeader: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
  },
  noticeText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  resultCount: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  posterWrap: {
    position: 'relative',
  },
  badgeRow: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.badgeScrim,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.onPrimary,
  },
  cardBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  organizer: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontFamily: fontFamilies.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  metaText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  seatChip: {
    flex: 1,
  },
  seatLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  seatValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  seatDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.borderSubtle,
    marginHorizontal: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sellerName: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    flex: 1,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  resalePrice: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.md,
    paddingVertical: 10,
    marginTop: theme.spacing.sm,
  },
  cardCtaText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  stateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  stateText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stateAction: {
    marginTop: theme.spacing.sm,
    width: '100%',
    maxWidth: 240,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii['2xl'],
    borderTopRightRadius: theme.radii['2xl'],
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  sheetScroll: {
    maxHeight: 520,
  },
  sheetScrollContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  sheetEventRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  sheetPoster: {
    width: 64,
  },
  sheetEventInfo: {
    flex: 1,
    gap: 2,
  },
  sheetEventName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  sheetEventMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  pricePanel: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  pricePanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricePanelLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  pricePanelValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontFamily: fontFamilies.semibold,
  },
  pricePanelDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 2,
  },
  pricePanelTotal: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  pricePanelTotalValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  sheetNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  sheetNoteText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  errorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  errorNoteText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
  },
  countdownText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.warning,
  },
  countdownHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrHint: {
    fontSize: theme.typography.sizes.xs,
    color: '#333333',
    marginTop: 8,
    fontWeight: theme.typography.weights.medium,
  },
  bankPanel: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  bankValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  bankAmount: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  bankReference: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.accent,
    fontWeight: theme.typography.weights.bold,
  },
  successBox: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  successSecondary: {
    width: '100%',
    marginTop: theme.spacing.xs,
  },
  devBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 6,
  },
  devHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
