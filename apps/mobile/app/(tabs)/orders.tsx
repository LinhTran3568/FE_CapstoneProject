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
  ArrowRight,
  Calendar,
  Receipt,
  AlertTriangle,
  Ticket,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { ListingCard } from '../../src/components/ListingCard';
import { MoneyBadge } from '../../src/components/MoneyBadge';
import { useMyListings } from '../../src/hooks/useMyListings';
import { useMyTickets } from '../../src/hooks/useMyTickets';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';
import { getPurchaseMoneyLabel, type MoneyLabel } from '../../src/utils/orderView';
import { styles } from '../../src/styles/orders.styles';

type OrdersTab = 'purchases' | 'listings';

const TABS: { key: OrdersTab; label: string }[] = [
  { key: 'purchases', label: 'Purchases' },
  { key: 'listings', label: 'My Listings' },
];

interface PurchaseOrder {
  orderId: string;
  eventName: string;
  tierName: string;
  seatZone: string;
  totalPaid: number;
  money: MoneyLabel;
  createdAt: string;
}

export default function MobileOrdersScreen() {
  const router = useRouter();
  const { tickets, isLoading: loading, error: loadError, refetch } = useMyTickets();
  const {
    data: listingsData,
    isPending: listingsPending,
    isError: listingsFailed,
    isFetching: listingsFetching,
    error: listingsLoadError,
    refetch: refetchListings,
  } = useMyListings();
  const [activeTab, setActiveTab] = useState<OrdersTab>('purchases');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchListings();
    }, [refetch, refetchListings])
  );

  const orders: PurchaseOrder[] = tickets.map((t) => ({
    orderId: t.escrowId ? `ORD-${t.escrowId.slice(-8).toUpperCase()}` : `ORD-${t.ticketPassCode}`,
    eventName: t.eventName,
    tierName: t.tierName,
    seatZone: t.seatZone || 'General Admission',
    totalPaid: t.totalAmountPaid,
    money: getPurchaseMoneyLabel(t.status),
    createdAt: t.purchasedAt || new Date().toISOString(),
  }));

  const error = loadError && orders.length === 0 ? loadError.message : null;
  const listings = listingsData ?? [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await (activeTab === 'purchases' ? refetch() : refetchListings());
    setRefreshing(false);
  };

  const renderOrder = ({ item }: { item: PurchaseOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <Text style={styles.orderIdText}>{item.orderId}</Text>
        <MoneyBadge money={item.money} />
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

  const renderLoading = (message: string) => (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );

  const renderPurchasesEmpty = () =>
    error ? (
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
    ) : (
      <View style={styles.centerBox}>
        <View style={styles.stateIcon}>
          <Receipt size={30} color={theme.colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Tickets Found</Text>
        <Text style={styles.emptyDesc}>
          You have not purchased any event tickets yet. Explore verified tickets protected by
          TicketShield escrow.
        </Text>
        <FintechButton
          title="Browse Marketplace"
          onPress={() => router.push('/(tabs)/marketplace')}
          style={styles.emptyBtn}
        />
      </View>
    );

  const renderListingsEmpty = () =>
    listingsFailed && listingsData === undefined ? (
      <View style={styles.centerBox}>
        <View style={styles.stateIcon}>
          <AlertTriangle size={26} color={theme.colors.danger} />
        </View>
        <Text style={styles.emptyTitle}>Unable to load listings</Text>
        <Text style={styles.emptyDesc}>
          {listingsLoadError instanceof Error
            ? listingsLoadError.message
            : 'Please check your connection and try again.'}
        </Text>
        <FintechButton
          title="Retry"
          onPress={() => refetchListings()}
          loading={listingsFetching}
          variant="secondary"
          style={styles.emptyBtn}
        />
      </View>
    ) : (
      <View style={styles.centerBox}>
        <View style={styles.stateIcon}>
          <Ticket size={30} color={theme.colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No tickets listed yet</Text>
        <Text style={styles.emptyDesc}>
          Verify and list your official tickets with 100% funds protection.
        </Text>
        <FintechButton
          title="SELL A TICKET"
          onPress={() => router.push('/verify')}
          style={styles.emptyBtn}
        />
      </View>
    );

  const renderPurchases = () =>
    loading ? (
      renderLoading('Loading your orders...')
    ) : (
      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId}
        renderItem={renderOrder}
        contentContainerStyle={[styles.listContent, orders.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderPurchasesEmpty()}
      />
    );

  const renderListings = () =>
    listingsPending ? (
      renderLoading('Loading your listings...')
    ) : (
      <FlatList
        data={listings}
        keyExtractor={(item) => item.listingId}
        renderItem={({ item }) => <ListingCard listing={item} />}
        contentContainerStyle={[
          styles.listContent,
          listings.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderListingsEmpty()}
      />
    );

  return (
    <View style={styles.container}>
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {TABS.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.segmentTab, selected && styles.segmentTabActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {activeTab === 'purchases' ? renderPurchases() : renderListings()}
    </View>
  );
}
