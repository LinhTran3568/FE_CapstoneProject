import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import {
  Ticket,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  RefreshCw,
  X,
  Share2,
  AlertTriangle,
  ScanLine,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { fontFamilies } from '../../src/theme/typography';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { ticketService } from '../../src/services/ticketService';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { formatEventDate } from '../../src/utils/format';

const STATUS_LABELS: Record<string, string> = {
  VALID: 'Valid for Entry',
  USED: 'Checked In',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  TRANSFERRED: 'Transferred',
  PENDING_VERIFICATION: 'Pending Verification',
};

export default function MobileTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<PurchasedTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<PurchasedTicketDto | null>(null);
  const [rotatingToken, setRotatingToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getUserTickets();
      setTickets(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to sync tickets. Please try again.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets(true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!selectedTicket) return;
    setQrLoadFailed(false);

    const updateToken = () => {
      const res = ticketService.generateRotatingToken(selectedTicket.ticketPassCode);
      setRotatingToken(res.token);
      setSecondsRemaining(res.secondsRemaining);
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleShareTicket = async () => {
    if (!selectedTicket) return;
    try {
      await Share.share({
        title: 'TicketShield Pass',
        message: `I have a ticket for ${selectedTicket.eventName} — Tier ${selectedTicket.tierName} (${selectedTicket.seatZone}). Open TicketShield to view digital pass.`,
      });
    } catch {
      // User cancelled share
    }
  };

  const renderStatusBadge = (status: string) => {
    const isValid = status === 'VALID';
    return (
      <View style={[styles.statusBadge, isValid ? styles.statusBadgeValid : styles.statusBadgeMuted]}>
        {isValid ? (
          <ShieldCheck size={13} color={theme.colors.success} />
        ) : (
          <AlertTriangle size={13} color={theme.colors.textMuted} />
        )}
        <Text style={[styles.statusText, isValid && styles.statusTextValid]}>
          {STATUS_LABELS[status] || status}
        </Text>
      </View>
    );
  };

  const renderTicket = ({ item }: { item: PurchasedTicketDto }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => setSelectedTicket(item)}
      activeOpacity={0.9}
    >
      <View style={styles.posterWrap}>
        <EventPoster seed={item.eventId || item.ticketPassCode} height={104} />
        <View style={styles.posterOverlay}>
          {renderStatusBadge(item.status)}
          <View style={styles.openQrPill}>
            <QrCode size={13} color={theme.colors.onPrimary} />
            <Text style={styles.openQrPillText}>Show Pass</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.eventName} numberOfLines={2}>
          {item.eventName}
        </Text>

        <View style={styles.metaRow}>
          <Calendar size={14} color={theme.colors.textMuted} />
          <Text style={styles.metaText}>{formatEventDate(item.eventStartAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={theme.colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.eventVenue}
          </Text>
        </View>

        <View style={styles.dottedDivider}>
          <View style={styles.notchLeft} />
          <View style={styles.dashLine} />
          <View style={styles.notchRight} />
        </View>

        <View style={styles.ticketDetailsRow}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Tier</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.tierName}
            </Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Zone / Seat</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.seatZone}
            </Text>
          </View>
          <Text style={styles.ticketCode}>•••• {item.ticketPassCode.slice(-4)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Syncing your tickets...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <View style={styles.stateIcon}>
            <AlertTriangle size={26} color={theme.colors.danger} />
          </View>
          <Text style={styles.emptyTitle}>Unable to load tickets</Text>
          <Text style={styles.emptyDesc}>{error}</Text>
          <FintechButton
            title="Try Again"
            onPress={() => fetchTickets()}
            variant="secondary"
            style={styles.exploreBtn}
          />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.stateIcon}>
            <Ticket size={30} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Ticket Wallet is Empty</Text>
          <Text style={styles.emptyDesc}>
            You do not own any tickets yet. Explore the Marketplace to purchase verified tickets backed by guaranteed escrow protection.
          </Text>
          <FintechButton
            title="Explore Marketplace"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketPassCode}
          renderItem={renderTicket}
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View style={styles.securityBanner}>
              <ScanLine size={18} color={theme.colors.success} />
              <Text style={styles.securityBannerText}>
                QR code rotates every 30 seconds to prevent duplication and screenshot fraud.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ticketModalCard}>
            <View style={styles.modalTopBar}>
              <View style={styles.verifiedTag}>
                <ShieldCheck size={15} color={theme.colors.success} />
                <Text style={styles.verifiedTagText}>Official TicketShield Pass</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedTicket(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <ScrollView
                contentContainerStyle={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalEventName}>{selectedTicket.eventName}</Text>

                <View style={styles.qrCodeWrapper}>
                  {qrLoadFailed ? (
                    <View style={styles.qrFallback}>
                      <QrCode size={40} color="#0C0A09" />
                      <Text style={styles.qrFallbackTitle}>Unable to display QR</Text>
                      <Text style={styles.qrFallbackHint}>
                        Present your ticket pass code to gate staff:
                      </Text>
                      <Text style={styles.qrFallbackCode}>{selectedTicket.ticketPassCode}</Text>
                    </View>
                  ) : (
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                          rotatingToken || selectedTicket.ticketPassCode
                        )}`,
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                      onError={() => setQrLoadFailed(true)}
                    />
                  )}

                  <View style={styles.tokenTimerRow}>
                    <RefreshCw size={14} color="#0C0A09" />
                    <Text style={styles.tokenTimerText}>
                      Refreshes in{' '}
                      <Text style={styles.timerHighlight}>{secondsRemaining}s</Text>
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

                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Tier</Text>
                    <Text style={styles.infoColValue}>{selectedTicket.tierName}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Zone / Seat</Text>
                    <Text style={styles.infoColValue}>{selectedTicket.seatZone}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Ticket Holder</Text>
                    <Text style={styles.infoColValue}>{selectedTicket.recipientName}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Event Time</Text>
                    <Text style={styles.infoColValue}>
                      {formatEventDate(selectedTicket.eventStartAt, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={handleShareTicket}
                    activeOpacity={0.8}
                  >
                    <Share2 size={16} color={theme.colors.text} />
                    <Text style={styles.shareBtnText}>Share Pass</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailPageBtn}
                    onPress={() => {
                      const ticketId = selectedTicket.ticketPassCode;
                      setSelectedTicket(null);
                      router.push(`/ticket/${ticketId}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailPageBtnText}>Full Pass Details</Text>
                  </TouchableOpacity>
                </View>
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
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  emptyDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  exploreBtn: {
    marginTop: theme.spacing.xl,
    minWidth: 200,
  },
  scrollList: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.successBorder,
    marginBottom: theme.spacing.xs,
  },
  securityBannerText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  ticketCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  posterWrap: {
    position: 'relative',
  },
  posterOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.badgeScrim,
    borderWidth: 1,
  },
  statusBadgeValid: {
    borderColor: theme.colors.successBorder,
  },
  statusBadgeMuted: {
    borderColor: theme.colors.border,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  statusTextValid: {
    color: theme.colors.success,
  },
  openQrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  openQrPillText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.onPrimary,
  },
  cardBody: {
    padding: theme.spacing.lg,
  },
  eventName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  dottedDivider: {
    position: 'relative',
    marginVertical: theme.spacing.md,
    justifyContent: 'center',
  },
  notchLeft: {
    position: 'absolute',
    left: -theme.spacing.lg - 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
  },
  notchRight: {
    position: 'absolute',
    right: -theme.spacing.lg - 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
  },
  dashLine: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    borderStyle: 'dashed',
    marginHorizontal: 10,
  },
  ticketDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailCol: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  ticketCode: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  ticketModalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTagText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  closeBtn: {
    padding: theme.spacing.xs,
  },
  modalScroll: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  modalEventName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 290,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrFallback: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
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
    marginTop: 4,
  },
  tokenTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
  },
  tokenTimerText: {
    fontSize: theme.typography.sizes.xs,
    color: '#333333',
    fontWeight: theme.typography.weights.medium,
  },
  timerHighlight: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  infoCol: {
    width: '47%',
  },
  infoColLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  infoColValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shareBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  detailPageBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
  },
  detailPageBtnText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.onPrimary,
  },
});
