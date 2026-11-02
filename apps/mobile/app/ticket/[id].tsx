import React, { useEffect, useState } from 'react';
import {
  View,
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
  Share2,
  AlertCircle,
  Info,
  QrCode,
  ShieldAlert,
  Clock,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { expandPurchasedTickets, getIssuedQrImageUrl } from '../../src/utils/purchasedTickets';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { formatEventDateTime } from '../../src/utils/format';
import { styles } from '../../src/styles/ticket-detail.styles';
import { DisputeTicketModal } from '../../src/components/DisputeTicketModal';

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
  const [qrLoadFailed, setQrLoadFailed] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const loadTicket = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const allTickets = expandPurchasedTickets(await resaleListingsApi.getMyPurchasedTickets());
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
    if (ticket) setQrLoadFailed(false);
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

  // The buyer receives the digital pass as soon as payment succeeds. Escrow
  // protects the seller payout only, so it must not hide an issued QR pass.
  const isUsable = ticket.status === 'VALID' || ticket.status === 'IN_ESCROW';

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
                    uri: getIssuedQrImageUrl(ticket),
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onError={() => setQrLoadFailed(true)}
                />
              )}
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
              • Present the QR issued by the organizer at the entrance.
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

          {Boolean(ticket.escrowId) && (
            <TouchableOpacity
              style={[
                styles.disputeBtn,
                Boolean(ticket.disputeId || ticket.status === 'DISPUTED') &&
                  styles.disputeBtnActive,
              ]}
              onPress={() => setIsDisputeModalOpen(true)}
              activeOpacity={0.85}
            >
              {ticket.disputeId || ticket.status === 'DISPUTED' ? (
                <>
                  <Clock size={16} color={theme.colors.warning} />
                  <Text style={styles.disputeBtnTextActive}>
                    View Dispute Progress
                  </Text>
                </>
              ) : (
                <>
                  <ShieldAlert size={16} color={theme.colors.danger} />
                  <Text style={styles.disputeBtnText}>
                    Report Ticket Issue (Escrow)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <DisputeTicketModal
            visible={isDisputeModalOpen}
            ticket={ticket}
            onClose={() => setIsDisputeModalOpen(false)}
            onDisputeSubmitted={(disputeId) => {
              setTicket((prev) =>
                prev ? { ...prev, status: 'DISPUTED', disputeId } : null
              );
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}
