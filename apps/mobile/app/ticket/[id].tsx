import React from 'react';
import { View, ScrollView, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, Calendar, MapPin, Share2, AlertCircle, Info } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { OfflineNotice } from '../../src/components/OfflineNotice';
import { TicketPassPager } from '../../src/components/TicketPassPager';
import { useMyTickets } from '../../src/hooks/useMyTickets';
import { formatEventDateTime } from '../../src/utils/format';
import { canShowEntryQr, getPassItems, getStatusView } from '../../src/utils/ticketView';
import { styles } from '../../src/styles/ticket-detail.styles';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tickets, isLoading, isOffline, lastUpdatedAt, error, refetch } = useMyTickets();

  const ticket = tickets.find((item) => item.escrowId === id) ?? null;

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        title: 'TicketShield Pass',
        message: `I have a ticket for ${ticket.eventName} — Tier ${ticket.tierName} (${ticket.seatZone}).`,
      });
    } catch {
      // User cancelled share
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading entry pass...</Text>
      </View>
    );
  }

  if (!ticket && error && !isOffline) {
    return (
      <View style={styles.center}>
        <View style={styles.notFoundIcon}>
          <AlertCircle size={30} color={theme.colors.danger} />
        </View>
        <Text style={styles.notFoundTitle}>Unable to Load Ticket</Text>
        <Text style={styles.notFoundDesc}>{error.message}</Text>
        <FintechButton
          title="Try Again"
          onPress={() => refetch()}
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
        <Text style={styles.notFoundDesc}>This ticket is no longer in your wallet.</Text>
        <FintechButton
          title="Back to Tickets"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backBtn}
        />
      </View>
    );
  }

  const status = getStatusView(ticket.status);
  const passItems = getPassItems(ticket);
  const showPass = canShowEntryQr(ticket);
  const isBundle = passItems.length > 1;

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
        {isOffline && <OfflineNotice lastUpdatedAt={lastUpdatedAt} />}

        <View style={styles.posterCard}>
          <EventPoster seed={ticket.eventId || ticket.escrowId} height={150} />
          <View style={styles.verifiedTag}>
            <ShieldCheck size={15} color={theme.colors.success} />
            <Text style={styles.verifiedTagText}>Verified TicketShield Pass</Text>
          </View>
        </View>

        <View style={styles.passCard}>
          <View style={styles.passHeader}>
            <Text style={styles.eventName}>{ticket.eventName}</Text>
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

          {showPass ? (
            <TicketPassPager items={passItems} />
          ) : (
            <View style={styles.noPass}>
              <Text style={styles.noPassTitle}>No entry pass</Text>
              <Text style={styles.noPassDesc}>
                {status.label === 'Refunded'
                  ? 'This ticket was refunded and can no longer be used for entry.'
                  : 'Your entry pass is not available yet.'}
              </Text>
            </View>
          )}

          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Tier</Text>
              <Text style={styles.specValuePrimary} numberOfLines={1}>
                {ticket.tierName}
              </Text>
            </View>
            {!isBundle && (
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Seat Zone</Text>
                <Text style={styles.specValue} numberOfLines={1}>
                  {ticket.seatZone}
                </Text>
              </View>
            )}
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Holder</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {ticket.recipientName}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Status</Text>
              <Text style={status.tone === 'ready' ? styles.specValueSuccess : styles.specValueMuted}>
                {status.label}
              </Text>
            </View>
          </View>

          <View style={styles.rulesCard}>
            <View style={styles.rulesHeader}>
              <Info size={15} color={theme.colors.textSecondary} />
              <Text style={styles.rulesTitle}>Admission Guidelines</Text>
            </View>
            <Text style={styles.rulesItem}>
              • Show this QR code at the gate. Staff can also enter the ticket code by hand.
            </Text>
            <Text style={styles.rulesItem}>
              • Keep your code private: each ticket can only be used once.
            </Text>
            <Text style={styles.rulesItem}>
              • Your pass is saved on this phone, so it still opens without a connection.
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
