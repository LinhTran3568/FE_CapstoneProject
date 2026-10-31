import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  Share2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  User,
  Info,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { PurchasedTicketDto } from '@ticketshield/types';
import { ticketService } from '../../src/services/ticketService';
import { FintechButton } from '../../src/components/FintechButton';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<PurchasedTicketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotatingToken, setRotatingToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const found = await ticketService.getTicketById(id);
        setTicket(found);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  // Dynamic Rotating Anti-Scalping Token Loop
  useEffect(() => {
    if (!ticket) return;

    const updateToken = () => {
      const res = ticketService.generateRotatingToken(ticket.ticketPassCode);
      setRotatingToken(res.token);
      setSecondsRemaining(res.secondsRemaining);
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [ticket]);

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `Vé điện tử TicketShield: ${ticket.eventName} - Hạng: ${ticket.tierName} (${ticket.seatZone}). Mã vé: ${ticket.ticketPassCode}`,
      });
    } catch (e) {
      // Ignore
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải vé điện tử...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color={theme.colors.danger} />
        <Text style={styles.notFoundTitle}>Không tìm thấy vé</Text>
        <Text style={styles.notFoundDesc}>Mã vé không tồn tại hoặc phiên vé đã hết hạn.</Text>
        <FintechButton
          title="Quay Lại Ví Vé"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backBtn}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Vé Điện Tử TicketShield',
          headerBackTitle: 'Quay lại',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Anti-Scalping Rotating QR Pass Card */}
        <View style={styles.passCard}>
          {/* Top Notch Badge */}
          <View style={styles.passHeader}>
            <View style={styles.shieldVerifiedRow}>
              <ShieldCheck size={16} color={theme.colors.success} />
              <Text style={styles.shieldVerifiedText}>VERIFIED ESCROW PASS</Text>
            </View>
            <Text style={styles.passCode}>{ticket.ticketPassCode}</Text>
          </View>

          {/* Event Header */}
          <Text style={styles.eventName}>{ticket.eventName}</Text>

          <View style={styles.metaRow}>
            <Calendar size={14} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(ticket.eventStartAt).toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={14} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{ticket.eventVenue}</Text>
          </View>

          {/* Boarding Pass Tear Divider */}
          <View style={styles.tearDivider}>
            <View style={styles.tearHoleLeft} />
            <View style={styles.tearLine} />
            <View style={styles.tearHoleRight} />
          </View>

          {/* Rotating QR Anti-Scalping Center */}
          <View style={styles.qrContainer}>
            <View style={styles.qrWhiteBox}>
              <Image
                source={{
                  uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    rotatingToken || ticket.ticketPassCode
                  )}`,
                }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            {/* Countdown indicator */}
            <View style={styles.countdownPill}>
              <RefreshCw size={13} color={theme.colors.primary} />
              <Text style={styles.countdownPillText}>
                Mã làm mới sau: <Text style={styles.countdownSeconds}>{secondsRemaining}s</Text>
              </Text>
            </View>

            <Text style={styles.totpTokenText} numberOfLines={1}>
              {rotatingToken}
            </Text>
          </View>

          {/* Seat & Zone Specs */}
          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Hạng vé</Text>
              <Text style={styles.specValuePrimary}>{ticket.tierName}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Vị trí ghế</Text>
              <Text style={styles.specValue}>{ticket.seatZone}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Chủ vé</Text>
              <Text style={styles.specValue}>{ticket.recipientName}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Trạng thái</Text>
              <Text style={styles.specValueSuccess}>HỢP LỆ VÀO CỔNG</Text>
            </View>
          </View>

          {/* Admission Rules */}
          <View style={styles.rulesCard}>
            <View style={styles.rulesHeader}>
              <Info size={14} color={theme.colors.textSecondary} />
              <Text style={styles.rulesTitle}>Quy định vào cổng Ban Tổ Chức</Text>
            </View>
            <Text style={styles.rulesItem}>• Mỗi mã QR động chỉ có giá trị cho 01 lần quét qua cửa.</Text>
            <Text style={styles.rulesItem}>• Nghiêm cấm chụp ảnh màn hình bán lại (Mã sẽ hết hạn sau 30 giây).</Text>
            <Text style={styles.rulesItem}>• Tiền thanh toán Escrow sẽ giải ngân cho người bán sau khi bạn quét vé thành công.</Text>
          </View>

          {/* Share Action */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Share2 size={16} color={theme.colors.text} />
            <Text style={styles.shareBtnText}>Chia Sẻ Vé Điện Tử</Text>
          </TouchableOpacity>
        </View>
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
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  notFoundTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  notFoundDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.xl,
  },
  backBtn: {
    width: 200,
  },
  passCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  shieldVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldVerifiedText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  passCode: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  eventName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  tearDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
    marginHorizontal: -24,
  },
  tearHoleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  tearLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tearHoleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  qrWhiteBox: {
    width: 230,
    height: 230,
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: theme.spacing.md,
  },
  qrImage: {
    width: 210,
    height: 210,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    marginBottom: 4,
  },
  countdownPillText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
  },
  countdownSeconds: {
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  totpTokenText: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
    maxWidth: 240,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  specBox: {
    width: '50%',
    paddingVertical: theme.spacing.xs,
  },
  specLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  specValue: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  specValuePrimary: {
    fontSize: 13,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  specValueSuccess: {
    fontSize: 12,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    marginTop: 2,
  },
  rulesCard: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    gap: 4,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  rulesItem: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 48,
    borderRadius: theme.radii.md,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
});
