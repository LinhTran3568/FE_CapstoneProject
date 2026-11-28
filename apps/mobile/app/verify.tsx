import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
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
  X,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { bankAccountsApi, resaleApi, resaleListingsApi } from '@ticketshield/api-client';
import type { PurchasedTicketDto, ResaleFeeConfigDto } from '@ticketshield/types';
import { theme } from '../src/theme';
import { Text } from '../src/components/AppText';
import { FintechInput } from '../src/components/FintechInput';
import { FintechButton } from '../src/components/FintechButton';
import { formatPrice } from '../src/utils/format';
import { styles } from '../src/styles/verify.styles';

type Verification = Awaited<ReturnType<typeof resaleApi.requestVerificationOtp>>;
type Step = 'ticket' | 'otp' | 'confirm' | 'pricing' | 'review' | 'published';
type SaleType = 'combo' | 'individual';

type VerifiedTicket = {
  code: string;
  verification: Verification;
  resalePrice: string;
};

const MAX_BUNDLE_TICKETS = 3;

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
  const [selectedTicketCodes, setSelectedTicketCodes] = useState<string[]>([]);
  const [verifiedTickets, setVerifiedTickets] = useState<VerifiedTicket[]>([]);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [saleType, setSaleType] = useState<SaleType>('combo');
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
  const [feeConfig, setFeeConfig] = useState<ResaleFeeConfigDto | null>(null);
  const [isLoadingFeeConfig, setIsLoadingFeeConfig] = useState(true);
  const [feeConfigError, setFeeConfigError] = useState<string | null>(null);
  // A missing payout account should redirect a user when they enter Sell, but
  // must not trap them in a Sell → Payout → Back → Payout navigation loop.
  const hasRedirectedForPayoutRef = useRef(false);
  const activeVerificationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    activeVerificationIdsRef.current = step === 'published'
      ? []
      : [...new Set([
        ...verifiedTickets.map((item) => item.verification.verificationId),
        verification?.verificationId,
      ].filter(Boolean) as string[])];
  }, [step, verifiedTickets, verification]);

  // A seller may leave through the tab bar or Android back button rather than
  // the explicit cancel action. Release every verified ticket in the combo.
  useEffect(() => () => {
    activeVerificationIdsRef.current.forEach((id) => resaleApi.closeVerificationBeacon(id));
  }, []);

  const requirePayoutAccount = useCallback(async (redirectOnExplicitSell = false): Promise<boolean> => {
    try {
      const accounts = await bankAccountsApi.getMyBankAccounts();
      if (accounts.length > 0) {
        hasRedirectedForPayoutRef.current = false;
        // The Sell screen remains mounted while the user opens payout setup.
        // Clear the previous missing-account warning after the refreshed check
        // confirms an account was linked.
        setErrorMessage(null);
        return true;
      }

      setErrorMessage('Link a payout account before selling.');
      if (redirectOnExplicitSell || !hasRedirectedForPayoutRef.current) {
        hasRedirectedForPayoutRef.current = true;
        router.push('/payout-accounts');
      }
      return false;
    } catch {
      setErrorMessage('Unable to check payout account. Please try again.');
      return false;
    }
  }, [router]);

  // A seller must configure where the escrow payout goes before starting the
  // verification flow. The backend repeats this check as the final authority.
  useFocusEffect(
    useCallback(() => {
      void requirePayoutAccount();
    }, [requirePayoutAccount])
  );

  // Fee settings are administered by the backend. Never derive buyer or seller
  // amounts from a client-side percentage because the policy can change at runtime.
  const loadFeeConfig = useCallback(async () => {
    setIsLoadingFeeConfig(true);
    setFeeConfigError(null);
    try {
      setFeeConfig(await resaleListingsApi.getFeePolicy());
    } catch {
      setFeeConfig(null);
      setFeeConfigError('Unable to load the current resale fee policy. Please try again.');
    } finally {
      setIsLoadingFeeConfig(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFeeConfig();
    }, [loadFeeConfig])
  );

  const [myTickets, setMyTickets] = useState<PurchasedTicketDto[]>([]);
  const [refundedTicketCodes, setRefundedTicketCodes] = useState<Set<string>>(new Set());
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
        setRefundedTicketCodes(
          new Set(
            list
              .filter((t) => (t.status || '').trim().toUpperCase() === 'REFUNDED')
              .map((t) => (t.ticketPassCode || t.qrCodeData || '').trim().toUpperCase())
              .filter(Boolean)
          )
        );
        setMyTickets(eligible);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingTickets(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCodesPreview = useMemo(
    () => [...new Set([
      ...selectedTicketCodes,
      ...ticketCode.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean),
    ])],
    [selectedTicketCodes, ticketCode]
  );

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
  const feePreview = useMemo(() => {
    if (!feeConfig || enteredPrice <= 0) return null;

    // Mirrors DynamicResaleFeeCalculator (.NET decimal Math.Round defaults to ToEven).
    const roundToEven = (value: number) => {
      const lower = Math.floor(value);
      const fraction = value - lower;
      if (Math.abs(fraction - 0.5) < 1e-9) return lower % 2 === 0 ? lower : lower + 1;
      return Math.round(value);
    };
    const buyerFee = roundToEven(
      Math.max(enteredPrice * feeConfig.buyerFeePercentage, feeConfig.minimumBuyerFee)
    );
    const sellerFee = roundToEven(
      Math.max(enteredPrice * feeConfig.sellerFeePercentage, feeConfig.minimumSellerFee)
    );

    return {
      buyerFee,
      sellerFee,
      totalBuyerPrice: roundToEven(enteredPrice + buyerFee),
      netSellerPayout: roundToEven(enteredPrice - sellerFee),
      buyerFeeLabel: feeConfig.minimumBuyerFee > enteredPrice * feeConfig.buyerFeePercentage
        ? `min. ${formatPrice(feeConfig.minimumBuyerFee)}`
        : `${Number((feeConfig.buyerFeePercentage * 100).toFixed(2))}%`,
      sellerFeeLabel: feeConfig.minimumSellerFee > enteredPrice * feeConfig.sellerFeePercentage
        ? `min. ${formatPrice(feeConfig.minimumSellerFee)}`
        : `${Number((feeConfig.sellerFeePercentage * 100).toFixed(2))}%`,
    };
  }, [enteredPrice, feeConfig]);

  const resetFlow = async () => {
    const verificationIds = new Set(
      [...verifiedTickets.map((item) => item.verification.verificationId), verification?.verificationId]
        .filter(Boolean) as string[]
    );
    if (step !== 'published') {
      await Promise.allSettled([...verificationIds].map((id) => resaleApi.closeVerification(id)));
    }
    setStep('ticket');
    setTicketCode('');
    setSelectedTicketCodes([]);
    setVerifiedTickets([]);
    setActiveTicketIndex(0);
    setSaleType('combo');
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
    const codes = selectedCodesPreview;
    if (codes.length === 0) {
      setErrorMessage('Please enter the ticket code to verify.');
      return;
    }
    if (codes.length > MAX_BUNDLE_TICKETS) {
      setErrorMessage(`You can list up to ${MAX_BUNDLE_TICKETS} tickets in one combo.`);
      return;
    }
    if (codes.some((code) => refundedTicketCodes.has(code))) {
      setErrorMessage('This ticket was refunded and cannot be listed.');
      return;
    }
    // Returning from Payout should not redirect again by itself. A deliberate
    // verification request is a new sell action, so send the user back to
    // payout setup if it is still missing.
    if (!(await requirePayoutAccount(true))) return;

    const code = codes[activeTicketIndex] || codes[0];
    setSelectedTicketCodes(codes);
    setTicketCode(code);
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
      const lockedVerification = {
        ...verification,
        ...result,
        verificationId: result.verificationId || currentVId,
      };
      const lockedTicket: VerifiedTicket = {
        code: ticketCode.trim(),
        verification: lockedVerification,
        resalePrice: String(lockedVerification.priceCeiling || lockedVerification.originalPrice || ''),
      };
      setVerifiedTickets((current) => [...current, lockedTicket]);

      const nextIndex = activeTicketIndex + 1;
      if (nextIndex < selectedTicketCodes.length) {
        setActiveTicketIndex(nextIndex);
        setTicketCode(selectedTicketCodes[nextIndex]);
        setVerification(null);
        setOtp('');
        setResendCooldown(0);
        setStep('otp');
      } else {
        setVerification(lockedVerification);
        setActiveTicketIndex(0);
        setTicketCode(lockedTicket.code);
        setResalePriceInput(lockedTicket.resalePrice);
        setStep('confirm');
      }
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
    if (!feeConfig) {
      setErrorMessage('Unable to load the current resale fee policy. Please try again.');
      return;
    }
    if (price < feeConfig.minimumSellerFee) {
      setErrorMessage(`Resale price must be at least ${formatPrice(feeConfig.minimumSellerFee)}.`);
      return;
    }
    const currentCode = verifiedTickets[activeTicketIndex]?.code;
    setVerifiedTickets((current) => current.map((item, index) =>
      index === activeTicketIndex ? { ...item, resalePrice: resalePriceInput } : item
    ));
    const nextIndex = activeTicketIndex + 1;
    if (nextIndex < verifiedTickets.length) {
      const next = verifiedTickets[nextIndex];
      setActiveTicketIndex(nextIndex);
      setVerification(next.verification);
      setTicketCode(next.code);
      setResalePriceInput(next.resalePrice || String(next.verification.priceCeiling || next.verification.originalPrice || ''));
      setErrorMessage(null);
      return;
    }
    // Keep the current price in state while React applies the session update.
    if (!currentCode) return;
    setErrorMessage(null);
    setStep('review');
  };

  const handlePublish = async () => {
    if (!(await requirePayoutAccount(true))) return;

    const ticketsToPublish = verifiedTickets.map((item, index) =>
      index === activeTicketIndex ? { ...item, resalePrice: resalePriceInput } : item
    );
    if (!feeConfig || ticketsToPublish.length === 0 || ticketsToPublish.some((item) => {
      const price = Number(item.resalePrice);
      const ceiling = item.verification.priceCeiling || 0;
      return !price || price < feeConfig.minimumSellerFee || (ceiling > 0 && price > ceiling);
    })) {
      setErrorMessage('Review every ticket price and the current organizer cap before publishing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (ticketsToPublish.length === 1) {
        const item = ticketsToPublish[0];
        const result = await resaleApi.publishListing(
          item.verification.verificationId,
          Number(item.resalePrice),
          isPrivateListing
        );
        setPublishedListingId(result.listingId ?? item.verification.listingId ?? 'published');
        setPublishedPrivateToken(result.privateAccessToken ?? null);
      } else {
        const result = await resaleApi.bulkPublishListing(
          ticketsToPublish.map((item) => ({
            verificationId: item.verification.verificationId,
            resalePrice: Number(item.resalePrice),
            isPrivate: isPrivateListing,
          })),
          saleType === 'combo'
        );
        setPublishedListingId(result.listings?.[0]?.listingId ?? result.bundleId ?? 'published');
        setPublishedPrivateToken((result as any).privateAccessToken ?? null);
      }
      setStep('published');
    } catch (err) {
      const message = err instanceof Error && err.message === 'TICKET_REFUNDED'
        ? 'This ticket was refunded and cannot be listed.'
        : err instanceof Error ? err.message : 'Unable to publish listing. Please try again.';
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
              <Text style={styles.inputSectionLabel}>
                Tickets ({selectedCodesPreview.length}/3)
              </Text>
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
                      const isSelected = selectedTicketCodes.includes(code.toUpperCase());
                      return (
                        <TouchableOpacity
                          key={`${code}-${idx}`}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => {
                            const normalizedCode = code.toUpperCase();
                            if (isSelected) {
                              setSelectedTicketCodes((current) => current.filter((item) => item !== normalizedCode));
                            } else if (selectedTicketCodes.length < MAX_BUNDLE_TICKETS) {
                              setSelectedTicketCodes((current) => [...current, normalizedCode]);
                            } else {
                              setErrorMessage(`You can select up to ${MAX_BUNDLE_TICKETS} tickets.`);
                              return;
                            }
                            setErrorMessage(null);
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

            {selectedCodesPreview.length > 0 && (
              <View style={styles.selectedTicketsBox}>
                <Text style={styles.selectedTicketsLabel}>Selected tickets</Text>
                {selectedCodesPreview.map((code, index) => (
                  <View style={styles.selectedTicketRow} key={code}>
                    <Text style={styles.selectedTicketCode} numberOfLines={1}>
                      Ticket {index + 1}: {code}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedTicketCodes((current) => current.filter((item) => item !== code));
                        setTicketCode((current) => current
                          .split(',')
                          .map((item) => item.trim())
                          .filter((item) => item && item.toUpperCase() !== code)
                          .join(', '));
                        setErrorMessage(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Remove ${code}`}
                    >
                      <X size={15} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <FintechInput
              label="Ticket code (optional)"
              placeholder="One code, or comma-separated codes"
              value={ticketCode}
              onChangeText={(value) => {
                setTicketCode(value);
                setErrorMessage(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <FintechButton
              title={selectedCodesPreview.length > 1 ? `Verify ${selectedCodesPreview.length} Tickets` : 'Send Verification Request'}
              onPress={handleRequestOtp}
              loading={isSubmitting}
              icon={<Send size={17} color={theme.colors.onPrimary} />}
            />
          </View>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 'otp' && (
          <View style={styles.formCard}>
            <View style={styles.ticketChip}>
              <Text style={styles.ticketChipLabel}>
                Verifying Ticket {activeTicketIndex + 1} of {selectedTicketCodes.length}
              </Text>
              <Text style={styles.ticketChipValue} numberOfLines={1}>
                {ticketCode.trim()}
              </Text>
            </View>

            {!verification ? (
              <FintechButton
                title={`Send OTP for Ticket ${activeTicketIndex + 1}`}
                onPress={handleRequestOtp}
                loading={isSubmitting}
                icon={<Send size={17} color={theme.colors.onPrimary} />}
              />
            ) : (
              <>
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
                </View>

                <FintechButton
                  title={activeTicketIndex + 1 < selectedTicketCodes.length ? 'Confirm & Verify Next Ticket' : 'Confirm OTP Code'}
                  onPress={handleConfirmOtp}
                  loading={isSubmitting}
                  icon={<ShieldCheck size={17} color={theme.colors.onPrimary} />}
                />
              </>
            )}

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
                <Text style={styles.resultTitle}>
                  {verifiedTickets.length > 1
                    ? `${verifiedTickets.length} Tickets Valid & Escrow Locked`
                    : 'Ticket Valid & Escrow Locked'}
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

            <FintechButton
              title="Continue to Set Price"
              onPress={() => {
                const firstTicket = verifiedTickets[0];
                if (!firstTicket) return;
                setErrorMessage(null);
                setActiveTicketIndex(0);
                setVerification(firstTicket.verification);
                setTicketCode(firstTicket.code);
                setResalePriceInput(firstTicket.resalePrice);
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
              <Text style={styles.ticketChipLabel}>
                Ticket {activeTicketIndex + 1} of {verifiedTickets.length}
              </Text>
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

            {enteredPrice > 0 && feePreview && (
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Listing Price</Text>
                  <Text style={styles.breakdownValue}>{formatPrice(enteredPrice)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Buyer Escrow Fee ({feePreview.buyerFeeLabel})</Text>
                  <Text style={styles.breakdownValue}>+{formatPrice(feePreview.buyerFee)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Total Buyer Pays</Text>
                  <Text style={styles.breakdownValue}>{formatPrice(feePreview.totalBuyerPrice)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Seller Fee ({feePreview.sellerFeeLabel})</Text>
                  <Text style={styles.breakdownValue}>-{formatPrice(feePreview.sellerFee)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Your Net Payout</Text>
                  <Text style={styles.breakdownHighlight}>{formatPrice(feePreview.netSellerPayout)}</Text>
                </View>
              </View>
            )}

            {feeConfigError && (
              <Text style={styles.errorText}>{feeConfigError}</Text>
            )}

            <FintechButton
              title={activeTicketIndex + 1 < verifiedTickets.length ? 'Save Price & Set Next Ticket' : 'Continue to Review'}
              onPress={handleStep4Continue}
              disabled={isLoadingFeeConfig || !feePreview}
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

            {verifiedTickets.length > 1 && (
              <View style={styles.visibilityCard}>
                <Text style={styles.visibilityTitle}>How buyers can purchase</Text>
                <View style={styles.visibilityRow}>
                  <TouchableOpacity
                    style={[styles.visibilityOption, saleType === 'combo' && styles.visibilityOptionPublicActive]}
                    onPress={() => setSaleType('combo')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.visibilityIconBox, saleType === 'combo' ? styles.visibilityIconBoxPublicActive : styles.visibilityIconBoxInactive]}>
                      <Ticket size={18} color={saleType === 'combo' ? '#FFFFFF' : '#9CA3AF'} />
                    </View>
                    <View style={styles.visibilityTextCol}>
                      <Text style={styles.visibilityOptionLabel} numberOfLines={1}>Together</Text>
                      <Text style={styles.visibilityOptionSub} numberOfLines={1}>All tickets</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.visibilityOption, saleType === 'individual' && styles.visibilityOptionPublicActive]}
                    onPress={() => setSaleType('individual')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.visibilityIconBox, saleType === 'individual' ? styles.visibilityIconBoxPublicActive : styles.visibilityIconBoxInactive]}>
                      <Check size={18} color={saleType === 'individual' ? '#FFFFFF' : '#9CA3AF'} />
                    </View>
                    <View style={styles.visibilityTextCol}>
                      <Text style={styles.visibilityOptionLabel} numberOfLines={1}>Separate</Text>
                      <Text style={styles.visibilityOptionSub} numberOfLines={1}>Buyer chooses</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <Text style={styles.visibilityDesc}>
                  {saleType === 'combo'
                    ? 'Buyers must purchase every ticket in this combo together.'
                    : 'Buyers can select one or more tickets from this listing.'}
                </Text>
              </View>
            )}

            <View style={styles.resultSpecs}>
              {verifiedTickets.map((item, index) => (
                <View style={styles.ticketPriceRow} key={item.code}>
                  <View style={styles.ticketPriceIdentity}>
                    <Text style={styles.specLabel} numberOfLines={1}>
                      {verifiedTickets.length > 1 ? `Ticket ${index + 1}` : 'Ticket Code'}
                    </Text>
                    <Text style={styles.ticketPriceCode} numberOfLines={1}>{item.code}</Text>
                  </View>
                  <Text style={styles.ticketPriceValue} numberOfLines={1}>
                    {formatPrice(Number(item.resalePrice))}
                  </Text>
                </View>
              ))}
              {verifiedTickets.length === 1 && originalPrice > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Original Face Value</Text>
                  <Text style={styles.specValue}>{formatPrice(originalPrice)}</Text>
                </View>
              )}
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>
                  {verifiedTickets.length > 1 ? 'Total Listing Price' : 'Listing Resale Price'}
                </Text>
                <Text style={[styles.specValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                  {formatPrice(verifiedTickets.reduce((total, item) => total + Number(item.resalePrice || 0), 0))}
                </Text>
              </View>
              {verifiedTickets.length === 1 && feePreview && (
                <>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Buyer Escrow Fee ({feePreview.buyerFeeLabel})</Text>
                    <Text style={styles.specValue}>{formatPrice(feePreview.buyerFee)}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Seller Fee ({feePreview.sellerFeeLabel})</Text>
                    <Text style={styles.specValue}>-{formatPrice(feePreview.sellerFee)}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Your Net Payout</Text>
                    <Text style={styles.breakdownHighlight}>{formatPrice(feePreview.netSellerPayout)}</Text>
                  </View>
                </>
              )}
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
              disabled={!feePreview || isLoadingFeeConfig}
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
