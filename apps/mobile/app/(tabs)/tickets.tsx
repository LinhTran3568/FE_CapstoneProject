import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
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
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { generateRotatingToken } from '../../src/utils/totp';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { formatEventDate } from '../../src/utils/format';
import { styles } from '../../src/styles/tickets.styles';

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
      const data = await resaleListingsApi.getMyPurchasedTickets();
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
      const res = generateRotatingToken(selectedTicket.ticketPassCode);
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
