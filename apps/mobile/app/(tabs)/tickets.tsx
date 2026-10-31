import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Ticket,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  X,
  Share2,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { PurchasedTicketDto } from '@ticketshield/types';
import { ticketService } from '../../src/services/ticketService';
import { FintechButton } from '../../src/components/FintechButton';

export default function MobileTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<PurchasedTicketDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Rotating QR Modal State
  const [selectedTicket, setSelectedTicket] = useState<PurchasedTicketDto | null>(null);
  const [rotatingToken, setRotatingToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const fetchTickets = async () => {
    setLoading(false);
    const data = await ticketService.getUserTickets();
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 30-Second Dynamic Rotating Anti-Scalping QR Loop
  useEffect(() => {
    if (!selectedTicket) return;

    const updateToken = () => {
      const res = ticketService.generateRotatingToken(selectedTicket.ticketPassCode);
      setRotatingToken(res.token);
      setSecondsRemaining(res.secondsRemaining);
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleOpenTicket = (ticket: PurchasedTicketDto) => {
    setSelectedTicket(ticket);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const handleShareTicket = async () => {
    if (!selectedTicket) return;
    try {
      await Share.share({
        message: `Vé điện tử TicketShield: ${selectedTicket.eventName} - Hạng: ${selectedTicket.tierName} (${selectedTicket.seatZone}). Mã vé: ${selectedTicket.ticketPassCode}`,
      });
    } catch (e) {
      // Ignore
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'VALID') {
      return (
        <View style={styles.validStatusBadge}>
          <ShieldCheck size={12} color={theme.colors.success} />
          <Text style={styles.validStatusText}>HỢP LỆ (SẴN SÀNG VÀO CỔNG)</Text>
        </View>
      );
    }
    return (
      <View style={styles.otherStatusBadge}>
        <Text style={styles.otherStatusText}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang đồng bộ ví vé điện tử...</Text>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ticket size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Ví Vé Đang Trống</Text>
          <Text style={styles.emptyDesc}>
            Bạn chưa sở hữu vé điện tử nào. Hãy khám phá Chợ vé để mua vé an toàn được bảo vệ bởi Escrow.
          </Text>
          <FintechButton
            title="Khám Phá Chợ Vé Ngay"
            onPress={() => router.push('/(tabs)/marketplace')}
            variant="primary"
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList}>
          {/* Security Banner */}
          <View style={styles.securityBanner}>
            <Sparkles size={16} color={theme.colors.accent} />
            <Text style={styles.securityBannerText}>
              Mã QR xoay vòng động chống chụp ảnh màn hình bán lại (Anti-Scalping Token).
            </Text>
          </View>

          {tickets.map((t) => (
            <TouchableOpacity
              key={t.ticketPassCode}
              style={styles.ticketCard}
              onPress={() => handleOpenTicket(t)}
              activeOpacity={0.85}
            >
              {/* Ticket Top Notch Bar */}
              <View style={styles.cardHeader}>
                {getStatusBadge(t.status)}
                <Text style={styles.ticketCode}>{t.ticketPassCode}</Text>
              </View>

              <Text style={styles.eventName}>{t.eventName}</Text>

              {/* Event Meta */}
              <View style={styles.metaRow}>
                <Calendar size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(t.eventStartAt).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <MapPin size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {t.eventVenue}
                </Text>
              </View>

              {/* Dotted Cut Line (Boarding Pass effect) */}
              <View style={styles.dottedDivider}>
                <View style={styles.notchLeft} />
                <View style={styles.dashLine} />
                <View style={styles.notchRight} />
              </View>

              {/* Ticket Details Row */}
              <View style={styles.ticketDetailsRow}>
                <View>
                  <Text style={styles.tierLabel}>Hạng vé</Text>
                  <Text style={styles.tierValue}>{t.tierName}</Text>
                </View>
                <View>
                  <Text style={styles.seatLabel}>Vị trí ghế</Text>
                  <Text style={styles.seatValue}>{t.seatZone}</Text>
                </View>

                {/* QR mini button */}
                <View style={styles.qrMiniBtn}>
                  <QrCode size={20} color={theme.colors.primary} />
                  <Text style={styles.qrMiniBtnText}>Mở QR</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Full Digital Ticket & Rotating QR Modal */}
      <Modal
        visible={!!selectedTicket}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ticketModalCard}>
            {/* Modal Bar */}
            <View style={styles.modalTopBar}>
              <View style={styles.verifiedTag}>
                <ShieldCheck size={14} color={theme.colors.success} />
                <Text style={styles.verifiedTagText}>TICKETSHIELD ENTRY PASS</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedTicket && (
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <Text style={styles.modalEventName}>{selectedTicket.eventName}</Text>

                {/* Rotating QR Box */}
                <View style={styles.qrCodeWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        rotatingToken || selectedTicket.ticketPassCode
                      )}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />

                  {/* Countdown indicator */}
                  <View style={styles.tokenTimerRow}>
                    <RefreshCw size={14} color={theme.colors.primary} style={styles.spinIcon} />
                    <Text style={styles.tokenTimerText}>
                      Tự động xoay mã sau: <Text style={styles.timerHighlight}>{secondsRemaining}s</Text>
                    </Text>
                  </View>

                  <Text style={styles.totpCode} numberOfLines={1}>
                    {rotatingToken || selectedTicket.ticketPassCode}
                  </Text>
                </View>

                {/* Ticket Metadata Card */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Hạng vé</Text>
                    <Text style={styles.infoColValue}>{selectedTicket.tierName}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Chỗ ngồi</Text>
                    <Text style={styles.infoColValue}>{selectedTicket.seatZone}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Người sở hữu</Text>
                    <Text style={styles.infoColValue}>{selectedTicket.recipientName}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoColLabel}>Mã vé</Text>
                    <Text style={styles.infoColValueMono}>{selectedTicket.ticketPassCode}</Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={handleShareTicket}
                    activeOpacity={0.8}
                  >
                    <Share2 size={16} color={theme.colors.text} />
                    <Text style={styles.shareBtnText}>Chia Sẻ Vé</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailPageBtn}
                    onPress={() => {
                      const id = selectedTicket.ticketPassCode;
                      handleCloseModal();
                      router.push(`/ticket/${id}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailPageBtnText}>Chi Tiết Thẻ Vé</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  emptyDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  exploreBtn: {
    width: 220,
  },
  scrollList: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  securityBannerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.accent,
    lineHeight: 18,
    fontWeight: theme.typography.weights.medium,
  },
  ticketCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  validStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  validStatusText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  otherStatusBadge: {
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  otherStatusText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  ticketCode: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  eventName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  dottedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    position: 'relative',
  },
  notchLeft: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
    marginLeft: -25,
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notchRight: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
    marginRight: -25,
  },
  ticketDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  tierValue: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  seatLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  seatValue: {
    fontSize: 12,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginTop: 2,
  },
  qrMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
  },
  qrMiniBtnText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  ticketModalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '92%',
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    alignItems: 'center',
  },
  modalEventName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    width: 250,
    marginBottom: theme.spacing.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  tokenTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  spinIcon: {
    opacity: 0.8,
  },
  tokenTimerText: {
    fontSize: 11,
    color: '#0b0f19',
    fontWeight: theme.typography.weights.medium,
  },
  timerHighlight: {
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.danger,
  },
  totpCode: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 4,
    maxWidth: 220,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  infoCol: {
    width: '50%',
    paddingVertical: theme.spacing.xs,
  },
  infoColLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  infoColValue: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  infoColValueMono: {
    fontSize: 11,
    color: theme.colors.primary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 46,
    borderRadius: theme.radii.md,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  detailPageBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    height: 46,
    borderRadius: theme.radii.md,
  },
  detailPageBtnText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: '#0b0f19',
  },
});
