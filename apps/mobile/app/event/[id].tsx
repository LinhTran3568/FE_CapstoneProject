import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Check,
  Store,
  ArrowRight,
  Plus,
  Minus,
  AlertTriangle,
  User,
  Mail,
  Phone,
  CheckSquare,
  Square,
  X,
  CheckCircle,
  Ticket,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { FintechInput } from '../../src/components/FintechInput';
import { EventPoster } from '../../src/components/EventPoster';
import {
  eventsApi,
  organizerStoreApi,
  TrendingEventDto,
  OrganizerBackendTier,
  OrganizerCheckoutResponse,
} from '@ticketshield/api-client';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';
import { styles } from '../../src/styles/event-detail.styles';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const eventId = typeof id === 'string' && id ? id : 'atsh-2026';

  const [eventData, setEventData] = useState<TrendingEventDto | null>(null);
  const [tiers, setTiers] = useState<OrganizerBackendTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<OrganizerBackendTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
  }, [user]);

  const loadEventAndTiers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trending = await eventsApi.getTrendingEvents({ limit: 10 });
      const found = trending.find((e) => (e.eventId || e.id) === eventId) || trending[0];
      setEventData(found || null);

      try {
        const remoteTiers = await organizerStoreApi.getEventTiers(eventId, found?.name);
        if (remoteTiers && remoteTiers.length > 0) {
          setTiers(remoteTiers);
          setSelectedTier(remoteTiers[0]);
        }
      } catch (tierErr) {
        console.log('[EventDetailScreen] getEventTiers info:', tierErr);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load event details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventAndTiers();
  }, [loadEventAndTiers]);

  const prefetchSession = useCallback(async (tierId: string) => {
    try {
      const session = await organizerStoreApi.createSession(tierId);
      if (session?.sessionToken) {
        setSessionToken(session.sessionToken);
      }
    } catch (err) {
      console.log('[AntiBot] Session pre-fetch info:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedTier) {
      prefetchSession(selectedTier.id);
    }
  }, [selectedTier, prefetchSession]);

  const handleOpenCheckoutModal = () => {
    if (!selectedTier) return;
    setCheckoutError(null);
    setOrderResult(null);
    setFormErrors({});
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
    prefetchSession(selectedTier.id);
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
    if (!selectedTier) return;
    if (!validateForm()) return;

    setIsBuying(true);
    setCheckoutError(null);

    try {
      let activeSession = sessionToken;
      if (!activeSession) {
        try {
          const freshSession = await organizerStoreApi.createSession(selectedTier.id);
          activeSession = freshSession.sessionToken;
          setSessionToken(activeSession);
        } catch {}
      }

      const res = await organizerStoreApi.checkout({
        tierId: selectedTier.id,
        quantity,
        buyerEmail: buyerEmail.trim(),
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        sessionToken: activeSession || undefined,
      });

      setOrderResult(res);
    } catch (e: any) {
      const message = e instanceof Error ? e.message : 'Unable to complete checkout with organizer.';
      setCheckoutError(message);
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error || !eventData) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={32} color={theme.colors.danger} />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorDesc}>{error || 'The requested event is not available.'}</Text>
        <FintechButton
          title="Back to Home"
          onPress={() => router.replace('/(tabs)')}
          style={styles.retryBtn}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Event Details',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <EventPoster seed={eventData.eventId || eventData.name} height={200} />
          <View style={styles.heroBody}>
            <View style={styles.officialBadge}>
              <ShieldCheck size={13} color={theme.colors.success} />
              <Text style={styles.officialBadgeText}>Official Organizer Event</Text>
            </View>
            <Text style={styles.eventCategory}>
              {eventData.category || eventData.artist || 'CONCERT'}
            </Text>
            <Text style={styles.eventTitle}>{eventData.name}</Text>
            <Text style={styles.organizerName}>
              Organized by {eventData.organizerName || 'Verified Organizer'}
            </Text>

            <View style={styles.metaRow}>
              <Calendar size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>{formatEventDateTime(eventData.eventStartAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>
                {eventData.venue} {eventData.city ? `• ${eventData.city}` : ''}
              </Text>
            </View>
            {eventData.description && (
              <Text style={styles.description}>{eventData.description}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.resaleShortcut}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.85}
        >
          <View style={styles.resaleShortcutIcon}>
            <Store size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.resaleShortcutText}>
            <Text style={styles.resaleShortcutTitle}>Check Secondary Resale Deals</Text>
            <Text style={styles.resaleShortcutSubtitle}>
              Verified fan-to-fan resale tickets backed by escrow
            </Text>
          </View>
          <ArrowRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Select Ticket Tier</Text>
        <View style={styles.tiersContainer}>
          {tiers.map((tier) => {
            const isSelected = selectedTier?.id === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                onPress={() => setSelectedTier(tier)}
                activeOpacity={0.85}
              >
                <View style={styles.tierTop}>
                  <View style={styles.tierNameGroup}>
                    <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                      {tier.tierName}
                    </Text>
                    <Text style={styles.tierZone}>
                      {tier.availableQuantity > 0
                        ? `${tier.availableQuantity} tickets remaining`
                        : 'Available'}
                    </Text>
                  </View>
                  <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
                </View>

                <View style={styles.perksContainer}>
                  <View style={styles.perkRow}>
                    <Check size={13} color={theme.colors.success} />
                    <Text style={styles.perkText}>Guaranteed admission with dynamic QR pass</Text>
                  </View>
                  <View style={styles.perkRow}>
                    <Check size={13} color={theme.colors.success} />
                    <Text style={styles.perkText}>Anti-bot protected official inventory</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quantityCard}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={16} color={quantity <= 1 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.min(4, q + 1))}
              disabled={quantity >= 4}
            >
              <Plus size={16} color={quantity >= 4 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {selectedTier && (
          <View style={styles.checkoutPanel}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total Price ({quantity} ticket{quantity > 1 ? 's' : ''})
              </Text>
              <Text style={styles.totalValue}>{formatPrice(selectedTier.price * quantity)}</Text>
            </View>
            <FintechButton
              title="Checkout & Receive Passes"
              onPress={handleOpenCheckoutModal}
              icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
            />
          </View>
        )}
      </ScrollView>

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
                accessibilityLabel="Close modal"
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
                  <Text style={styles.successTitle}>Passes Ready in Your Wallet!</Text>
                  <Text style={styles.successMessage}>
                    Order #{orderResult.orderId.slice(0, 8)} has been confirmed by the official organizer.
                  </Text>

                  {orderResult.tickets && orderResult.tickets.length > 0 && (
                    <View style={styles.ticketCodesBox}>
                      <Text style={styles.summaryLabel}>YOUR OFFICIAL PASS CODES:</Text>
                      {orderResult.tickets.map((t, idx) => (
                        <View key={t.ticketCode || idx} style={styles.ticketCodeCard}>
                          <View style={styles.ticketCodeBadge}>
                            <Text style={styles.ticketCodeBadgeText}>
                              Pass #{idx + 1} • {t.seatZone || selectedTier?.tierName}
                            </Text>
                          </View>
                          <Text style={styles.ticketCodeValue}>{t.ticketCode}</Text>
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
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tier</Text>
                      <Text style={styles.summaryValue}>
                        {selectedTier?.tierName} × {quantity}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Total Price</Text>
                      <Text style={[styles.summaryValue, { color: theme.colors.primary, fontSize: 16 }]}>
                        {formatPrice((selectedTier?.price || 0) * quantity)}
                      </Text>
                    </View>
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
                    onChangeText={(val) => {
                      setBuyerName(val);
                      if (formErrors.name) setFormErrors((e) => ({ ...e, name: undefined }));
                    }}
                    error={formErrors.name}
                    icon={<User size={18} color={theme.colors.primary} />}
                  />

                  <FintechInput
                    label="Email Address *"
                    placeholder="Enter your email address"
                    value={buyerEmail}
                    onChangeText={(val) => {
                      setBuyerEmail(val);
                      if (formErrors.email) setFormErrors((e) => ({ ...e, email: undefined }));
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
                    onChangeText={(val) => {
                      setBuyerPhone(val);
                      if (formErrors.phone) setFormErrors((e) => ({ ...e, phone: undefined }));
                    }}
                    error={formErrors.phone}
                    keyboardType="phone-pad"
                    icon={<Phone size={18} color={theme.colors.primary} />}
                  />

                  <TouchableOpacity
                    style={styles.termsContainer}
                    onPress={() => {
                      setAgreedTerms(!agreedTerms);
                      if (formErrors.terms) setFormErrors((e) => ({ ...e, terms: undefined }));
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.checkboxBox}>
                      {agreedTerms ? (
                        <CheckSquare size={20} color={theme.colors.primary} />
                      ) : (
                        <Square size={20} color={theme.colors.border} />
                      )}
                    </View>
                    <Text style={styles.termsLabel}>
                      I confirm the attendee details are accurate and agree to the official organizer ticketing terms.
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
    </>
  );
}
