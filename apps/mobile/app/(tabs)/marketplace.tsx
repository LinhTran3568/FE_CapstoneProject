import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { MOCK_LISTINGS } from '@ticketshield/api-client';
import { useRouter } from 'expo-router';

export default function MobileMarketplaceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_LISTINGS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/event/${item.eventId}`)}>
            <View style={styles.badgeRow}>
              <Text style={styles.verifiedBadge}>✓ VERIFIED BY TICKETSHIELD</Text>
              <Text style={styles.ratingText}>★ {item.sellerRating}</Text>
            </View>

            <Text style={styles.title}>{item.eventTitle}</Text>
            <Text style={styles.venue}>{item.venueName}</Text>

            <View style={styles.seatBox}>
              <Text style={styles.seatText}>Khu vực: {item.seatZone}</Text>
              <Text style={styles.seatDetail}>{item.seatInfo}</Text>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Giá nhượng lại</Text>
                <Text style={styles.price}>{item.resalePrice.toLocaleString('vi-VN')} ₫</Text>
              </View>
              <View style={styles.escrowTag}>
                <Text style={styles.escrowText}>🔒 Khóa Escrow</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  verifiedBadge: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  ratingText: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  title: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  venue: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  seatBox: { backgroundColor: '#0b0f19', padding: 8, borderRadius: 8, marginBottom: 10 },
  seatText: { color: '#06b6d4', fontSize: 12, fontWeight: 'bold' },
  seatDetail: { color: '#cbd5e1', fontSize: 11 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: '#94a3b8', fontSize: 10 },
  price: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  escrowTag: { backgroundColor: '#06b6d415', borderColor: '#06b6d440', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  escrowText: { color: '#06b6d4', fontSize: 11, fontWeight: 'bold' },
});
