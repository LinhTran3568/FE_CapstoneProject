import React, { useCallback, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertTriangle, Ticket } from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { OfflineNotice } from '../../src/components/OfflineNotice';
import { TicketCard } from '../../src/components/TicketCard';
import { useMyTickets } from '../../src/hooks/useMyTickets';
import { splitTickets } from '../../src/utils/ticketView';
import { styles } from '../../src/styles/tickets.styles';

type WalletTab = 'upcoming' | 'past';

const TABS: { key: WalletTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export default function MobileTicketsScreen() {
  const router = useRouter();
  const { tickets, isLoading, isOffline, lastUpdatedAt, error, refetch } = useMyTickets();
  const [activeTab, setActiveTab] = useState<WalletTab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Syncing your tickets...</Text>
        </View>
      </View>
    );
  }

  const { upcoming, past } = splitTickets(tickets, new Date());
  const visibleTickets = activeTab === 'upcoming' ? upcoming : past;
  const hasTickets = tickets.length > 0;

  const renderEmpty = () => {
    if (error && !isOffline) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.stateIcon}>
            <AlertTriangle size={26} color={theme.colors.danger} />
          </View>
          <Text style={styles.emptyTitle}>Unable to load tickets</Text>
          <Text style={styles.emptyDesc}>{error.message}</Text>
          <FintechButton
            title="Try Again"
            onPress={() => refetch()}
            variant="secondary"
            style={styles.exploreBtn}
          />
        </View>
      );
    }

    if (!hasTickets) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.stateIcon}>
            <Ticket size={30} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Ticket Wallet is Empty</Text>
          <Text style={styles.emptyDesc}>
            You do not own any tickets yet. Explore the Marketplace to find verified tickets.
          </Text>
          <FintechButton
            title="Explore Marketplace"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={styles.exploreBtn}
          />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <View style={styles.stateIcon}>
          <Ticket size={30} color={theme.colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>
          {activeTab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
        </Text>
        <Text style={styles.emptyDesc}>
          {activeTab === 'upcoming'
            ? 'Tickets for events you are going to will appear here.'
            : 'Tickets for events that have ended will appear here.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleTickets}
        keyExtractor={(item) => item.escrowId}
        renderItem={({ item }) => (
          <TicketCard ticket={item} onPress={() => router.push(`/ticket/${item.escrowId}`)} />
        )}
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmpty()}
        ListHeaderComponent={
          <View style={styles.header}>
            {isOffline && <OfflineNotice lastUpdatedAt={lastUpdatedAt} />}
            {hasTickets && (
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
            )}
          </View>
        }
      />
    </View>
  );
}
