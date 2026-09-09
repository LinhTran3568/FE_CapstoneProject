import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { verificationApi } from '@ticketshield/api-client';
import { TicketVerification } from '@ticketshield/types';

export default function MobileVerifyTicketScreen() {
  const [ticketCode, setTicketCode] = useState('TS-HAT-554109');
  const [result, setResult] = useState<TicketVerification | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await verificationApi.verifyTicket({
        ticketCode,
        eventId: 'evt-02',
        idCardNumber: '001099887766',
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Xác Thực Mã Vé Cần Bán</Text>
      <Text style={styles.sub}>Nhập mã vé để kiểm tra trực tiếp với API Ban Tổ Chức</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Mã tra cứu vé / Serial</Text>
        <TextInput
          value={ticketCode}
          onChangeText={setTicketCode}
          style={styles.input}
          placeholder="VD: TS-HAT-554109"
          placeholderTextColor="#64748b"
        />

        <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Đang kiểm tra AI...' : 'Xác Thực Ngay'}</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultStatus}>✓ KẾT QUẢ XÁC THỰC: {result.status}</Text>
          <Text style={styles.resultDetail}>Mã kiểm duyệt: {result.id}</Text>
          <Text style={styles.resultEngine}>{result.verifiedBySystem}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  content: { padding: 16 },
  title: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  sub: { color: '#94a3b8', fontSize: 12, marginBottom: 16, marginTop: 2 },
  formCard: {
    backgroundColor: '#161e2e',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  label: { color: '#e2e8f0', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  input: {
    backgroundColor: '#0b0f19',
    borderColor: '#26334d',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: '#06b6d4',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#070a11', fontSize: 14, fontWeight: 'bold' },
  resultCard: {
    backgroundColor: '#06b6d415',
    borderColor: '#06b6d4',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  resultStatus: { color: '#34d399', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  resultDetail: { color: '#ffffff', fontSize: 12 },
  resultEngine: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
});
