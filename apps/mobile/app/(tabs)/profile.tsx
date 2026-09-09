import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MOCK_USERS } from '@ticketshield/api-client';

export default function MobileProfileScreen() {
  const user = MOCK_USERS[0];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.role}>Vai trò: {user.role}</Text>
        <Text style={styles.kyc}>Trạng thái KYC: ✓ Đã Xác Minh</Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>🛡️ Cài đặt an ninh & Sinh trắc học</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>📜 Điều khoản sử dụng Escrow</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>❓ Trợ giúp & Khiếu nại sự cố</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', padding: 16 },
  card: {
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  name: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  email: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  role: { color: '#06b6d4', fontSize: 12, fontWeight: 'bold', marginTop: 6 },
  kyc: { color: '#34d399', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  menuItem: {
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  menuText: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
});
