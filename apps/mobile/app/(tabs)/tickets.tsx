import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Share,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Ticket,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  X,
  Share2,
  AlertTriangle,
  Search,
  ShieldAlert,
  Clock,
  Lock,
} from 'lucide-react-native';
import { theme, fontFamilies } from '../../src/theme';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { expandPurchasedTickets, getIssuedQrImageUrl } from '../../src/utils/purchasedTickets';
import { FintechButton } from '../../src/components/FintechButton';
import { EventPoster } from '../../src/components/EventPoster';
import { formatEventDate } from '../../src/utils/format';
import { styles } from '../../src/styles/tickets.styles';
import { DisputeTicketModal } from '../../src/components/DisputeTicketModal';

const STATUS_LABELS: Record<string, string> = {
  VALID: 'Valid for Entry',
  IN_ESCROW: 'Pass Issued · Escrow Active',
  USED: 'Checked In',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  TRANSFERRED: 'Transferred',
  PENDING_VERIFICATION: 'Pending Verification',
};

// A completed payment transfers the ticket and QR data to the buyer immediately.
// `IN_ESCROW` only means the seller payout is still protected by escrow; it does
// not mean the buyer's pass is unavailable.
const canOpenPass = (ticket: PurchasedTicketDto) =>
  (ticket.status === 'VALID' || ticket.status === 'IN_ESCROW') &&
  Boolean(ticket.qrCodeData?.trim() || ticket.qrCodeImageUrl?.trim() || ticket.ticketPassCode?.trim());

type TicketStatusFilter = 'ALL' | 'VALID' | 'USED' | 'EXPIRED';

interface TicketFilterItem {
  key: TicketStatusFilter;
  label: string;
  icon: typeof Ticket;
}

const TICKET_FILTERS: TicketFilterItem[] = [
  { key: 'ALL', label: 'All Passes', icon: Ticket },
  { key: 'VALID', label: 'Valid for Entry', icon: ShieldCheck },
  { key: 'USED', label: 'Checked In', icon: QrCode },
  { key: 'EXPIRED', label: 'Expired / Other', icon: AlertTriangle },
];

