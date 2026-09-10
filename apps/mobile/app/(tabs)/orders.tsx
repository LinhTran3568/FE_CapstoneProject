import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MobileOrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders Framework</Text>
      <Text style={styles.subtitle}>Giao diện đơn hàng di động trống</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
});
