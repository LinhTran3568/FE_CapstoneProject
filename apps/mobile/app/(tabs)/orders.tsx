import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { fontFamilies } from '../../src/theme/typography';
import { resaleListingsApi } from '@ticketshield/api-client';
import { FintechButton } from '../../src/components/FintechButton';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';

interface MobileEscrowOrder {
  orderId: string;
  listingId: string;
  eventName: string;
  tierName: string;
  seatZone: string;
  totalPaid: number;
  paymentReference: string;
  status: 'ESCROW_HOLDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  ticketPassCode: string;
}

export default function MobileOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<MobileEscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const tickets = await resaleListingsApi.getMyPurchasedTickets();
      const mappedOrders: MobileEscrowOrder[] = (tickets || []).map((t) => ({
        orderId: t.escrowId ? `ORD-${t.escrowId.slice(-8).toUpperCase()}` : `ORD-${t.ticketPassCode}`,
        listingId: t.listingId,
        eventName: t.eventName,
        tierName: t.tierName,
        seatZone: t.seatZone || 'General Admission',
        totalPaid: t.totalAmountPaid,
        paymentReference: t.paymentReference || 'TS-ESCROW',
        status: t.status === 'VALID' ? 'COMPLETED' : t.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
        createdAt: t.purchasedAt || new Date().toISOString(),
        ticketPassCode: t.ticketPassCode,
      }));
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

      <View style={styles.escrowNotice}>
        <ShieldCheck size={14} color={theme.colors.success} />
        <Text style={styles.escrowNoticeText}>
          {item.status === 'ESCROW_HOLDING'
            ? 'Funds are locked in Escrow and will be released to seller after admission.'
            : item.status === 'COMPLETED'
              ? 'Admission verified. Escrow settlement successfully disbursed.'
              : 'Order was cancelled and any held deposit refunded.'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.viewPassBtn}
        onPress={() => router.push('/(tabs)/tickets')}
        activeOpacity={0.8}
      >
        <Text style={styles.viewPassBtnText}>View Ticket in Wallet</Text>
        <ArrowRight size={15} color={theme.colors.primary} />
      </TouchableOpacity>
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
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerBox: {
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
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
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
  emptyBtn: {
    marginTop: theme.spacing.xl,
    minWidth: 200,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.semibold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  statusBadgeWarning: {
    backgroundColor: theme.colors.warningLight,
  },
  statusBadgeSuccess: {
    backgroundColor: theme.colors.successLight,
  },
  statusBadgeDanger: {
    backgroundColor: theme.colors.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.4,
  },
  statusTextWarning: {
    color: theme.colors.warning,
  },
  statusTextSuccess: {
    color: theme.colors.success,
  },
  statusTextDanger: {
    color: theme.colors.danger,
  },
  eventName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginTop: 4,
  },
  infoCol: {
    flex: 1,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginTop: 2,
  },
  priceValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginTop: 2,
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  viewPassBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});
