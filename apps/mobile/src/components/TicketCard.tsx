import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AlertTriangle, Calendar, Info, MapPin, QrCode, ShieldCheck } from 'lucide-react-native';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { Text } from './AppText';
import { EventPoster } from './EventPoster';
import { theme } from '../theme';
import { formatEventDate } from '../utils/format';
import {
  canShowEntryQr,
  getPassActionLabel,
  getStatusView,
  getTicketCount,
  type TicketStatusTone,
} from '../utils/ticketView';
import { styles } from './TicketCard.styles';

interface TicketCardProps {
  ticket: PurchasedTicketDto;
  onPress: () => void;
}

const TONE_COLOR: Record<TicketStatusTone, string> = {
  ready: theme.colors.success,
  warning: theme.colors.warning,
  muted: theme.colors.textMuted,
};

const TONE_BADGE = {
  ready: styles.statusBadgeReady,
  warning: styles.statusBadgeWarning,
  muted: styles.statusBadgeMuted,
};

export function TicketCard({ ticket, onPress }: TicketCardProps) {
  const status = getStatusView(ticket.status);
  const StatusIcon =
    status.tone === 'ready' ? ShieldCheck : status.tone === 'warning' ? AlertTriangle : Info;
  const ticketCount = getTicketCount(ticket);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${ticket.eventName}, ${status.label}`}
    >
      <View style={styles.posterWrap}>
        <EventPoster seed={ticket.eventId || ticket.escrowId} height={104} />
        <View style={styles.posterOverlay}>
          <View style={[styles.statusBadge, TONE_BADGE[status.tone]]}>
            <StatusIcon size={13} color={TONE_COLOR[status.tone]} />
            <Text style={[styles.statusText, { color: TONE_COLOR[status.tone] }]}>{status.label}</Text>
          </View>
          {canShowEntryQr(ticket) && (
            <View style={styles.passPill}>
              <QrCode size={13} color={theme.colors.onPrimary} />
              <Text style={styles.passPillText}>{getPassActionLabel(ticket)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eventName} numberOfLines={2}>
          {ticket.eventName}
        </Text>

        <View style={styles.metaRow}>
          <Calendar size={14} color={theme.colors.textMuted} />
          <Text style={styles.metaText}>{formatEventDate(ticket.eventStartAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={theme.colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {ticket.eventVenue}
          </Text>
        </View>

        <View style={styles.tearLine}>
          <View style={styles.notchLeft} />
          <View style={styles.dashLine} />
          <View style={styles.notchRight} />
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Tier</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {ticket.tierName}
            </Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>{ticketCount >= 2 ? 'Combo Package' : 'Zone / Seat'}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {ticketCount >= 2 ? `${ticketCount} TICKETS` : ticket.seatZone}
            </Text>
          </View>
          {ticket.ticketPassCode ? (
            <Text style={styles.ticketCode}>•••• {ticket.ticketPassCode.slice(-4)}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
