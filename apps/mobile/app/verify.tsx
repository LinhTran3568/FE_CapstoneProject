import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Tag,
  ArrowRight,
  Lock,
} from 'lucide-react-native';
import { theme } from '../src/theme';
import { FintechButton } from '../src/components/FintechButton';
import { FintechInput } from '../src/components/FintechInput';

export default function MobileVerifyTicketScreen() {
  const router = useRouter();

  const [ticketCode, setTicketCode] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const handleVerify = async () => {
    if (!ticketCode.trim()) {
      Alert.alert('Lỗi nhập liệu', 'Vui lòng nhập mã vé cần xác thực.');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate AI verification scan
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult({
        isValid: true,
        eventName: 'ANH TRAI SAY HI LIVE CONCERT 2025',
        tierName: 'VIP A - Sát Sân Khấu',
        seatZone: 'Khu A1 - Ghế 14',
        originalPrice: 2500000,
        maxResalePrice: 2750000, // 110% cap
        aiBotScore: 98.5,
        aiVerdict: 'Vé gốc hợp lệ từ Ban Tổ Chức (VieON), không có dấu hiệu phe vé đầu cơ.',
        canListResale: true,
      });
    }, 1200);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Xác Thực Vé AI & Đăng Bán',
          headerBackTitle: 'Quay lại',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={styles.headerCard}>
          <View style={styles.aiBadge}>
            <Sparkles size={14} color={theme.colors.accent} />
            <Text style={styles.aiBadgeText}>AI ANTI-SCALPING VERIFIER</Text>
          </View>
          <Text style={styles.headerTitle}>Kiểm Tra & Khóa Vé Ban Tổ Chức</Text>
          <Text style={styles.headerSubtitle}>
            Hệ thống AI sẽ đối chiếu mã vé trực tiếp với đơn vị phân phối vé để kiểm tra tính hợp lệ và trần giá bán lại.
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.formCard}>
          <FintechInput
            label="Mã Vé Điện Tử / Mã Tra Cứu"
            placeholder="Ví dụ: ATSH-VIP-882109"
            value={ticketCode}
            onChangeText={setTicketCode}
            autoCapitalize="characters"
          />

          <FintechInput
            label="Số CMND / CCCD Đăng Ký Vé (Tùy chọn)"
            placeholder="Ví dụ: 079201001234"
            value={idCardNumber}
            onChangeText={setIdCardNumber}
            keyboardType="numeric"
          />

          <FintechButton
            title="Quét Xác Thực Bằng AI"
            onPress={handleVerify}
            loading={isVerifying}
            variant="primary"
            icon={<ShieldCheck size={18} color="#0b0f19" />}
          />
        </View>

        {/* Verification Result Display */}
        {verificationResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <CheckCircle2 size={24} color={theme.colors.success} />
              <View style={styles.resultTitleGroup}>
                <Text style={styles.resultTitle}>XÁC THỰC THÀNH CÔNG</Text>
                <Text style={styles.resultSubtitle}>Độ tin cậy AI: {verificationResult.aiBotScore}%</Text>
              </View>
            </View>

            <Text style={styles.resultEventName}>{verificationResult.eventName}</Text>

            <View style={styles.resultSpecs}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Hạng vé:</Text>
                <Text style={styles.specValue}>{verificationResult.tierName}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Vị trí ghế:</Text>
                <Text style={styles.specValue}>{verificationResult.seatZone}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Giá niêm yết gốc:</Text>
                <Text style={styles.specValue}>{formatPrice(verificationResult.originalPrice)}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Giá trần cho phép bán lại (Max +10%):</Text>
                <Text style={styles.specValueCap}>{formatPrice(verificationResult.maxResalePrice)}</Text>
              </View>
            </View>

            <View style={styles.aiVerdictBox}>
              <Text style={styles.aiVerdictText}>{verificationResult.aiVerdict}</Text>
            </View>

            <FintechButton
              title="Niêm Yết Bán Lên Chợ Vé Escrow"
              onPress={() => {
                Alert.alert('Thành Công', 'Vé đã được đăng bán an toàn lên Sàn Chợ Vé TicketShield!');
                router.push('/(tabs)/marketplace');
              }}
              variant="success"
              style={styles.publishBtn}
            />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.accent,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.success,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.glow,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  resultTitleGroup: {
    flex: 1,
  },
  resultTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  resultSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  resultEventName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  resultSpecs: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  specValue: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  specValueCap: {
    fontSize: 13,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  aiVerdictBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  aiVerdictText: {
    fontSize: 12,
    color: theme.colors.success,
    lineHeight: 18,
  },
  publishBtn: {
    marginTop: theme.spacing.xs,
  },
});
