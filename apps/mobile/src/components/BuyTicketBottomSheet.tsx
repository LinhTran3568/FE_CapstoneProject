import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import type { ResaleListingDetailDto, HoldListingForPurchaseResponse } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { Text } from './AppText';
import { EventPoster } from './EventPoster';
import { FintechButton } from './FintechButton';
import { FintechInput } from './FintechInput';
import { useAuthStore } from '../stores/authStore';
import { theme } from '../theme';
import {
  formatCountdown,
  formatEventDateTime,
  formatPrice,
  initialsOf,
} from '../utils/format';
import { styles } from './BuyTicketBottomSheet.styles';

export interface BuyTicketBottomSheetProps {
  visible: boolean;
  listing: ResaleListingDetailDto | null;
  onClose: () => void;
  onSuccess?: (orderData?: any) => void;
}

const DEFAULT_HOLD_DURATION_SECONDS = 600; // 10-minute escrow hold

export const BuyTicketBottomSheet: React.FC<BuyTicketBottomSheetProps> = ({
  visible,
  listing,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  // Recipient form state
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phoneNumber || '');
  const [recipientIdCard, setRecipientIdCard] = useState('');
  const [showIdCard, setShowIdCard] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  // Hold transaction state
  const [isHolding, setIsHolding] = useState(false);
  const [holdData, setHoldData] = useState<HoldListingForPurchaseResponse | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);

  // 5-minute countdown timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_HOLD_DURATION_SECONDS);
  const [initialDuration, setInitialDuration] = useState<number>(DEFAULT_HOLD_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verification & status state (FE-MOB-9.3.4 ready)
  const [isCheckingTransfer, setIsCheckingTransfer] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Synchronize user profile when logged in
  useEffect(() => {
    if (user) {
      if (!recipientName && user.fullName) setRecipientName(user.fullName);
      if (!recipientEmail && user.email) setRecipientEmail(user.email);
      if (!recipientPhone && user.phoneNumber) setRecipientPhone(user.phoneNumber);
    }
  }, [user]);

  // Reset all state when modal opens or closes
  useEffect(() => {
    if (visible && listing) {
      setHoldData(null);
      setHoldError(null);
      setPurchaseSuccess(false);
      setCopiedField(null);
      setFormErrors({});
      if (user) {
        setRecipientName(user.fullName || '');
        setRecipientEmail(user.email || '');
        setRecipientPhone(user.phoneNumber || '');
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [visible, listing, user]);

  // Setup 5-minute countdown timer when holdData is established
  useEffect(() => {
    if (!holdData) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const duration = holdData.holdDurationSeconds || DEFAULT_HOLD_DURATION_SECONDS;
    setInitialDuration(duration);

    const unlockTime = holdData.unlockAt
      ? new Date(holdData.unlockAt).getTime()
      : Date.now() + duration * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((unlockTime - now) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [holdData]);

  // Price calculations
  const escrowFee = useMemo(() => {
    if (!listing) return 0;
    return Math.round(listing.resalePrice * 0.03);
  }, [listing]);

  const totalAmount = useMemo(() => {
    if (!listing) return 0;
    return listing.resalePrice + escrowFee;
  }, [listing, escrowFee]);

  const isOwner = Boolean(user?.id && listing && (listing.sellerId === user.id || (listing as any).userId === user.id));

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!recipientName.trim()) {
      errors.name = 'Please enter recipient full name';
    } else if (recipientName.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail.trim()) {
      errors.email = 'Please enter recipient email';
    } else if (!emailRegex.test(recipientEmail.trim())) {
      errors.email = 'Invalid email address (e.g. name@domain.com)';
    }

    const digits = recipientPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!recipientPhone.trim()) {
      errors.phone = 'Please enter recipient phone number';
    } else if (!phoneRegex.test(digits)) {
      errors.phone = 'Invalid phone number (must be 10 digits)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Submit recipient info and trigger 5-minute hold
  const handleHoldListing = async () => {
    if (!listing) return;

    if (isOwner) {
      setHoldError('You cannot purchase your own resale listing.');
      return;
    }

    if (!validateForm()) return;

    setIsHolding(true);
    setHoldError(null);

    try {
      const response = await resaleListingsApi.holdListing(listing.listingId, {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        recipientIdCard: recipientIdCard.trim() || undefined,
      });

      setHoldData(response);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'This ticket is currently held or in transaction. Please try again shortly.';
      setHoldError(message);
    } finally {
      setIsHolding(false);
    }
  };

  // Copy helper with visual feedback
  const copyToClipboard = async (text: string, fieldKey: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Step 2: Payment verification (FE-MOB-9.3.4)
  const handleConfirmTransfer = async () => {
    if (!listing || !holdData) return;
    setIsCheckingTransfer(true);
    setHoldError(null);

    try {
      const status = await resaleListingsApi.getPaymentStatus(listing.listingId);
      const escrowStatus = status?.escrowStatus?.toLowerCase();
      const listingStatus = status?.listingStatus?.toLowerCase();

      const hasFunds =
        escrowStatus === 'funded' ||
        escrowStatus === 'released' ||
        listingStatus === 'transacting' ||
        listingStatus === 'sold';

      if (!hasFunds) {
        setHoldError(
          'Payment not detected yet. Please ensure the exact reference is included in your transfer and retry in a moment.'
        );
        return;
      }

      setPurchaseSuccess(true);
      onSuccess?.({
        orderId: holdData.paymentReference || `TS-${listing.listingId.substring(0, 8)}`,
        listing,
        escrowId: holdData.escrowId,
        paymentReference: holdData.paymentReference,
        totalBuyerPaid: holdData.totalBuyerPaid,
        recipientName,
        recipientEmail,
        recipientPhone,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to check payment status. Please try again.';
      setHoldError(message);
    } finally {
      setIsCheckingTransfer(false);
    }
  };

  // Developer simulation helper for test suites and demos
  const handleSimulatePayment = async () => {
    if (!listing || !holdData) return;
    setIsCheckingTransfer(true);
    try {
      try {
        await resaleListingsApi.simulatePaymentSuccess(listing.listingId);
      } catch {
        await resaleListingsApi.simulatePaymentWebhook(
          holdData.paymentReference,
          holdData.totalBuyerPaid
        );
      }
      setPurchaseSuccess(true);
      onSuccess?.({
        orderId: holdData.paymentReference,
        listing,
        escrowId: holdData.escrowId,
        paymentReference: holdData.paymentReference,
        totalBuyerPaid: holdData.totalBuyerPaid,
        recipientName,
        recipientEmail,
        recipientPhone,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment simulation failed.';
      setHoldError(message);
    } finally {
      setIsCheckingTransfer(false);
    }
  };

  // Safely release hold if user closes while ticket is locked
  const handleClose = async () => {
    if (isCheckingTransfer || isHolding) return;
    if (holdData && !purchaseSuccess && secondsLeft > 0 && listing) {
      try {
        await resaleListingsApi.releaseHold(listing.listingId);
      } catch {}
    }
    onClose();
  };

  const handleNavigateToWallet = () => {
    onClose();
    router.push('/(tabs)/tickets');
  };

  if (!listing) return null;

  const isUrgentTimer = secondsLeft > 0 && secondsLeft <= 60;
  const progressRatio = Math.max(0, Math.min(1, secondsLeft / initialDuration));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <ShieldCheck size={18} color={theme.colors.success} />
                <Text style={styles.sheetTitle}>
                  {purchaseSuccess
                    ? 'Purchase Complete'
                    : holdData
                      ? 'VietQR Escrow Payment'
                      : 'Buy Ticket'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {purchaseSuccess ? (
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <CheckCircle2 size={38} color={theme.colors.success} />
                </View>
                <Text style={styles.successTitle}>Ticket Added to Your Wallet</Text>
                <Text style={styles.successText}>
                  Escrow is securely holding the funds. Ticket ownership has been transferred to {recipientName}.
                </Text>
                <FintechButton
                  title="View My Tickets"
                  onPress={handleNavigateToWallet}
                />
                <View style={styles.successSecondary}>
                  <FintechButton title="Close" onPress={onClose} variant="outline" />
                </View>
              </View>
            ) : (
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Event Summary Row */}
                <View style={styles.sheetEventRow}>
                  <EventPoster
                    seed={`${listing.eventId}-${listing.listingId}`}
                    height={72}
                    style={styles.sheetPoster}
                    rounded
                  />
                  <View style={styles.sheetEventInfo}>
                    <Text style={styles.sheetEventName} numberOfLines={2}>
                      {listing.eventName}
                    </Text>
                    <Text style={styles.sheetEventMeta} numberOfLines={1}>
                      {listing.tierName} • {listing.seatZone || 'General Admission'}
                    </Text>
                    <Text style={styles.sheetEventMeta} numberOfLines={1}>
                      {formatEventDateTime(listing.eventStartAt)}
                    </Text>
                  </View>
                </View>

                {!holdData ? (
                  <>
                    {/* Seller Trust Snapshot */}
                    <View style={styles.sheetSellerCard}>
                      <View style={styles.sheetSellerTop}>
                        <View style={styles.sheetSellerAvatar}>
                          <Text style={styles.sheetSellerAvatarText}>
                            {initialsOf(listing.sellerFullName)}
                          </Text>
                        </View>
                        <View style={styles.sheetSellerInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.sheetSellerName}>
                              {listing.sellerFullName || 'Verified Seller'}
                            </Text>
                            <View style={styles.sheetVerifiedPill}>
                              <ShieldCheck size={10} color={theme.colors.success} />
                              <Text style={styles.sheetVerifiedPillText}>VERIFIED</Text>
                            </View>
                          </View>
                          <Text style={styles.sheetSellerSub}>
                            Zone: {listing.seatZone || listing.tierName} • Pass #{listing.maskedTicketCode}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Face-Value Price Cap Guarantee Card */}
                    <View style={styles.sheetCeilingCard}>
                      <View style={styles.sheetCeilingHeader}>
                        <View style={styles.sheetCeilingIcon}>
                          <ShieldCheck size={18} color={theme.colors.success} />
                        </View>
                        <View style={styles.sheetCeilingTextWrap}>
                          <Text style={styles.sheetCeilingTitle}>Face-Value Price Cap Guarantee</Text>
                          <Text style={styles.sheetCeilingSub}>
                            Anti-scalping verified: Resale price is capped at original box office value.
                          </Text>
                        </View>
                        <View style={styles.sheetCeilingBadge}>
                          <Text style={styles.sheetCeilingBadgeText}>
                            {listing.resalePrice <= listing.originalPrice ? 'PROTECTED' : 'VERIFIED'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.sheetCeilingPriceRow}>
                        <View style={styles.sheetCeilingCol}>
                          <Text style={styles.sheetCeilingLabel}>Original Face Value</Text>
                          <Text
                            style={[
                              styles.sheetCeilingValue,
                              listing.discountPercentage > 0 && styles.sheetCeilingStrikethrough,
                            ]}
                          >
                            {formatPrice(listing.originalPrice)}
                          </Text>
                        </View>
                        <View style={styles.sheetCeilingDivider} />
                        <View style={styles.sheetCeilingCol}>
                          <Text style={styles.sheetCeilingLabel}>Resale Price</Text>
                          <Text style={[styles.sheetCeilingValue, { color: theme.colors.primary }]}>
                            {formatPrice(listing.resalePrice)}
                          </Text>
                        </View>
                        {listing.discountPercentage > 0 && (
                          <View style={styles.sheetDiscountBadge}>
                            <Text style={styles.sheetDiscountBadgeText}>
                              -{Math.round(listing.discountPercentage)}% OFF
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.sheetEscrowNotice}>
                        <CheckCircle2 size={13} color={theme.colors.success} />
                        <Text style={styles.sheetEscrowNoticeText}>
                          TicketShield Escrow: Funds are held safely and only released after ticket check-in is validated.
                        </Text>
                      </View>
                    </View>

                    {/* Price Breakdown Panel */}
                    <View style={styles.pricePanel}>
                      <View style={styles.pricePanelRow}>
                        <Text style={styles.pricePanelLabel}>Listing Price</Text>
                        <Text style={styles.pricePanelValue}>
                          {formatPrice(listing.resalePrice)}
                        </Text>
                      </View>
                      <View style={styles.pricePanelRow}>
                        <Text style={styles.pricePanelLabel}>Escrow Protection Fee (3%)</Text>
                        <Text style={styles.pricePanelValue}>
                          {formatPrice(escrowFee)}
                        </Text>
                      </View>
                      <View style={styles.pricePanelDivider} />
                      <View style={styles.pricePanelRow}>
                        <Text style={styles.pricePanelTotal}>Total Amount</Text>
                        <Text style={styles.pricePanelTotalValue}>
                          {formatPrice(totalAmount)}
                        </Text>
                      </View>
                    </View>

                    {/* Recipient Information Form */}
                    <View style={styles.formSection}>
                      <View style={styles.formSectionHeader}>
                        <Text style={styles.formSectionTitle}>Ticket Recipient Details</Text>
                        <Text style={styles.formSectionSubtitle}>
                          Enter attendee information for digital ticket issuance.
                        </Text>
                      </View>

                      <FintechInput
                        label="Attendee Full Name *"
                        placeholder="Enter full name"
                        value={recipientName}
                        onChangeText={(text) => {
                          setRecipientName(text);
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        error={formErrors.name}
                        icon={<User size={18} color={theme.colors.primary} />}
                      />

                      <FintechInput
                        label="Email Address *"
                        placeholder="Enter recipient email"
                        value={recipientEmail}
                        onChangeText={(text) => {
                          setRecipientEmail(text);
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        error={formErrors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        icon={<Mail size={18} color={theme.colors.primary} />}
                      />

                      <FintechInput
                        label="Phone Number *"
                        placeholder="Enter 10-digit phone number"
                        value={recipientPhone}
                        onChangeText={(text) => {
                          setRecipientPhone(text);
                          if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        error={formErrors.phone}
                        keyboardType="phone-pad"
                        icon={<Phone size={18} color={theme.colors.primary} />}
                      />

                      {showIdCard ? (
                        <FintechInput
                          label="ID Card / CCCD Number"
                          placeholder="Enter 12-digit citizen ID"
                          value={recipientIdCard}
                          onChangeText={setRecipientIdCard}
                          keyboardType="numeric"
                          icon={<CreditCard size={18} color={theme.colors.primary} />}
                        />
                      ) : (
                        <TouchableOpacity
                          style={styles.idCardToggleBtn}
                          onPress={() => setShowIdCard(true)}
                          activeOpacity={0.7}
                        >
                          <Plus size={14} color={theme.colors.primary} />
                          <Text style={styles.idCardToggleText}>+ Add Citizen ID (CCCD) for Check-in</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {holdError && (
                      <View style={styles.errorNote}>
                        <AlertTriangle size={16} color={theme.colors.danger} />
                        <Text style={styles.errorNoteText}>{holdError}</Text>
                      </View>
                    )}

                    <FintechButton
                      title={isHolding ? 'Reserving Ticket...' : 'Reserve Ticket'}
                      onPress={handleHoldListing}
                      loading={isHolding}
                      icon={<Clock size={16} color={theme.colors.onPrimary} />}
                    />
                  </>
                ) : (
                  <>
                    {/* 5-Minute Hold Countdown Timer Bar */}
                    <View style={[styles.countdownBar, isUrgentTimer && styles.countdownBarUrgent]}>
                      <View style={styles.countdownTopRow}>
                        <View style={styles.countdownBadge}>
                          <Clock
                            size={16}
                            color={isUrgentTimer ? theme.colors.danger : theme.colors.warning}
                          />
                          <Text
                            style={[
                              styles.countdownText,
                              isUrgentTimer && styles.countdownTextUrgent,
                            ]}
                          >
                            {secondsLeft > 0
                              ? `Held for ${formatCountdown(secondsLeft)}`
                              : 'Hold Expired'}
                          </Text>
                        </View>
                        <Text style={styles.countdownHint}>Scan VietQR or Bank Transfer</Text>
                      </View>

                      {/* Animated Progress Bar */}
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            isUrgentTimer && styles.progressBarFillUrgent,
                            { width: `${Math.round(progressRatio * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* VietQR Image Card */}
                    <View style={styles.qrCard}>
                      <Image
                        source={{ uri: holdData.qrImageUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrHint}>Open your banking app and scan VietQR</Text>
                    </View>

                    {/* One-Touch Banking App Deep Link */}
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

                    {/* Bank Transfer Details Panel with Copy Buttons */}
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

                    {/* Auto-listening status */}
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

                    {holdError && (
                      <View style={styles.errorNote}>
                        <AlertTriangle size={16} color={theme.colors.danger} />
                        <Text style={styles.errorNoteText}>{holdError}</Text>
                      </View>
                    )}

                    <FintechButton
                      title={isCheckingTransfer ? 'Verifying Transfer...' : 'I Have Transferred'}
                      onPress={handleConfirmTransfer}
                      loading={isCheckingTransfer}
                      disabled={secondsLeft === 0}
                    />

                    {secondsLeft === 0 && (
                      <View style={styles.successSecondary}>
                        <FintechButton
                          title="Choose Another Ticket"
                          onPress={handleClose}
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
