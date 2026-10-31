import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  RefreshCw,
  Share2,
  AlertCircle,
  Info,
  QrCode,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { fontFamilies } from '../../src/theme/typography';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { generateRotatingToken } from '../../src/utils/totp';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { formatEventDateTime } from '../../src/utils/format';

const STATUS_LABELS: Record<string, string> = {
  VALID: 'Valid — Ready for Admission',
  USED: 'Checked In',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  TRANSFERRED: 'Transferred',
  PENDING_VERIFICATION: 'Pending Verification',
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [ticket, setTicket] = useState<PurchasedTicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rotatingToken, setRotatingToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  const loadTicket = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const allTickets = await resaleListingsApi.getMyPurchasedTickets();
      const found =
        (allTickets || []).find(
          (t) => t.ticketPassCode === id || t.listingId === id || t.escrowId === id
        ) || null;
      setTicket(found);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Unable to load ticket. Check network connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    if (!ticket) return;
    setQrLoadFailed(false);

    const updateToken = () => {
      const res = generateRotatingToken(ticket.ticketPassCode);
      setRotatingToken(res.token);
      setSecondsRemaining(res.secondsRemaining);
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [ticket]);

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        title: 'TicketShield Pass',
        message: `I have a ticket for ${ticket.eventName} — Tier ${ticket.tierName} (${ticket.seatZone}). Open TicketShield to access the live entry pass.`,
      });
    } catch {
      // User cancelled share
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading entry pass...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <View style={styles.notFoundIcon}>
          <AlertCircle size={30} color={theme.colors.danger} />
        </View>
        <Text style={styles.notFoundTitle}>Unable to Load Ticket</Text>
        <Text style={styles.notFoundDesc}>{loadError}</Text>
        <FintechButton
          title="Try Again"
          onPress={loadTicket}
          variant="secondary"
          style={styles.backBtn}
        />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <View style={styles.notFoundIcon}>
          <AlertCircle size={30} color={theme.colors.danger} />
        </View>
        <Text style={styles.notFoundTitle}>Ticket Not Found</Text>
        <Text style={styles.notFoundDesc}>
          This ticket code does not exist or has expired.
        </Text>
        <FintechButton
          title="Back to Tickets"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backBtn}
        />
      </View>
    );
  }

  const isUsable = ticket.status === 'VALID';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Digital Pass',
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
        <View style={styles.posterCard}>
          <EventPoster seed={ticket.eventId || ticket.ticketPassCode} height={150} />
          <View style={styles.verifiedTag}>
            <ShieldCheck size={15} color={theme.colors.success} />
            <Text style={styles.verifiedTagText}>Verified TicketShield Pass</Text>
          </View>
        </View>

        <View style={styles.passCard}>
          <View style={styles.passHeader}>
            <Text style={styles.eventName}>{ticket.eventName}</Text>
            <Text style={styles.passCode} numberOfLines={1}>
              {ticket.ticketPassCode}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Calendar size={15} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{formatEventDateTime(ticket.eventStartAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={15} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{ticket.eventVenue}</Text>
          </View>

          <View style={styles.tearDivider}>
            <View style={styles.tearHoleLeft} />
            <View style={styles.tearLine} />
            <View style={styles.tearHoleRight} />
          </View>

          <View style={styles.qrContainer}>
            <View style={styles.qrWhiteBox}>
              {qrLoadFailed ? (
                <View style={styles.qrFallback}>
                  <QrCode size={44} color="#0C0A09" />
                  <Text style={styles.qrFallbackTitle}>Unable to display QR</Text>
                  <Text style={styles.qrFallbackHint}>
                    Present this pass code to gate staff:
                  </Text>
                  <Text style={styles.qrFallbackCode}>{ticket.ticketPassCode}</Text>
                </View>
              ) : (
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      rotatingToken || ticket.ticketPassCode
                    )}`,
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onError={() => setQrLoadFailed(true)}
                />
              )}
            </View>

            <View style={styles.countdownPill}>
              <RefreshCw size={14} color={theme.colors.primary} />
              <Text style={styles.countdownPillText}>
                Refreshes in <Text style={styles.countdownSeconds}>{secondsRemaining}s</Text>
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(0, Math.min(100, (secondsRemaining / 30) * 100))}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Tier</Text>
              <Text style={styles.specValuePrimary} numberOfLines={1}>
                {ticket.tierName}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Seat Zone</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {ticket.seatZone}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Holder</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {ticket.recipientName}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Status</Text>
              <Text style={isUsable ? styles.specValueSuccess : styles.specValueMuted}>
                {STATUS_LABELS[ticket.status] || ticket.status}
              </Text>
            </View>
          </View>

          <View style={styles.rulesCard}>
            <View style={styles.rulesHeader}>
              <Info size={15} color={theme.colors.textSecondary} />
              <Text style={styles.rulesTitle}>Admission Guidelines</Text>
            </View>
            <Text style={styles.rulesItem}>
              • Each dynamic QR code is valid for a single scanner check-in at the entrance.
            </Text>
            <Text style={styles.rulesItem}>
              • Do not share screenshots: expired codes will be rejected by gate scanners.
            </Text>
            <Text style={styles.rulesItem}>
              • Escrow settlement is finalized once you are admitted to the event.
            </Text>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Share2 size={16} color={theme.colors.text} />
            <Text style={styles.shareBtnText}>Share Pass Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  notFoundIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  notFoundDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 280,
  },
  backBtn: {
    marginTop: theme.spacing.xl,
    minWidth: 180,
  },
  posterCard: {
    position: 'relative',
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
  },
  verifiedTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.badgeScrim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
  },
  verifiedTagText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
  },
  passCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
  },
  passHeader: {
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  eventName: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    lineHeight: 30,
  },
  passCode: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  tearDivider: {
    position: 'relative',
    marginVertical: theme.spacing.xl,
    justifyContent: 'center',
  },
  tearHoleLeft: {
    position: 'absolute',
    left: -theme.spacing.xl - 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
  },
  tearHoleRight: {
    position: 'absolute',
    right: -theme.spacing.xl - 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.background,
  },
  tearLine: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    borderStyle: 'dashed',
    marginHorizontal: 12,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrWhiteBox: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 230,
    height: 230,
  },
  qrFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qrFallbackTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: '#0C0A09',
  },
  qrFallbackHint: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  qrFallbackCode: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.mono,
    color: '#0C0A09',
    fontWeight: theme.typography.weights.bold,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    marginTop: theme.spacing.md,
  },
  countdownPillText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  countdownSeconds: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  progressTrack: {
    width: 200,
    height: 3,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  specBox: {
    width: '47%',
  },
  specLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginTop: 2,
  },
  specValuePrimary: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  specValueSuccess: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    marginTop: 2,
  },
  specValueMuted: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rulesCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: 6,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rulesTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rulesItem: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.lg,
  },
  shareBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
});
