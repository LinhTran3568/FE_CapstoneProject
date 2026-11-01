import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  XCircle,
  Receipt,
  AlertTriangle,
  Search,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { resaleListingsApi } from '@ticketshield/api-client';
import { FintechButton } from '../../src/components/FintechButton';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';
import { styles } from '../../src/styles/orders.styles';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { DisputeTicketModal } from '../../src/components/DisputeTicketModal';

interface MobileEscrowOrder {
  orderId: string;
  listingId: string;
  eventName: string;
  tierName: string;
  seatZone: string;
  totalPaid: number;
  paymentReference: string;
  status: 'ESCROW_HOLDING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  createdAt: string;
  ticketPassCode: string;
  disputeId?: string | null;
  escrowId?: string | null;
}

type OrderStatusFilter = 'ALL' | 'ESCROW_HOLDING' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';

interface OrderFilterItem {
  key: OrderStatusFilter;
  label: string;
  icon: any;
}

const ORDER_FILTERS: OrderFilterItem[] = [
  { key: 'ALL', label: 'All Orders', icon: Receipt },
  { key: 'ESCROW_HOLDING', label: 'In Escrow', icon: Clock },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  { key: 'DISPUTED', label: 'Disputed', icon: ShieldAlert },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle },
];

export default function MobileOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<MobileEscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedOrderTicket, setSelectedOrderTicket] = useState<PurchasedTicketDto | null>(null);

  const counts = useMemo(() => {
    const holding = orders.filter((o) => o.status === 'ESCROW_HOLDING').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const disputed = orders.filter((o) => o.status === 'DISPUTED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    return {
      ALL: orders.length,
      ESCROW_HOLDING: holding,
      COMPLETED: completed,
      DISPUTED: disputed,
      CANCELLED: cancelled,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedStatus !== 'ALL' && order.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (order.orderId || '').toLowerCase().includes(q);
        const matchName = (order.eventName || '').toLowerCase().includes(q);
        const matchTier = (order.tierName || '').toLowerCase().includes(q);
        const matchZone = (order.seatZone || '').toLowerCase().includes(q);
        const matchRef = (order.paymentReference || '').toLowerCase().includes(q);
        const matchCode = (order.ticketPassCode || '').toLowerCase().includes(q);
        return matchId || matchName || matchTier || matchZone || matchRef || matchCode;
      }
      return true;
    });
  }, [orders, selectedStatus, searchQuery]);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const tickets = await resaleListingsApi.getMyPurchasedTickets();
      const mappedOrders: MobileEscrowOrder[] = (tickets || []).map((t) => {
        const isDisputed = t.status === 'DISPUTED' || Boolean(t.disputeId);
        return {
          orderId: t.escrowId ? `ORD-${t.escrowId.slice(-8).toUpperCase()}` : `ORD-${t.ticketPassCode}`,
          listingId: t.listingId,
          eventName: t.eventName,
          tierName: t.tierName,
          seatZone: t.seatZone || 'General Admission',
          totalPaid: t.totalAmountPaid,
          paymentReference: t.paymentReference || 'TS-ESCROW',
          status: isDisputed
            ? 'DISPUTED'
            : t.status === 'VALID'
              ? 'COMPLETED'
              : t.status === 'CANCELLED'
                ? 'CANCELLED'
                : 'ESCROW_HOLDING',
          createdAt: t.purchasedAt || new Date().toISOString(),
          ticketPassCode: t.ticketPassCode,
          disputeId: t.disputeId || null,
          escrowId: t.escrowId || null,
        };
      });
      setOrders(mappedOrders);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load orders. Please try again.';
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  };

  const getStatusBadge = (status: MobileEscrowOrder['status']) => {
    if (status === 'DISPUTED') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeDisputed]}>
          <ShieldAlert size={13} color={theme.colors.danger} />
          <Text style={[styles.statusText, styles.statusTextDisputed]}>Disputed (Frozen)</Text>
        </View>
      );
    }
    if (status === 'ESCROW_HOLDING') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
          <Clock size={13} color={theme.colors.warning} />
          <Text style={[styles.statusText, styles.statusTextWarning]}>Escrow Holding</Text>
        </View>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
          <CheckCircle2 size={13} color={theme.colors.success} />
          <Text style={[styles.statusText, styles.statusTextSuccess]}>Completed</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusBadgeDanger]}>
        <XCircle size={13} color={theme.colors.danger} />
        <Text style={[styles.statusText, styles.statusTextDanger]}>Cancelled</Text>
      </View>
    );
  };

  const handleReportOrder = (item: MobileEscrowOrder) => {
    const isDisputed = item.status === 'DISPUTED' || Boolean(item.disputeId);
    const syntheticTicket: PurchasedTicketDto = {
      escrowId: item.escrowId || item.orderId.replace('ORD-', ''),
      listingId: item.listingId,
      eventId: '',
      eventName: item.eventName,
      eventVenue: 'Venue',
      eventStartAt: item.createdAt,
      tierName: item.tierName,
      seatZone: item.seatZone,
      ticketPassCode: item.ticketPassCode,
      totalAmountPaid: item.totalPaid,
      status: isDisputed ? 'DISPUTED' : item.status === 'COMPLETED' ? 'VALID' : 'IN_ESCROW',
      disputeId: item.disputeId || null,
      recipientName: 'Ticket Holder',
      recipientEmail: '',
      qrCodeData: item.ticketPassCode,
      qrCodeImageUrl: '',
      purchasedAt: item.createdAt,
    };
    setSelectedOrderTicket(syntheticTicket);
    setIsDisputeModalOpen(true);
  };

  const renderOrder = ({ item }: { item: MobileEscrowOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <Text style={styles.orderIdText}>{item.orderId}</Text>
        {getStatusBadge(item.status)}
      </View>

      <Text style={styles.eventName} numberOfLines={2}>
        {item.eventName}
      </Text>

      <View style={styles.metaRow}>
        <Calendar size={14} color={theme.colors.textMuted} />
        <Text style={styles.metaText}>
          Placed on {formatEventDateTime(item.createdAt)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Tier & Seat</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.tierName} • {item.seatZone}
          </Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.infoLabel}>Total Paid</Text>
          <Text style={styles.priceValue}>{formatPrice(item.totalPaid)}</Text>
        </View>
      </View>

      <View style={[styles.escrowNotice, item.status === 'DISPUTED' && styles.escrowNoticeDanger]}>
        {item.status === 'DISPUTED' ? (
          <ShieldAlert size={14} color={theme.colors.danger} />
        ) : (
          <ShieldCheck size={14} color={theme.colors.success} />
        )}
        <Text
          style={[
            styles.escrowNoticeText,
            item.status === 'DISPUTED' && styles.escrowNoticeTextDanger,
          ]}
        >
          {item.status === 'DISPUTED'
            ? 'Dispute opened. Payout is frozen in Escrow pending turnstile scan audit.'
            : item.status === 'ESCROW_HOLDING'
              ? 'Funds are locked in Escrow and will be released to seller after admission.'
              : item.status === 'COMPLETED'
                ? 'Admission verified. Escrow settlement successfully disbursed.'
                : 'Order was cancelled and any held deposit refunded.'}
        </Text>
      </View>

      <View style={styles.orderActionsRow}>
        <TouchableOpacity
          style={styles.viewPassBtn}
          onPress={() => router.push('/(tabs)/tickets')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewPassBtnText}>View in Wallet</Text>
          <ArrowRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>

        {item.status === 'DISPUTED' || Boolean(item.disputeId) ? (
          <TouchableOpacity
            style={styles.disputeProgressOrderBtn}
            onPress={() => handleReportOrder(item)}
            activeOpacity={0.8}
          >
            <Clock size={14} color={theme.colors.warning} />
            <Text style={styles.disputeProgressOrderBtnText}>View Dispute</Text>
          </TouchableOpacity>
        ) : item.status !== 'CANCELLED' ? (
          <TouchableOpacity
            style={styles.reportOrderBtn}
            onPress={() => handleReportOrder(item)}
            activeOpacity={0.8}
          >
            <ShieldAlert size={14} color={theme.colors.danger} />
            <Text style={styles.reportOrderBtnText}>Report Issue</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <View style={styles.stateIcon}>
            <AlertTriangle size={26} color={theme.colors.danger} />
          </View>
          <Text style={styles.emptyTitle}>Unable to load orders</Text>
          <Text style={styles.emptyDesc}>{error}</Text>
          <FintechButton
            title="Try Again"
            onPress={() => fetchOrders()}
            variant="secondary"
            style={styles.emptyBtn}
          />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.stateIcon}>
            <Receipt size={30} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyDesc}>
            When you purchase resale tickets through Escrow, your payment tracking and receipts will appear here.
          </Text>
          <FintechButton
            title="Browse Marketplace"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <>
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Search size={18} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search orders, events, reference..."
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
              {ORDER_FILTERS.map((filter) => {
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
            data={filteredOrders}
            keyExtractor={(item) => item.orderId}
            renderItem={renderOrder}
            contentContainerStyle={[
              styles.listContent,
              filteredOrders.length === 0 && { flexGrow: 1, justifyContent: 'center' },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.filterEmptyBox}>
                <View style={styles.stateIcon}>
                  <Search size={26} color={theme.colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No Matching Orders</Text>
                <Text style={styles.emptyDesc}>
                  We could not find any orders matching your search or status filter.
                </Text>
                <FintechButton
                  title="Clear Filters"
                  onPress={() => {
                    setSelectedStatus('ALL');
                    setSearchQuery('');
                  }}
                  variant="secondary"
                  style={styles.emptyBtn}
                />
              </View>
            }
          />
        </>
      )}
      <DisputeTicketModal
        visible={isDisputeModalOpen}
        ticket={selectedOrderTicket}
        onClose={() => {
          setIsDisputeModalOpen(false);
          setSelectedOrderTicket(null);
        }}
        onDisputeSubmitted={(disputeId, ticketCode) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.ticketPassCode === ticketCode ||
              (selectedOrderTicket?.escrowId && o.escrowId === selectedOrderTicket.escrowId)
                ? { ...o, status: 'DISPUTED', disputeId }
                : o
            )
          );
          setSelectedOrderTicket((prev) =>
            prev ? { ...prev, status: 'DISPUTED', disputeId } : null
          );
        }}
      />
    </View>
  );
}
