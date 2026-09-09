import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MOCK_TICKETS } from '@ticketshield/api-client';
import { useRouter } from 'expo-router';

export default function MobileTicketsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_TICKETS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.ticketCard} onPress={() => router.push(`/ticket/${item.id}`)}>
            <View style={styles.header}>
              <Text style={styles.verifiedText}>✓ VERIFIED BY TICKETSHIELD</Text>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>

            <Text style={styles.title}>{item.eventTitle}</Text>
            <Text style={styles.venue}>{item.venueName}</Text>
            <Text style={styles.seatInfo}>Zone: {item.seatZone} {item.seatNumber ? `- Ghế: ${item.seatNumber}` : ''}</Text>

            <View style={styles.footer}>
              <View style={styles.qrContainer}>
                <Text style={styles.qrIcon}>[ DYNAMIC QR CODE ]</Text>
                <Text style={styles.hashText}>HASH: {item.qrCodeHash.substring(0, 16)}...</Text>
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
  ticketCard: {
    backgroundColor: '#111827',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  verifiedText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  statusText: { color: '#06b6d4', fontSize: 10, fontWeight: '600' },
  title: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  venue: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  seatInfo: { color: '#cbd5e1', fontSize: 12, marginTop: 4 },
  footer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e293b' },
  qrContainer: {
    backgroundColor: '#0b0f19',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  qrIcon: { color: '#34d399', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  hashText: { color: '#64748b', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
