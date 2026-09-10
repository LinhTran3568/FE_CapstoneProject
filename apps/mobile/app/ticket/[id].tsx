import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MobileTicketDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ticket Detail Framework</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
});

