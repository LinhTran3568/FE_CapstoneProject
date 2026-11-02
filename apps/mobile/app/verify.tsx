import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Send,
  Store,
  Check,
  ShieldCheck,
  Ticket,
  ChevronDown,
  Globe,
  Share2,
  Copy,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { resaleApi, resaleListingsApi } from '@ticketshield/api-client';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { theme } from '../src/theme';
import { Text } from '../src/components/AppText';
import { FintechInput } from '../src/components/FintechInput';
import { FintechButton } from '../src/components/FintechButton';
import { formatPrice } from '../src/utils/format';
import { styles } from '../src/styles/verify.styles';

type Verification = Awaited<ReturnType<typeof resaleApi.requestVerificationOtp>>;
type Step = 'ticket' | 'otp' | 'confirm' | 'pricing' | 'review' | 'published';

const STEPS: { key: Step; label: string; stepTitle: string }[] = [
  { key: 'ticket', label: 'Ticket Code', stepTitle: 'Step 1: Enter Ticket Code' },
  { key: 'otp', label: 'Verify OTP', stepTitle: 'Step 2: Organizer Verification' },
  { key: 'confirm', label: 'Details', stepTitle: 'Step 3: Confirm Ticket Details' },
  { key: 'pricing', label: 'Price', stepTitle: 'Step 4: Set Resale Price' },
  { key: 'review', label: 'Review', stepTitle: 'Step 5: Review & Publish' },
  { key: 'published', label: 'Complete', stepTitle: 'Step 6: Listing Complete' },
];

function cooldownFrom(value?: string): number {
  if (!value) return 60;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 60;
  return Math.max(0, Math.floor((timestamp - Date.now()) / 1000));
}

