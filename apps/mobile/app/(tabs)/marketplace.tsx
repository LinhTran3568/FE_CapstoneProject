import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ShieldCheck,
  Tag,
  MapPin,
  Calendar,
  X,
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { ResaleListingDetailDto, HoldListingForPurchaseResponse } from '@ticketshield/types';
import { marketplaceService } from '../../src/services/marketplaceService';
import { FintechButton } from '../../src/components/FintechButton';

export default function MobileMarketplaceScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'CONCERT' | 'SPORTS' | 'EDM'>('ALL');
  const [listings, setListings] = useState<ResaleListingDetailDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Buy Modal State
  const [selectedListing, setSelectedListing] = useState<ResaleListingDetailDto | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdData, setHoldData] = useState<HoldListingForPurchaseResponse | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const loadListings = async () => {
    setLoading(true);
    const data = await marketplaceService.getListings({ keyword });
    setListings(data);
    setLoading(false);
  };

  useEffect(() => {
    loadListings();
  }, [keyword]);

  const handleOpenBuyModal = (listing: ResaleListingDetailDto) => {
    setSelectedListing(listing);
    setHoldData(null);
    setPurchaseSuccess(false);
  };

  const handleCloseModal = () => {
    setSelectedListing(null);
    setHoldData(null);
    setPurchaseSuccess(false);
  };

  const handleHoldListing = async () => {
    if (!selectedListing) return;
    setIsHolding(true);
    try {
      const res = await marketplaceService.holdListing(selectedListing, {
        fullName: user?.fullName || 'Khách Hàng',
        email: user?.email || 'buyer@ticketshield.vn',
        phone: user?.phoneNumber || '0987654321',
      });
      setHoldData(res);
    } catch (err: any) {
      Alert.alert('Lỗi khóa vé', err?.message || 'Không thể khóa vé lúc này.');
    } finally {
      setIsHolding(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!selectedListing || !holdData) return;
    setIsSimulatingPayment(true);
    try {
      await marketplaceService.completeEscrowPurchase(selectedListing, holdData, {
        fullName: user?.fullName || 'Khách Hàng',
        email: user?.email || 'buyer@ticketshield.vn',
        phone: user?.phoneNumber || '0987654321',
      });
      setPurchaseSuccess(true);
    } catch (err: any) {
      Alert.alert('Lỗi thanh toán', err?.message || 'Thanh toán chưa hoàn tất.');
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo sự kiện, ca sĩ, địa điểm..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={keyword}
            onChangeText={setKeyword}
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <X size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {[
            { id: 'ALL', label: 'Tất Cả Vé' },
            { id: 'CONCERT', label: 'Concert & Live' },
            { id: 'EDM', label: 'Festival EDM' },
            { id: 'SPORTS', label: 'Thể Thao' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id as any)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Listings List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải vé sang nhượng đã xác thực...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.escrowNoticeBanner}>
            <ShieldCheck size={18} color={theme.colors.success} />
            <Text style={styles.escrowNoticeText}>
              100% vé được Ban Tổ Chức khóa và bảo vệ tiền cọc trong Escrow đến khi check-in thành công.
            </Text>
          </View>

          {listings.map((item) => (
            <View key={item.listingId} style={styles.ticketCard}>
              {/* Header card */}
              <View style={styles.cardTopRow}>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={theme.colors.success} />
                  <Text style={styles.verifiedBadgeText}>VERIFIED ESCROW</Text>
                </View>
                {item.discountPercentage > 0 && (
                  <View style={styles.discountBadge}>
                    <Tag size={12} color={theme.colors.primary} />
                    <Text style={styles.discountBadgeText}>Tiết kiệm {item.discountPercentage}%</Text>
                  </View>
                )}
              </View>

              {/* Event title */}
              <Text style={styles.eventName}>{item.eventName}</Text>

              {/* Meta details */}
              <View style={styles.metaRow}>
                <Calendar size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(item.eventStartAt).toLocaleDateString('vi-VN', {
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
                  {item.eventVenue}
                </Text>
              </View>

              {/* Ticket zone & seat info */}
              <View style={styles.seatInfoBox}>
                <View style={styles.tierNameCol}>
                  <Text style={styles.tierNameLabel}>Hạng vé</Text>
                  <Text style={styles.tierNameText}>{item.tierName}</Text>
                </View>
                <View style={styles.seatZoneCol}>
                  <Text style={styles.seatZoneLabel}>Vị trí chỗ ngồi</Text>
                  <Text style={styles.seatZoneText}>{item.seatZone || 'Khán đài tự do'}</Text>
                </View>
              </View>

              {/* Price row & action */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Giá sang nhượng</Text>
                  <View style={styles.priceGroup}>
                    <Text style={styles.resalePriceText}>{formatPrice(item.resalePrice)}</Text>
                    {item.originalPrice > item.resalePrice && (
                      <Text style={styles.originalPriceText}>{formatPrice(item.originalPrice)}</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.buyNowBtn}
                  onPress={() => handleOpenBuyModal(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buyNowBtnText}>Mua Qua Escrow</Text>
                  <ArrowRight size={14} color="#0b0f19" />
                </TouchableOpacity>
              </View>

              {/* Seller footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.sellerText}>Người bán: {item.sellerFullName}</Text>
                <Text style={styles.ticketCodeText}>{item.maskedTicketCode}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Buy & Escrow Hold Modal */}
      <Modal
        visible={!!selectedListing}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ShieldCheck size={20} color={theme.colors.success} />
                <Text style={styles.modalTitle}>Khóa Escrow & Mua Vé</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedListing && (
              <ScrollView contentContainerStyle={styles.modalScroll}>
                {purchaseSuccess ? (
                  // Success State
                  <View style={styles.successBox}>
                    <CheckCircle2 size={60} color={theme.colors.success} />
                    <Text style={styles.successTitle}>Giao Dịch Escrow Thành Công!</Text>
                    <Text style={styles.successDesc}>
                      Vé điện tử đã được chuyển vào ví vé của bạn. Tiền thanh toán sẽ được khóa trong tài khoản Escrow an toàn đến khi check-in.
                    </Text>
                    <FintechButton
                      title="Mở Ví Vé Của Tôi Ngay"
                      onPress={() => {
                        handleCloseModal();
                        router.push('/(tabs)/tickets');
                      }}
                      variant="primary"
                      style={styles.goToTicketsBtn}
                    />
                  </View>
                ) : !holdData ? (
                  // Step 1: Review & Lock Escrow
                  <>
                    <View style={styles.modalItemCard}>
                      <Text style={styles.modalEventName}>{selectedListing.eventName}</Text>
                      <Text style={styles.modalTierName}>{selectedListing.tierName}</Text>
                      <Text style={styles.modalSeatName}>{selectedListing.seatZone || 'Khán đài tự do'}</Text>
                    </View>

                    <View style={styles.feeBreakdown}>
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Giá vé chuyển nhượng</Text>
                        <Text style={styles.feeValue}>{formatPrice(selectedListing.resalePrice)}</Text>
                      </View>
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Phí bảo vệ Escrow (3%)</Text>
                        <Text style={styles.feeValue}>{formatPrice(Math.round(selectedListing.resalePrice * 0.03))}</Text>
                      </View>
                      <View style={[styles.feeRow, styles.totalFeeRow]}>
                        <Text style={styles.totalFeeLabel}>Tổng tiền thanh toán</Text>
                        <Text style={styles.totalFeeValue}>
                          {formatPrice(selectedListing.resalePrice + Math.round(selectedListing.resalePrice * 0.03))}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.escrowGuaranteeNotice}>
                      <Clock size={16} color={theme.colors.warning} />
                      <Text style={styles.escrowGuaranteeText}>
                        Sau khi bấm khóa vé, hệ thống sẽ giữ vé trong 10 phút để bạn chuyển khoản. Nếu hết hạn vé sẽ tự động mở lại cho người khác.
                      </Text>
                    </View>

                    <FintechButton
                      title="Khóa Vé & Tạo Mã VietQR (10 Phút)"
                      onPress={handleHoldListing}
                      loading={isHolding}
                      variant="primary"
                      style={styles.modalActionBtn}
                    />
                  </>
                ) : (
                  // Step 2: VietQR & Payment Simulation
                  <View style={styles.qrSection}>
                    <View style={styles.countdownBadge}>
                      <Clock size={14} color={theme.colors.warning} />
                      <Text style={styles.countdownText}>Thời gian giữ vé: 10 phút</Text>
                    </View>

                    <Text style={styles.qrPrompt}>Quét mã VietQR bằng app ngân hàng bất kỳ:</Text>

                    <View style={styles.qrImageContainer}>
                      <Image
                        source={{ uri: holdData.qrImageUrl }}
                        style={styles.vietQrImage}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Bank Transfer Details */}
                    <View style={styles.bankDetailCard}>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Ngân hàng thụ hưởng:</Text>
                        <Text style={styles.bankValue}>MBBank (Quân Đội)</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Số tài khoản Escrow:</Text>
                        <Text style={styles.bankValueHighlight}>{holdData.accountNumber}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Nội dung chuyển khoản:</Text>
                        <Text style={styles.bankValueHighlight}>{holdData.paymentReference}</Text>
                      </View>
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Số tiền chính xác:</Text>
                        <Text style={styles.bankValueAmount}>{formatPrice(holdData.totalBuyerPaid)}</Text>
                      </View>
                    </View>

                    {/* Demo Simulation Helper */}
                    <View style={styles.demoHelperSection}>
                      <FintechButton
                        title="Mô Phỏng Thanh Toán Thành Công (Demo SePay)"
                        onPress={handleSimulatePayment}
                        loading={isSimulatingPayment}
                        variant="success"
                        icon={<Zap size={16} color="#ffffff" />}
                      />
                    </View>
                  </View>
                )}
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
  searchHeader: {
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: theme.colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  loadingContainer: {
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
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
  },
  escrowNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.successLight,
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.success,
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
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
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
  seatInfoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  tierNameCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderSubtle,
    paddingRight: theme.spacing.sm,
  },
  tierNameLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  tierNameText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  seatZoneCol: {
    flex: 1.2,
    paddingLeft: theme.spacing.md,
  },
  seatZoneLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  seatZoneText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  priceLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  resalePriceText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  originalPriceText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    ...theme.shadows.glow,
  },
  buyNowBtnText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: '#0b0f19',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  sellerText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  ticketCodeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii['2xl'],
    borderTopRightRadius: theme.radii['2xl'],
    maxHeight: '90%',
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 6,
  },
  modalScroll: {
    paddingBottom: theme.spacing['3xl'],
  },
  modalItemCard: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalEventName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  modalTierName: {
    fontSize: 13,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
  modalSeatName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  feeBreakdown: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  totalFeeRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  totalFeeLabel: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  totalFeeValue: {
    fontSize: 16,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },
  escrowGuaranteeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.warningLight,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  escrowGuaranteeText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.warning,
    lineHeight: 18,
  },
  modalActionBtn: {
    marginBottom: theme.spacing.lg,
  },
  qrSection: {
    alignItems: 'center',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.warningLight,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    marginBottom: theme.spacing.md,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.warning,
  },
  qrPrompt: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  qrImageContainer: {
    width: 220,
    height: 220,
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.lg,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  vietQrImage: {
    width: 200,
    height: 200,
  },
  bankDetailCard: {
    width: '100%',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  bankValue: {
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  bankValueHighlight: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  bankValueAmount: {
    fontSize: 14,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
  },
  demoHelperSection: {
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  successTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  successDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  goToTicketsBtn: {
    width: '100%',
  },
});
