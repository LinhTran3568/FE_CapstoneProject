import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { FintechButton } from '../../src/components/FintechButton';
import { useMyTickets } from '../../src/hooks/useMyTickets';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';
import { styles } from '../../src/styles/orders.styles';

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
  const { tickets, isLoading: loading, error: loadError, refetch } = useMyTickets();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const orders: MobileEscrowOrder[] = tickets.map((t) => ({
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

  const error = loadError && orders.length === 0 ? loadError.message : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
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
            onPress={() => refetch()}
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