export default function MobileTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<PurchasedTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<PurchasedTicketDto | null>(null);
  const [qrLoadFailed, setQrLoadFailed] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeModalTicket, setDisputeModalTicket] = useState<PurchasedTicketDto | null>(null);

  const counts = useMemo(() => {
    const valid = tickets.filter(canOpenPass).length;
    const used = tickets.filter((t) => t.status === 'USED').length;
    const expired = tickets.filter((t) => t.status !== 'VALID' && t.status !== 'USED').length;
    return {
      ALL: tickets.length,
      VALID: valid,
      USED: used,
      EXPIRED: expired,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (selectedStatus === 'VALID' && !canOpenPass(ticket)) return false;
      if (selectedStatus === 'USED' && ticket.status !== 'USED') return false;
      if (selectedStatus === 'EXPIRED' && (canOpenPass(ticket) || ticket.status === 'USED')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (ticket.eventName || '').toLowerCase().includes(q);
        const matchVenue = (ticket.eventVenue || '').toLowerCase().includes(q);
        const matchTier = (ticket.tierName || '').toLowerCase().includes(q);
        const matchZone = (ticket.seatZone || '').toLowerCase().includes(q);
        const matchCode = (ticket.ticketPassCode || '').toLowerCase().includes(q);
        const matchBundle = (ticket.bundleItems || []).some((item) => {
          const itemCode = (item.ticketCode || item.qrCodeData || '').toLowerCase();
          const itemZone = (item.seatZone || '').toLowerCase();
          return itemCode.includes(q) || itemZone.includes(q);
        });
        return matchName || matchVenue || matchTier || matchZone || matchCode || matchBundle;
      }
      return true;
    });
  }, [tickets, selectedStatus, searchQuery]);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await resaleListingsApi.getMyPurchasedTickets();
      setTickets(expandPurchasedTickets(data));
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

  useFocusEffect(
    useCallback(() => {
      fetchTickets(true);
    }, [fetchTickets])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets(true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (selectedTicket) setQrLoadFailed(false);
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
    if (status === 'DISPUTED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.dangerBorder }]}>
          <ShieldAlert size={13} color={theme.colors.danger} />
          <Text style={[styles.statusText, { color: theme.colors.danger, fontFamily: fontFamilies.bold }]}>
            DISPUTED
          </Text>
        </View>
      );
    }
    if (status === 'IN_ESCROW' || status === 'LOCKED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 152, 0, 0.15)', borderColor: 'rgba(255, 152, 0, 0.4)' }]}>
          <Lock size={12} color="#FF9800" />
          <Text style={[styles.statusText, { color: '#FF9800', fontFamily: fontFamilies.bold }]}>
            Escrow Active
          </Text>
        </View>
      );
    }
    if (status === 'CANCELLED') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
          <AlertTriangle size={12} color={theme.colors.danger} />
          <Text style={[styles.statusText, { color: theme.colors.danger, fontFamily: fontFamilies.bold }]}>
            Cancelled
          </Text>
        </View>
      );
    }
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

  const renderTicket = ({ item }: { item: PurchasedTicketDto }) => {
    const isValid = canOpenPass(item);
    return (
      <TouchableOpacity
        style={[styles.ticketCard, !isValid && { opacity: 0.75 }]}
        onPress={() => isValid && setSelectedTicket(item)}
        activeOpacity={isValid ? 0.9 : 1}
        disabled={!isValid}
      >
        <View style={styles.posterWrap}>
          <EventPoster seed={item.eventId || item.ticketPassCode} height={104} />
          <View style={styles.posterOverlay}>
            {renderStatusBadge(item.status)}
            <View style={[styles.openQrPill, !isValid && styles.lockedQrPill]}>
              {isValid ? (
                <>
                  <QrCode size={13} color={theme.colors.onPrimary} />
                  <Text style={styles.openQrPillText}>Show Pass</Text>
                </>
              ) : (
                <>
                  <Lock size={12} color={theme.colors.textMuted} />
                  <Text style={[styles.openQrPillText, styles.lockedQrPillText]}>
                    {item.status === 'USED' ? 'Checked In' : 'Invalid'}
                  </Text>
                </>
              )}
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
  };

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
          <FintechButton
            title="Explore Marketplace"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <>
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Search size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search event, venue, or ticket code..."
                placeholderTextColor={theme.colors.textPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setSearchQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <X size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
              keyboardShouldPersistTaps="handled"
            >
              {TICKET_FILTERS.map((filter) => {
                const isActive = selectedStatus === filter.key;
                const Icon = filter.icon;
                const count = counts[filter.key];
                return (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => setSelectedStatus(filter.key)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Icon
                      size={13}
                      color={isActive ? theme.colors.onPrimary : theme.colors.textMuted}
                    />
                    <Text
                      style={[styles.filterPillText, isActive && styles.filterPillTextActive]}
                    >
                      {filter.label}
                    </Text>
                    <View
                      style={[styles.filterBadge, isActive && styles.filterBadgeActive]}
                    >
                      <Text
                        style={[
                          styles.filterBadgeText,
                          isActive && styles.filterBadgeTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={filteredTickets}
            keyExtractor={(item, index) => `${item.ticketPassCode || 'ticket'}-${index}`}
            renderItem={renderTicket}
            contentContainerStyle={[
              styles.scrollList,
              filteredTickets.length === 0 && { flexGrow: 1, justifyContent: 'center' },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.filterEmptyBox}>
                <View style={styles.stateIcon}>
                  <Search size={26} color={theme.colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No Matching Tickets</Text>
                <Text style={styles.emptyDesc}>
                  We could not find any tickets matching your search or status filter.
                </Text>
                <FintechButton
                  title="Clear Filters"
                  onPress={() => {
                    setSelectedStatus('ALL');
                    setSearchQuery('');
                  }}
                  variant="secondary"
                  style={styles.exploreBtn}
                />
              </View>
            }
          />
        </>
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
                        uri: getIssuedQrImageUrl(selectedTicket),
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                      onError={() => setQrLoadFailed(true)}
                    />
                  )}

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

                {Boolean(selectedTicket.escrowId) && !selectedTicket.disputeWaived && (
                  <TouchableOpacity
                    style={[
                      styles.disputeActionBtn,
                      Boolean(selectedTicket.disputeId || selectedTicket.status === 'DISPUTED') &&
                        styles.disputeActionBtnActive,
                    ]}
                    onPress={() => {
                      setDisputeModalTicket(selectedTicket);
                      setIsDisputeModalOpen(true);
                    }}
                    activeOpacity={0.85}
                  >
                    {selectedTicket.disputeId || selectedTicket.status === 'DISPUTED' ? (
                      <>
                        <Clock size={16} color={theme.colors.warning} />
                        <Text style={styles.disputeActionTextActive}>
                          View Dispute Progress
                        </Text>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} color={theme.colors.danger} />
                        <Text style={styles.disputeActionText}>
                          Report Ticket Issue (Escrow)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <DisputeTicketModal
        visible={isDisputeModalOpen}
        ticket={disputeModalTicket}
        onClose={() => {
          setIsDisputeModalOpen(false);
          setDisputeModalTicket(null);
        }}
        onDisputeSubmitted={(disputeId, ticketCode) => {
          setTickets((prev) =>
            prev.map((t) =>
              t.ticketPassCode === ticketCode
                ? { ...t, status: 'DISPUTED', disputeId }
                : t
            )
          );
          if (selectedTicket?.ticketPassCode === ticketCode) {
            setSelectedTicket((prev) =>
              prev ? { ...prev, status: 'DISPUTED', disputeId } : null
            );
          }
        }}
      />
    </View>
  );
}
