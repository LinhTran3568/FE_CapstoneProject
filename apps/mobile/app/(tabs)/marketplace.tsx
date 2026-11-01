import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
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
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react-native';
import type { ResaleListingDetailDto, HoldListingForPurchaseResponse } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { EventPoster } from '../../src/components/EventPoster';
import { FintechButton } from '../../src/components/FintechButton';
import { CategoryFilterBar } from '../../src/components/CategoryFilterBar';
import { FairPriceBadge } from '../../src/components/FairPriceBadge';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  useEffect(() => {
    if (!holdData || purchaseSuccess || secondsLeft === 0) return;

    let isPolling = true;
    const pollInterval = setInterval(async () => {
      if (!isPolling) return;
      try {
        const status = await resaleListingsApi.getPaymentStatus(holdData.listingId);
        const escrowStatus = status?.escrowStatus?.toLowerCase();
        const listingStatus = status?.listingStatus?.toLowerCase();
        const hasFunds =
          escrowStatus === 'funded' ||
          escrowStatus === 'released' ||
          listingStatus === 'transacting' ||
          listingStatus === 'sold';

        if (hasFunds && isPolling) {
          isPolling = false;
          clearInterval(pollInterval);
          setPurchaseSuccess(true);
        }
      } catch {}
    }, 3000);

    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [holdData, purchaseSuccess, secondsLeft]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  
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

  const closeModal = () => {
    if (isCheckingTransfer || isHolding) return;
    setSelectedListing(null);
    setHoldData(null);
    setPurchaseSuccess(false);
    setPaymentNote(null);
    setCopiedField(null);
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
        err instanceof Error
          ? err.message
          : 'This ticket is currently held or in transaction. Please try again shortly.';
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
          'Payment not detected yet. Please ensure the exact reference is included in your transfer and retry in a moment.'
        );
        return;
      }

      setPurchaseSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to check payment status. Please try again.';
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
          setCopiedField(null);
        }}
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

          <View style={styles.cardCta}>
            <Text style={styles.cardCtaText}>Buy Ticket</Text>
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
                    ? 'VietQR Escrow Payment'
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
                  Escrow is securely holding the funds. Ticket ownership has been transferred to your account.
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

                    {paymentNote && (
                      <View style={styles.errorNote}>
                        <AlertTriangle size={16} color={theme.colors.danger} />
                        <Text style={styles.errorNoteText}>{paymentNote}</Text>
                      </View>
                    )}

                    <FintechButton
                      title={isHolding ? 'Reserving Ticket...' : 'Reserve Ticket (5-Min Hold)'}
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

                    {holdData.quickLinkUrl ? (
                      <TouchableOpacity
                        style={styles.oneTouchBtn}
                        onPress={() => Linking.openURL(holdData.quickLinkUrl)}
                        activeOpacity={0.85}
                      >
                        <ExternalLink size={16} color="#ffffff" />
                        <Text style={styles.oneTouchBtnText}>
                          Open Banking App (VietQR One-Touch)
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.bankPanel}>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Bank</Text>
                        <Text style={styles.bankValue}>BIN {holdData.bankBin}</Text>
                      </View>

                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Number</Text>
                        <View style={styles.bankRowValueGroup}>
                          <Text style={styles.bankValue}>{holdData.accountNumber}</Text>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => copyToClipboard(holdData.accountNumber, 'accountNumber')}
                            activeOpacity={0.7}
                          >
                            {copiedField === 'accountNumber' ? (
                              <>
                                <Check size={12} color={theme.colors.success} />
                                <Text style={[styles.copyBtnText, { color: theme.colors.success }]}>
                                  Copied
                                </Text>
                              </>
                            ) : (
                              <>
                                <Copy size={12} color={theme.colors.primary} />
                                <Text style={styles.copyBtnText}>Copy</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Account Holder</Text>
                        <Text style={styles.bankValue} numberOfLines={1}>
                          {holdData.accountName}
                        </Text>
                      </View>

                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Amount</Text>
                        <View style={styles.bankRowValueGroup}>
                          <Text style={styles.bankAmount}>{formatPrice(holdData.totalBuyerPaid)}</Text>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => copyToClipboard(String(holdData.totalBuyerPaid), 'amount')}
                            activeOpacity={0.7}
                          >
                            {copiedField === 'amount' ? (
                              <>
                                <Check size={12} color={theme.colors.success} />
                                <Text style={[styles.copyBtnText, { color: theme.colors.success }]}>
                                  Copied
                                </Text>
                              </>
                            ) : (
                              <>
                                <Copy size={12} color={theme.colors.primary} />
                                <Text style={styles.copyBtnText}>Copy</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Reference</Text>
                        <View style={styles.bankRowValueGroup}>
                          <Text style={styles.bankReference}>{holdData.paymentReference}</Text>
                          <TouchableOpacity
                            style={styles.copyBtn}
                            onPress={() => copyToClipboard(holdData.paymentReference, 'reference')}
                            activeOpacity={0.7}
                          >
                            {copiedField === 'reference' ? (
                              <>
                                <Check size={12} color={theme.colors.success} />
                                <Text style={[styles.copyBtnText, { color: theme.colors.success }]}>
                                  Copied
                                </Text>
                              </>
                            ) : (
                              <>
                                <Copy size={12} color={theme.colors.primary} />
                                <Text style={styles.copyBtnText}>Copy</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={styles.autoPollingBox}>
                      <ActivityIndicator size="small" color={theme.colors.success} />
                      <Text style={styles.autoPollingText}>
                        Listening for bank transfer. Your ticket will be automatically transferred to your wallet upon payment confirmation.
                      </Text>
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
