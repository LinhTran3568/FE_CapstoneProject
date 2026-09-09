import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MOCK_ORDERS } from '@ticketshield/api-client';

export default function MobileOrdersScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.orderNum}>{item.orderNumber}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>

            <Text style={styles.title}>{item.eventTitle}</Text>
            <Text style={styles.amount}>Tổng tiền: {item.totalAmount.toLocaleString('vi-VN')} ₫</Text>

            <View style={styles.escrowBox}>
              <Text style={styles.escrowStatus}>🔒 Tiền đang khóa trong Escrow Smart Contract</Text>
            </View>
          </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderNum: { color: '#06b6d4', fontSize: 11, fontWeight: 'bold' },
  status: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  title: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  amount: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginTop: 4 },
  escrowBox: { backgroundColor: '#06b6d415', padding: 8, borderRadius: 8, marginTop: 8 },
  escrowStatus: { color: '#06b6d4', fontSize: 11, fontWeight: 'bold' },
});