export default function MobileVerifyTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('ticket');
  const [ticketCode, setTicketCode] = useState('');
  const [otp, setOtp] = useState('');
  const [verification, setVerification] = useState<Verification | null>(null);
  const [resalePriceInput, setResalePriceInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);
  const [isPrivateListing, setIsPrivateListing] = useState(false);
  const [publishedPrivateToken, setPublishedPrivateToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [myTickets, setMyTickets] = useState<PurchasedTicketDto[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isTicketPickerOpen, setIsTicketPickerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingTickets(true);
    resaleListingsApi
      .getMyPurchasedTickets()
      .then((data) => {
        if (!isMounted) return;
        const list: PurchasedTicketDto[] = [];
        for (const t of data) {
          if (t.bundleItems && t.bundleItems.length > 0) {
            for (const item of t.bundleItems) {
              list.push({
                ...t,
                ticketPassCode: item.ticketCode || item.qrCodeData || t.ticketPassCode,
                seatZone: item.seatZone || t.seatZone,
              });
            }
          } else {
            list.push(t);
          }
        }
        const eligible = list.filter((t) => {
          const code = (t.ticketPassCode || t.qrCodeData || '').trim();
          const status = (t.status || '').trim().toUpperCase();
          return code.length > 0 && (status === 'VALID' || status === 'IN_ESCROW' || status === '');
        });
        setMyTickets(eligible.length > 0 ? eligible : list.filter((t) => (t.ticketPassCode || t.qrCodeData || '').trim().length > 0));
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingTickets(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const matchedTicket = useMemo(() => {
    if (!ticketCode.trim()) return null;
    return myTickets.find(
      (t) => (t.ticketPassCode || t.qrCodeData || '').trim().toUpperCase() === ticketCode.trim().toUpperCase()
    );
  }, [ticketCode, myTickets]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const priceCeiling = verification?.priceCeiling ?? 0;
  const originalPrice = verification?.originalPrice ?? 0;
  const enteredPrice = Number(resalePriceInput) || 0;
  const buyerFee = Math.round(enteredPrice * 0.03);
  const totalBuyerPrice = enteredPrice + buyerFee;

  const resetFlow = async () => {
    if (verification?.verificationId && step !== 'ticket' && step !== 'published') {
      try {
        await resaleApi.closeVerification(verification.verificationId);
      } catch {
        // Do not block user on cleanup error
      }
    }
    setStep('ticket');
    setVerification(null);
    setOtp('');
    setResalePriceInput('');
    setPublishedListingId(null);
    setIsPrivateListing(false);
    setPublishedPrivateToken(null);
    setIsCopied(false);
    setErrorMessage(null);
    setResendCooldown(0);
  };

  const handleRequestOtp = async () => {
    const code = ticketCode.trim();
    if (!code) {
      setErrorMessage('Please enter the ticket code to verify.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await resaleApi.requestVerificationOtp(code);
      setVerification(result);
      setResendCooldown(cooldownFrom(result.resendAfter));
      setStep('otp');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to request verification OTP. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verification?.verificationId || resendCooldown > 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await resaleApi.resendVerificationOtp(verification.verificationId);
      setVerification({ ...verification, ...result });
      setResendCooldown(cooldownFrom(result.resendAfter));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to resend OTP. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!verification?.verificationId) return;
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMessage('Please enter the verification OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const currentVId = verification.verificationId;
      const result = await resaleApi.confirmVerificationOtp(currentVId, cleanOtp);
      setVerification({
        ...verification,
        ...result,
        verificationId: result.verificationId || currentVId,
      });
      if (result.priceCeiling && !resalePriceInput) {
        setResalePriceInput(String(result.priceCeiling));
      }
      setStep('confirm');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid OTP. Please check the code and try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Continue = () => {
    const price = Number(resalePriceInput);
    if (!price || price <= 0) {
      setErrorMessage('Please enter a valid resale price.');
      return;
    }
    if (priceCeiling > 0 && price > priceCeiling) {
      setErrorMessage(
        `Resale price cannot exceed the organizer cap of ${formatPrice(priceCeiling)}.`
      );
      return;
    }
    setErrorMessage(null);
    setStep('review');
  };

  const handlePublish = async () => {
    if (!verification?.verificationId) return;
    const price = Number(resalePriceInput);
    if (!price || price <= 0) {
      setErrorMessage('Please enter a valid resale price.');
      return;
    }
    if (priceCeiling > 0 && price > priceCeiling) {
      setErrorMessage(
        `Resale price cannot exceed the organizer cap of ${formatPrice(priceCeiling)}.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await resaleApi.publishListing(
        verification.verificationId,
        price,
        isPrivateListing
      );
      setPublishedListingId(result.listingId ?? verification.listingId ?? 'published');
      setPublishedPrivateToken(result.privateAccessToken ?? null);
      setStep('published');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to publish listing. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoBack = step === 'confirm' || step === 'pricing' || step === 'review';

  const handleGoBack = () => {
    if (step === 'confirm') {
      resetFlow();
    } else if (step === 'pricing') {
      setErrorMessage(null);
      setStep('confirm');
    } else if (step === 'review') {
      setErrorMessage(null);
      setStep('pricing');
    }
  };

  const activeStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sell Ticket Verification',
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerIcon}>
              <Lock size={15} color={theme.colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Organizer Escrow Verification</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            TicketShield validates original ownership with event organizers and locks the barcode before listing to prevent fraud.
          </Text>
        </View>

        <View style={styles.stepperPill}>
          {canGoBack && (
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.stepperBackBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Back to previous step"
            >
              <ArrowLeft size={11} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          <Text style={styles.stepperTitle} numberOfLines={1}>
            {STEPS[activeStepIndex]?.stepTitle || `Step ${activeStepIndex + 1}`}
          </Text>

          <View style={styles.stepperDivider} />

          <View style={styles.stepperDotsRow}>
            {STEPS.map((item, index) => {
              const active = index === activeStepIndex;
              const done = index < activeStepIndex;
              return (
                <React.Fragment key={item.key}>
                  <View
                    style={[
                      styles.microDot,
                      active && styles.microDotActive,
                      done && styles.microDotDone,
                    ]}
                  >
                    {done ? (
                      <Check size={10} color="#0C0A09" strokeWidth={3} />
                    ) : (
                      <Text
                        style={[
                          styles.microDotText,
                          active && styles.microDotTextActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {index < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.microLine,
                        done && styles.microLineDone,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <AlertTriangle size={16} color={theme.colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* STEP 1: ENTER TICKET CODE */}
        {step === 'ticket' && (
          <View style={styles.formCard}>
            <View style={styles.ticketInputHeaderRow}>
              <Text style={styles.inputSectionLabel}>Electronic Ticket Code</Text>
              <TouchableOpacity
                onPress={() => setIsTicketPickerOpen((prev) => !prev)}
                style={[
                  styles.myTicketsDropdownBtn,
                  isTicketPickerOpen && styles.myTicketsDropdownBtnActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose from My Tickets"
              >
                <Ticket size={12} color={theme.colors.primary} />
                <Text style={styles.myTicketsDropdownText}>
                  My Tickets {myTickets.length > 0 ? `(${myTickets.length})` : ''}
                </Text>
                <ChevronDown
                  size={13}
                  color={theme.colors.primary}
                  style={isTicketPickerOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
                />
              </TouchableOpacity>
            </View>

            {isTicketPickerOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                  {isLoadingTickets ? (
                    <View style={styles.dropdownEmpty}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={[styles.dropdownEmptyText, { marginTop: 6 }]}>
                        Loading your purchased tickets...
                      </Text>
                    </View>
                  ) : myTickets.length === 0 ? (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>
                        No eligible tickets found in your wallet. You can still enter code manually below.
                      </Text>
                    </View>
                  ) : (
                    myTickets.map((t, idx) => {
                      const code = (t.ticketPassCode || t.qrCodeData || '').trim();
                      const isSelected = ticketCode.trim().toUpperCase() === code.toUpperCase();
                      return (
                        <TouchableOpacity
                          key={`${code}-${idx}`}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => {
                            setTicketCode(code);
                            setErrorMessage(null);
                            setIsTicketPickerOpen(false);
                          }}
                        >
                          <View style={styles.dropdownItemLeft}>
                            <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                              {t.eventName || 'Concert Ticket'}
                            </Text>
                            <Text style={styles.dropdownItemSubtitle} numberOfLines={1}>
                              {[t.tierName, t.seatZone].filter(Boolean).join(' • ') || 'General Admission'}
                            </Text>
                            <Text style={styles.dropdownItemCode}>
                              {code}
                            </Text>
                          </View>
                          {isSelected && (
                            <Check size={16} color={theme.colors.success} strokeWidth={2.5} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            <FintechInput
              placeholder="e.g. ATSH-VIP-882109"
              value={ticketCode}
              onChangeText={(value) => {
                setTicketCode(value);
                setErrorMessage(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {matchedTicket && (
              <View style={styles.selectedTicketBadge}>
                <ShieldCheck size={13} color={theme.colors.success} />
                <Text style={styles.selectedTicketBadgeText} numberOfLines={1}>
                  Selected from wallet: {matchedTicket.eventName || 'Event'} ({[matchedTicket.tierName, matchedTicket.seatZone].filter(Boolean).join(', ') || 'Pass'})
                </Text>
              </View>
            )}

            <FintechButton
              title="Send Verification Request"
              onPress={handleRequestOtp}
              loading={isSubmitting}
              icon={<Send size={17} color={theme.colors.onPrimary} />}
            />
          </View>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 'otp' && verification && (
          <View style={styles.formCard}>
            <View style={styles.ticketChip}>
              <Text style={styles.ticketChipLabel}>Verifying Ticket</Text>
              <Text style={styles.ticketChipValue} numberOfLines={1}>
                {ticketCode.trim()}
              </Text>
            </View>

            <FintechInput
              label="Organizer Verification Code (OTP)"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={(value) => {
                setOtp(value);
                setErrorMessage(null);
              }}
              keyboardType="number-pad"
              maxLength={8}
            />

            <View style={styles.resendRow}>
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resendCooldown > 0 || isSubmitting}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.resendText,
                    (resendCooldown > 0 || isSubmitting) && styles.resendTextDisabled,
                  ]}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.otpExpiryHint}>Code valid for several minutes</Text>
            </View>

            <FintechButton
              title="Confirm OTP Code"
              onPress={handleConfirmOtp}
              loading={isSubmitting}
              icon={<ShieldCheck size={17} color={theme.colors.onPrimary} />}
            />

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={resetFlow}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>Cancel Verification Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: CONFIRM TICKET DETAILS */}
        {step === 'confirm' && verification && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <CheckCircle2 size={26} color={theme.colors.success} />
              </View>
              <View style={styles.resultTitleGroup}>
                <Text style={styles.resultTitle}>Ticket Valid & Escrow Locked</Text>
                <Text style={styles.resultSubtitle}>
                  Event organizer has confirmed ownership of this ticket.
                </Text>
              </View>
            </View>

            <View style={styles.resultSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Ticket Code</Text>
                <Text style={styles.specValueMono} numberOfLines={1}>
                  {ticketCode.trim()}
                </Text>
              </View>
              {originalPrice > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Original Face Value</Text>
                  <Text style={styles.specValue}>{formatPrice(originalPrice)}</Text>
                </View>
              )}
              {priceCeiling > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Organizer Price Ceiling</Text>
                  <Text style={styles.specValueCap}>{formatPrice(priceCeiling)}</Text>
                </View>
              )}
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Escrow Protection</Text>
                <Text style={[styles.specValue, { color: theme.colors.success }]}>
                  Barcode Locked & Verified
                </Text>
              </View>
            </View>

            <View style={styles.helperRow}>
              <ShieldCheck size={15} color={theme.colors.success} />
              <Text style={styles.helperText}>
                Your original barcode is temporarily locked to prevent duplicate entry. You can now set your resale listing price.
              </Text>
            </View>

            <FintechButton
              title="Continue to Set Price"
              onPress={() => {
                setErrorMessage(null);
                setStep('pricing');
              }}
              icon={<ArrowRight size={17} color={theme.colors.onPrimary} />}
            />

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={resetFlow}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>Cancel and Unlock Ticket</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: SET RESALE PRICE */}
        {step === 'pricing' && verification && (
          <View style={styles.formCard}>
            <View style={styles.ticketChip}>
              <Text style={styles.ticketChipLabel}>Ticket Code</Text>
              <Text style={styles.ticketChipValue} numberOfLines={1}>
                {ticketCode.trim()}
              </Text>
            </View>

            <FintechInput
              label="Your Resale Listing Price (VND)"
              placeholder="e.g. 500000"
              value={resalePriceInput}
              onChangeText={(value) => {
                setResalePriceInput(value.replace(/[^\d]/g, ''));
                setErrorMessage(null);
              }}
              keyboardType="number-pad"
              maxLength={12}
            />

            {priceCeiling > 0 && (
              <View style={styles.helperRow}>
                <ShieldCheck size={15} color={theme.colors.warning} />
                <Text style={styles.helperText}>
                  Organizer price ceiling: {formatPrice(priceCeiling)}. Anti-scalping policy strictly enforced.
                </Text>
              </View>
            )}

            {enteredPrice > 0 && (
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Listing Price</Text>
                  <Text style={styles.breakdownValue}>{formatPrice(enteredPrice)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Buyer Escrow Fee (3%)</Text>
                  <Text style={styles.breakdownValue}>+{formatPrice(buyerFee)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Total Buyer Pays</Text>
                  <Text style={styles.breakdownValue}>{formatPrice(totalBuyerPrice)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Your Net Payout (100%)</Text>
                  <Text style={styles.breakdownHighlight}>{formatPrice(enteredPrice)}</Text>
                </View>
              </View>
            )}

            <FintechButton
              title="Continue to Review"
              onPress={handleStep4Continue}
              icon={<ArrowRight size={17} color={theme.colors.onPrimary} />}
            />

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => {
                setErrorMessage(null);
                setStep('confirm');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>Back to Ticket Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: REVIEW & PUBLISH */}
        {step === 'review' && verification && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <ShieldCheck size={26} color={theme.colors.primary} />
              </View>
              <View style={styles.resultTitleGroup}>
                <Text style={styles.resultTitle}>Review Listing Details</Text>
                <Text style={styles.resultSubtitle}>
                  Confirm your listing parameters before publishing to the Marketplace.
                </Text>
              </View>
            </View>

            {/* Visibility Selection: Public vs Private (like Web) */}
            <View style={styles.visibilityCard}>
              <Text style={styles.visibilityTitle}>Who can see it</Text>
              <View style={styles.visibilityRow}>
                {/* Public option */}
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    !isPrivateListing && styles.visibilityOptionPublicActive,
                  ]}
                  onPress={() => setIsPrivateListing(false)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.visibilityIconBox,
                      !isPrivateListing
                        ? styles.visibilityIconBoxPublicActive
                        : styles.visibilityIconBoxInactive,
                    ]}
                  >
                    <Globe size={18} color={!isPrivateListing ? '#FFFFFF' : '#9CA3AF'} />
                  </View>
                  <View style={styles.visibilityTextCol}>
                    <Text style={styles.visibilityOptionLabel}>Public</Text>
                    <Text style={styles.visibilityOptionSub} numberOfLines={1}>
                      Marketplace
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Private option */}
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    isPrivateListing && styles.visibilityOptionPrivateActive,
                  ]}
                  onPress={() => setIsPrivateListing(true)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.visibilityIconBox,
                      isPrivateListing
                        ? styles.visibilityIconBoxPrivateActive
                        : styles.visibilityIconBoxInactive,
                    ]}
                  >
                    <Lock size={18} color={isPrivateListing ? '#FFFFFF' : '#9CA3AF'} />
                  </View>
                  <View style={styles.visibilityTextCol}>
                    <Text style={styles.visibilityOptionLabel}>Private</Text>
                    <Text style={styles.visibilityOptionSub} numberOfLines={1}>
                      Secret Link
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.visibilityDesc}>
                {!isPrivateListing
                  ? 'Anyone can find and buy this ticket on the Marketplace.'
                  : 'Only people you share the secret link with can see and buy this ticket.'}
              </Text>
            </View>

            <View style={styles.resultSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Ticket Code</Text>
                <Text style={styles.specValueMono} numberOfLines={1}>
                  {ticketCode.trim()}
                </Text>
              </View>
              {originalPrice > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Original Face Value</Text>
                  <Text style={styles.specValue}>{formatPrice(originalPrice)}</Text>
                </View>
              )}
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Listing Resale Price</Text>
                <Text style={[styles.specValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                  {formatPrice(enteredPrice)}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Buyer Escrow Fee (3%)</Text>
                <Text style={styles.specValue}>{formatPrice(buyerFee)}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Your Net Payout</Text>
                <Text style={styles.breakdownHighlight}>{formatPrice(enteredPrice)}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Visibility</Text>
                <Text
                  style={[
                    styles.specValue,
                    { color: isPrivateListing ? '#C084FC' : '#10B981', fontWeight: 'bold' },
                  ]}
                >
                  {isPrivateListing ? 'Private (Secret Link)' : 'Public (Marketplace)'}
                </Text>
              </View>
            </View>

            <FintechButton
              title={isPrivateListing ? 'Create Private Listing' : 'Publish to Marketplace'}
              onPress={handlePublish}
              loading={isSubmitting}
              variant={isPrivateListing ? 'primary' : 'success'}
              icon={
                isPrivateListing ? (
                  <Lock size={17} color={theme.colors.onPrimary} />
                ) : (
                  <Store size={17} color={theme.colors.onSuccess} />
                )
              }
            />

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => {
                setErrorMessage(null);
                setStep('pricing');
              }}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>Back to Edit Price</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={resetFlow}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>Cancel and Unlock Ticket</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 6: LISTING PUBLISHED */}
        {step === 'published' && (
          <View style={styles.resultCard}>
            <View
              style={[
                styles.publishedIcon,
                isPrivateListing && { backgroundColor: 'rgba(168, 85, 247, 0.2)' },
              ]}
            >
              <CheckCircle2
                size={40}
                color={isPrivateListing ? '#A855F7' : theme.colors.success}
              />
            </View>
            <Text style={styles.publishedTitle}>
              {isPrivateListing
                ? 'Private Listing Created Successfully!'
                : 'Ticket Listed on Marketplace'}
            </Text>
            {isPrivateListing && (
              <View style={styles.secretLinkCard}>
                <View style={styles.secretLinkHeader}>
                  <Share2 size={16} color="#C084FC" />
                  <Text style={styles.secretLinkTitle}>Secret Shareable Link</Text>
                  <View style={styles.secretBadge}>
                    <Text style={styles.secretBadgeText}>Secret URL</Text>
                  </View>
                </View>
                <View style={styles.secretLinkBox}>
                  <Text style={styles.secretLinkUrl} numberOfLines={1}>
                    {publishedPrivateToken
                      ? `https://ticketshield.vn/p/${publishedPrivateToken}`
                      : 'https://ticketshield.vn/p/...'}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyLinkBtn}
                    onPress={async () => {
                      const link = publishedPrivateToken
                        ? `https://ticketshield.vn/p/${publishedPrivateToken}`
                        : '';
                      if (link) {
                        await Clipboard.setStringAsync(link);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} color="#10B981" />
                        <Text style={styles.copyLinkBtnTextCopied}>Copied!</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color="#FFF" />
                        <Text style={styles.copyLinkBtnText}>Copy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!!publishedListingId && (
              <Text style={styles.listingId} numberOfLines={1}>
                Listing ID: {publishedListingId}
              </Text>
            )}

            {!isPrivateListing && (
              <FintechButton
                title="View in Marketplace"
                onPress={() => router.push('/(tabs)/marketplace')}
                icon={<ArrowRight size={17} color={theme.colors.onPrimary} />}
              />
            )}
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={resetFlow}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>List Another Ticket</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}
