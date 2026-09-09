import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MOCK_EVENTS } from '@ticketshield/api-client';

export default function MobileEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event = MOCK_EVENTS.find((e) => e.id === id) || MOCK_EVENTS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.category}>{event.category}</Text>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.venue}>📍 {event.venue.name}, {event.venue.city}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mô tả sự kiện</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ban Tổ Chức Chính Thức</Text>
        <Text style={styles.organizer}>{event.organizerName}</Text>
        <Text style={styles.verifiedTag}>✓ Tích hợp API TicketShield Real-time</Text>
      </View>

      <TouchableOpacity style={styles.buyBtn} onPress={() => router.push('/(tabs)/marketplace')}>
        <Text style={styles.buyBtnText}>Tìm Vé Sang Nhượng Verified</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  content: { padding: 16 },
  category: { color: '#06b6d4', fontSize: 11, fontWeight: 'bold' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginVertical: 6 },
  venue: { color: '#94a3b8', fontSize: 13, marginBottom: 16 },
  card: {
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  description: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  organizer: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  verifiedTag: { color: '#34d399', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  buyBtn: {
    backgroundColor: '#06b6d4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buyBtnText: { color: '#070a11', fontSize: 15, fontWeight: 'bold' },
});
