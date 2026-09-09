import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MOCK_TICKETS } from '@ticketshield/api-client';

export default function MobileTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticket = MOCK_TICKETS.find((t) => t.id === id) || MOCK_TICKETS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mobile Ticket Digital Representation */}
      <View style={styles.ticketCard}>
        <View style={styles.header}>
          <Text style={styles.verifiedBadge}>✓ Verified by TicketShield</Text>
          <Text style={styles.ticketCode}>{ticket.ticketCode}</Text>
        </View>

        <Text style={styles.title}>{ticket.eventTitle}</Text>
        <Text style={styles.venue}>📍 {ticket.venueName}</Text>
        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Seat / Zone</Text>
            <Text style={styles.value}>{ticket.seatZone} {ticket.seatRow ? `(Row ${ticket.seatRow}, Seat ${ticket.seatNumber})` : ''}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Original Price</Text>
            <Text style={styles.value}>{ticket.originalPrice.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Dynamic Anti-Scalper Encrypted Ticket Display */}
        <View style={styles.qrBox}>
          <Text style={styles.qrHeader}>🔒 Dynamic Anti-Bot Token</Text>
          <Text style={styles.qrSubtext}>QR rotates every 30s to prevent screenshot scalping</Text>

          <View style={styles.qrCodePlaceholder}>
            <Text style={styles.qrText}>[ ROTATING ENCRYPTED QR CODE ]</Text>
            <Text style={styles.qrHash}>HASH: {ticket.qrCodeHash}</Text>
          </View>
        </View>

        <View style={styles.ownerRow}>
          <Text style={styles.ownerLabel}>Chủ sở hữu chính thức:</Text>
          <Text style={styles.ownerName}>{ticket.ownerName}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  content: { padding: 16 },
  ticketCard: {
    backgroundColor: '#111827',
    borderColor: '#06b6d4',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  verifiedBadge: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  ticketCode: { color: '#64748b', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  title: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  venue: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#26334d', marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 11 },
  value: { color: '#06b6d4', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  qrBox: {
    backgroundColor: '#0b0f19',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrHeader: { color: '#34d399', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  qrSubtext: { color: '#94a3b8', fontSize: 11, marginBottom: 12, textAlign: 'center' },
  qrCodePlaceholder: { alignItems: 'center' },
  qrText: { color: '#06b6d4', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  qrHash: { color: '#64748b', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  ownerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ownerLabel: { color: '#94a3b8', fontSize: 12 },
  ownerName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});
