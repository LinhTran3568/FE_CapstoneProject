import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MOCK_EVENTS } from '@ticketshield/api-client';

export default function MobileHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Security Trust Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerBadge}>AI PROTECTION ACTIVE</Text>
        <Text style={styles.bannerTitle}>Bảo Vệ Thanh Toán Vé Sự Kiện Bằng AI & Escrow</Text>
        <Text style={styles.bannerSub}>100% Vé được xác thực mã QR chính chủ từ Ban Tổ Chức</Text>
      </View>

      {/* Quick Action Tiles */}
      <Text style={styles.sectionTitle}>Thao Tác Nhanh</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/marketplace')}>
          <Text style={styles.quickIcon}>🎟️</Text>
          <Text style={styles.quickText}>Mua Vé Verified</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/verify')}>
          <Text style={styles.quickIcon}>🛡️</Text>
          <Text style={styles.quickText}>Xác Thực Vé Bán</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/tickets')}>
          <Text style={styles.quickIcon}>📲</Text>
          <Text style={styles.quickText}>Ví Vé Của Tôi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(tabs)/orders')}>
          <Text style={styles.quickIcon}>🔒</Text>
          <Text style={styles.quickText}>Khóa Tiền Escrow</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <Text style={styles.sectionTitle}>Sự Kiện Hot Đang Mở Bán</Text>
      {MOCK_EVENTS.map((evt) => (
        <TouchableOpacity
          key={evt.id}
          style={styles.eventCard}
          onPress={() => router.push(`/event/${evt.id}`)}
        >
          <View style={styles.eventInfo}>
            <Text style={styles.eventCategory}>{evt.category}</Text>
            <Text style={styles.eventTitle}>{evt.title}</Text>
            <Text style={styles.eventVenue}>{evt.venue.name}</Text>
            <Text style={styles.eventPrice}>
              Giá từ: {evt.minPrice.toLocaleString('vi-VN')} ₫
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  content: { padding: 16 },
  banner: {
    backgroundColor: '#161e2e',
    borderColor: '#06b6d4',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerBadge: {
    color: '#06b6d4',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSub: { color: '#94a3b8', fontSize: 12 },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickIcon: { fontSize: 24, marginBottom: 4 },
  quickText: { color: '#e2e8f0', fontSize: 12, fontWeight: 'bold' },
  eventCard: {
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  eventInfo: { flex: 1 },
  eventCategory: { color: '#06b6d4', fontSize: 10, fontWeight: 'bold' },
  eventTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  eventVenue: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  eventPrice: { color: '#34d399', fontSize: 13, fontWeight: 'bold', marginTop: 6 },
});
