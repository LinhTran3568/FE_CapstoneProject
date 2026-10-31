import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../src/components/AppText';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Send,
  Store,
} from 'lucide-react-native';
import { resaleApi } from '@ticketshield/api-client';
import { theme } from '../src/theme';
import { FintechButton } from '../src/components/FintechButton';
import { FintechInput } from '../src/components/FintechInput';
import { formatPrice } from '../src/utils/format';
import { styles } from '../src/styles/verify.styles';

type Verification = Awaited<ReturnType<typeof resaleApi.requestVerificationOtp>>;
type Step = 'ticket' | 'otp' | 'result' | 'published';

const STEPS: { key: Step; label: string }[] = [
  { key: 'ticket', label: 'Ticket Code' },
  { key: 'otp', label: 'Verify OTP' },
  { key: 'result', label: 'Set Price' },
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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const priceCeiling = verification?.priceCeiling ?? 0;
  const originalPrice = verification?.originalPrice ?? 0;

  const resetFlow = async () => {
    if (verification?.verificationId && (step === 'otp' || step === 'result')) {
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
      setStep('otp');
      setResendCooldown(cooldownFrom(result.resendAfter));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to request verification. Please check the ticket code and network connection.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verification) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await resaleApi.resendVerificationOtp(verification.verificationId);
      setVerification({ ...verification, ...result });
      setResendCooldown(cooldownFrom(result.resendAfter));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to resend OTP.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!verification) return;
    const code = otp.trim();
    if (code.length < 4) {
      setErrorMessage('Please enter the OTP code sent to you.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await resaleApi.confirmVerificationOtp(verification.verificationId, code);
      setVerification({ ...verification, ...result });
      setResalePriceInput(String(result.priceCeiling ?? verification.priceCeiling ?? ''));
      setStep('result');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid or expired OTP code.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!verification) return;
    const price = Number(resalePriceInput.replace(/[^\d]/g, ''));
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
      const result = await resaleApi.publishListing(verification.verificationId, price, false);
      setPublishedListingId(result.listingId ?? verification.listingId ?? 'published');
      setStep('published');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to publish listing. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStepIndex = step === 'published' ? STEPS.length : STEPS.findIndex((s) => s.key === step);

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
          <View style={styles.headerIcon}>
            <Lock size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Organizer Escrow Verification</Text>
          <Text style={styles.headerSubtitle}>
            TicketShield validates original ownership with event organizers and locks the barcode before listing to prevent fraud.
          </Text>
        </View>

        {step !== 'published' && (
          <View style={styles.stepper}>
            {STEPS.map((item, index) => {
              const active = index === activeStepIndex;
              const done = index < activeStepIndex;
              return (
                <React.Fragment key={item.key}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        active && styles.stepDotActive,
                        done && styles.stepDotDone,
                      ]}
                    >
                      {done ? (
                        <CheckCircle2 size={14} color={theme.colors.onPrimary} />
                      ) : (
                        <Text
                          style={[
                            styles.stepNumber,
                            (active || done) && styles.stepNumberActive,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                      {item.label}
                    </Text>
                  </View>
                  {index < STEPS.length - 1 && <View style={styles.stepLine} />}
                </React.Fragment>
              );
            })}
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBox}>
            <AlertTriangle size={16} color={theme.colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {step === 'ticket' && (
          <View style={styles.formCard}>
            <FintechInput
              label="Electronic Ticket Code"
              placeholder="e.g. ATSH-VIP-882109"
              value={ticketCode}
              onChangeText={(value) => {
                setTicketCode(value);
                setErrorMessage(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.helperRow}>
              <ShieldCheck size={15} color={theme.colors.success} />
              <Text style={styles.helperText}>
                Your ticket code is available in My Tickets. A verification OTP will be sent to the registered email or phone.
              </Text>
            </View>
            <FintechButton
              title="Send Verification Request"
              onPress={handleRequestOtp}
              loading={isSubmitting}
              icon={<Send size={17} color={theme.colors.onPrimary} />}
            />
          </View>
        )}

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

        {step === 'result' && verification && (
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
                  <Text style={styles.specLabel}>Original Price</Text>
                  <Text style={styles.specValue}>{formatPrice(originalPrice)}</Text>
                </View>
              )}
              {priceCeiling > 0 && (
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Organizer Price Ceiling</Text>
                  <Text style={styles.specValueCap}>{formatPrice(priceCeiling)}</Text>
                </View>
              )}
            </View>

            <FintechInput
              label="Your Resale Listing Price (VND)"
              placeholder="Enter price"
              value={resalePriceInput}
              onChangeText={(value) => {
                setResalePriceInput(value.replace(/[^\d]/g, ''));
                setErrorMessage(null);
              }}
              keyboardType="number-pad"
              maxLength={12}
            />

            <View style={styles.helperRow}>
              <ShieldCheck size={15} color={theme.colors.success} />
              <Text style={styles.helperText}>
                Price cannot exceed the organizer ceiling. Buyers pay a 3% escrow fee; you receive 100% of your listed price upon completion.
              </Text>
            </View>

            <FintechButton
              title="Publish to Marketplace"
              onPress={handlePublish}
              loading={isSubmitting}
              variant="success"
              icon={<Store size={17} color={theme.colors.onSuccess} />}
            />

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

        {step === 'published' && (
          <View style={styles.resultCard}>
            <View style={styles.publishedIcon}>
              <CheckCircle2 size={40} color={theme.colors.success} />
            </View>
            <Text style={styles.publishedTitle}>Ticket Listed on Marketplace</Text>
            <Text style={styles.publishedText}>
              Your listing is now active on the Marketplace. Sale proceeds will be held in escrow and disbursed to you after the buyer is admitted.
            </Text>
            {!!publishedListingId && (
              <Text style={styles.listingId} numberOfLines={1}>
                Listing ID: {publishedListingId}
              </Text>
            )}
            <FintechButton
              title="View in Marketplace"
              onPress={() => router.push('/(tabs)/marketplace')}
              icon={<ArrowRight size={17} color={theme.colors.onPrimary} />}
            />
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
