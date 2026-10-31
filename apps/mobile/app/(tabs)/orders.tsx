import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Receipt,
  Tag,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { ticketService } from '../../src/services/ticketService';
import { MobileEscrowOrder } from '../../src/services/marketplaceService';
import { FintechButton } from '../../src/components/FintechButton';

export default function MobileOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<MobileEscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await ticketService.getUserOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: MobileEscrowOrder['status']) => {
    switch (status) {
      case 'ESCROW_HOLDING':
        return (
          <View style={styles.holdingBadge}>
            <Clock size={12} color={theme.colors.warning} />
            <Text style={styles.holdingBadgeText}>ESCROW ĐANG GIỮ TIỀN</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={12} color={theme.colors.success} />
            <Text style={styles.completedBadgeText}>GIAO DỊCH HOÀN TẤT</Text>
          </View>
        );
      case 'CANCELLED':
      default:
        return (
          <View style={styles.cancelledBadge}>
            <AlertCircle size={12} color={theme.colors.danger} />
            <Text style={styles.cancelledBadgeText}>ĐÃ HOÀN CỌC / HỦY</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử giao dịch & Escrow...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Receipt size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Chưa Có Đơn Hàng Nào</Text>
          <Text style={styles.emptyDesc}>
            Khi bạn mua vé sang nhượng trên sàn, lịch sử giải ngân Escrow sẽ hiển thị chi tiết tại đây.
          </Text>
          <FintechButton
            title="Đến Chợ Vé Tìm Mua"
            onPress={() => router.push('/(tabs)/marketplace')}
            variant="primary"
            style={styles.exploreBtn}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList}>
          {/* Escrow Mechanism Explanation Banner */}
          <View style={styles.escrowBanner}>
            <ShieldCheck size={18} color={theme.colors.success} />
            <View style={styles.escrowBannerTextGroup}>
              <Text style={styles.escrowBannerTitle}>Cơ chế Bảo Vệ Escrow 100%</Text>
              <Text style={styles.escrowBannerDesc}>
                Khoản thanh toán được bảo lưu an toàn trong tài khoản trung gian của TicketShield. Người bán chỉ được giải ngân sau khi vé vào cổng thành công.
              </Text>
            </View>
          </View>

          {orders.map((o) => (
            <View key={o.orderId} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderTopRow}>
                <Text style={styles.orderIdText}>{o.orderId}</Text>
                {getStatusBadge(o.status)}
              </View>

              {/* Event Info */}
              <Text style={styles.eventName}>{o.eventName}</Text>

              <View style={styles.metaRow}>
                <Calendar size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(o.createdAt).toLocaleString('vi-VN', {
                    day: 'numeric',
                    month: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Details table */}
              <View style={styles.detailsBox}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Hạng vé & Vị trí</Text>
                  <Text style={styles.detailValue}>
                    {o.tierName} • {o.seatZone}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Người bán</Text>
                  <Text style={styles.detailValue}>{o.sellerFullName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mã chuyển khoản</Text>
                  <Text style={styles.detailValueMono}>{o.paymentReference}</Text>
                </View>
              </View>

              {/* Amount Breakdown */}
              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.amountLabel}>Tổng tiền đã trả</Text>
                  <Text style={styles.amountValue}>{formatPrice(o.totalPaid)}</Text>
                </View>

                {o.ticketPassCode && (
                  <TouchableOpacity
                    style={styles.viewTicketBtn}
                    onPress={() => router.push('/(tabs)/tickets')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewTicketBtnText}>Xem Vé Trong Ví</Text>
                    <ArrowRight size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  escrowBannerTextGroup: {
    flex: 1,
  },
  escrowBannerTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
    marginBottom: 2,
  },
  escrowBannerDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  holdingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.warningLight,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  holdingBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.warning,
    letterSpacing: 0.5,
  },
  completedBadge: {
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
  completedBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  cancelledBadgeText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.danger,
  },
  eventName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  metaText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  detailsBox: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  detailValueMono: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  amountLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  amountValue: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
    marginTop: 1,
  },
  viewTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radii.md,
  },
  viewTicketBtnText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});
