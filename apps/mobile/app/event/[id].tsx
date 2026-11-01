import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../src/components/AppText';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Check,
  Store,
  ArrowRight,
  Plus,
  Minus,
  AlertTriangle,
  User,
  Mail,
  Phone,
  CheckSquare,
  Square,
  X,
  CheckCircle,
  Ticket,
} from 'lucide-react-native';
import { theme } from '../../src/theme';
import { FintechButton } from '../../src/components/FintechButton';
import { FintechInput } from '../../src/components/FintechInput';
import { EventPoster } from '../../src/components/EventPoster';
import {
  eventsApi,
  organizerStoreApi,
  TrendingEventDto,
  OrganizerBackendTier,
  OrganizerCheckoutResponse,
} from '@ticketshield/api-client';
import { useAuthStore } from '../../src/stores/authStore';
import { formatPrice, formatEventDateTime } from '../../src/utils/format';
import { styles } from '../../src/styles/event-detail.styles';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const eventId = typeof id === 'string' && id ? id : 'atsh-2026';

  const [eventData, setEventData] = useState<TrendingEventDto | null>(null);
  const [tiers, setTiers] = useState<OrganizerBackendTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<OrganizerBackendTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states cho Modal Đặt Vé sơ cấp từ Ban Tổ Chức (giống trải nghiệm Web)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState(user?.fullName || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phoneNumber || '');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    terms?: string;
  }>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrganizerCheckoutResponse | null>(null);

  // Cập nhật thông tin người dùng từ store khi mở màn hình
  useEffect(() => {
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
  }, [user]);

  const loadEventAndTiers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch real event details from Gateway
      const trending = await eventsApi.getTrendingEvents({ limit: 10 });
      const found = trending.find((e) => (e.eventId || e.id) === eventId) || trending[0];
      setEventData(found || null);

      // 2. Tự động lấy danh sách hạng vé thực từ Ban Tổ Chức (hệ thống tự nhận diện động)
      try {
        const remoteTiers = await organizerStoreApi.getEventTiers(eventId, found?.name);
        if (remoteTiers && remoteTiers.length > 0) {
          setTiers(remoteTiers);
          setSelectedTier(remoteTiers[0]);
        }
      } catch (tierErr) {
        console.log('[EventDetailScreen] getEventTiers info:', tierErr);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load event details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventAndTiers();
  }, [loadEventAndTiers]);

  // Khởi tạo Anti-Bot session token khi người dùng chọn hạng vé hoặc mở Modal
  const prefetchSession = useCallback(async (tierId: string) => {
    try {
      const session = await organizerStoreApi.createSession(tierId);
      if (session?.sessionToken) {
        setSessionToken(session.sessionToken);
      }
    } catch (err) {
      console.log('[AntiBot] Session pre-fetch info:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedTier) {
      prefetchSession(selectedTier.id);
    }
  }, [selectedTier, prefetchSession]);

  const handleOpenCheckoutModal = () => {
    if (!selectedTier) return;
    setCheckoutError(null);
    setOrderResult(null);
    setFormErrors({});
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phoneNumber) setBuyerPhone(user.phoneNumber);
    }
    prefetchSession(selectedTier.id);
    setIsCheckoutModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!buyerName.trim()) {
      errors.name = 'Vui lòng nhập họ và tên người nhận vé';
    } else if (buyerName.trim().length < 2) {
      errors.name = 'Họ và tên tối thiểu 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail.trim()) {
      errors.email = 'Vui lòng nhập email nhận vé điện tử';
    } else if (!emailRegex.test(buyerEmail.trim())) {
      errors.email = 'Email không hợp lệ (ví dụ: user@example.com)';
    }

    const phoneDigits = buyerPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!buyerPhone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(phoneDigits)) {
      errors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, ví dụ 0901234567)';
    }

    if (!agreedTerms) {
      errors.terms = 'Bạn cần đồng ý với điều khoản phát hành vé của Ban Tổ Chức';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmCheckout = async () => {
    if (!selectedTier) return;
    if (!validateForm()) return;

    setIsBuying(true);
    setCheckoutError(null);

    try {
      // Đảm bảo có Anti-Bot session token
      let activeSession = sessionToken;
      if (!activeSession) {
        try {
          const freshSession = await organizerStoreApi.createSession(selectedTier.id);
          activeSession = freshSession.sessionToken;
          setSessionToken(activeSession);
        } catch {}
      }

      const res = await organizerStoreApi.checkout({
        tierId: selectedTier.id,
        quantity,
        buyerEmail: buyerEmail.trim(),
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        sessionToken: activeSession || undefined,
      });

      setOrderResult(res);
    } catch (e: any) {
      const message = e instanceof Error ? e.message : 'Không thể hoàn tất đặt vé từ Ban Tổ Chức.';
      setCheckoutError(message);
    } finally {
      setIsBuying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error || !eventData) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={32} color={theme.colors.danger} />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorDesc}>{error || 'The requested event is not available.'}</Text>
        <FintechButton
          title="Back to Home"
          onPress={() => router.replace('/(tabs)')}
          style={styles.retryBtn}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Event Details',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <EventPoster seed={eventData.eventId || eventData.name} height={200} />
          <View style={styles.heroBody}>
            <View style={styles.officialBadge}>
              <ShieldCheck size={13} color={theme.colors.success} />
              <Text style={styles.officialBadgeText}>Official Organizer Event</Text>
            </View>
            <Text style={styles.eventCategory}>
              {eventData.category || eventData.artist || 'CONCERT'}
            </Text>
            <Text style={styles.eventTitle}>{eventData.name}</Text>
            <Text style={styles.organizerName}>
              Organized by {eventData.organizerName || 'Verified Organizer'}
            </Text>

            <View style={styles.metaRow}>
              <Calendar size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>{formatEventDateTime(eventData.eventStartAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={theme.colors.primary} />
              <Text style={styles.metaText}>
                {eventData.venue} {eventData.city ? `• ${eventData.city}` : ''}
              </Text>
            </View>
            {eventData.description && (
              <Text style={styles.description}>{eventData.description}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.resaleShortcut}
          onPress={() => router.push('/(tabs)/marketplace')}
          activeOpacity={0.85}
        >
          <View style={styles.resaleShortcutIcon}>
            <Store size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.resaleShortcutText}>
            <Text style={styles.resaleShortcutTitle}>Check Secondary Resale Deals</Text>
            <Text style={styles.resaleShortcutSubtitle}>
              Verified fan-to-fan resale tickets backed by escrow
            </Text>
          </View>
          <ArrowRight size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionHeading}>Select Ticket Tier</Text>
        <View style={styles.tiersContainer}>
          {tiers.map((tier) => {
            const isSelected = selectedTier?.id === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                onPress={() => setSelectedTier(tier)}
                activeOpacity={0.85}
              >
                <View style={styles.tierTop}>
                  <View style={styles.tierNameGroup}>
                    <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                      {tier.tierName}
                    </Text>
                    <Text style={styles.tierZone}>
                      {tier.availableQuantity > 0
                        ? `${tier.availableQuantity} tickets remaining`
                        : 'Available'}
                    </Text>
                  </View>
                  <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
                </View>

                <View style={styles.perksContainer}>
                  <View style={styles.perkRow}>
                    <Check size={13} color={theme.colors.success} />
                    <Text style={styles.perkText}>Guaranteed admission with dynamic QR pass</Text>
                  </View>
                  <View style={styles.perkRow}>
                    <Check size={13} color={theme.colors.success} />
                    <Text style={styles.perkText}>Anti-bot protected official inventory</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quantityCard}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={16} color={quantity <= 1 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.min(4, q + 1))}
              disabled={quantity >= 4}
            >
              <Plus size={16} color={quantity >= 4 ? theme.colors.textMuted : theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {selectedTier && (
          <View style={styles.checkoutPanel}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total Price ({quantity} ticket{quantity > 1 ? 's' : ''})
              </Text>
              <Text style={styles.totalValue}>{formatPrice(selectedTier.price * quantity)}</Text>
            </View>
            <FintechButton
              title="Checkout & Receive Passes"
              onPress={handleOpenCheckoutModal}
              icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
            />
          </View>
        )}
      </ScrollView>

      {/* Modal Nhập Thông Tin Nhận Vé Sơ Cấp (Giống Web Checkout Modal) */}
      <Modal
        visible={isCheckoutModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCheckoutModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + theme.spacing.lg }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {orderResult ? 'Đặt vé thành công' : 'Thông tin người nhận vé'}
              </Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setIsCheckoutModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Đóng modal"
              >
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {orderResult ? (
                /* Giao diện Đặt Vé Thành Công */
                <View style={styles.successBox}>
                  <View style={styles.successIcon}>
                    <CheckCircle size={36} color={theme.colors.success} />
                  </View>
                  <Text style={styles.successTitle}>Vé đã sẵn sàng trong Ví!</Text>
                  <Text style={styles.successMessage}>
                    Đơn hàng #{orderResult.orderId.slice(0, 8)} đã được hệ thống Ban Tổ Chức phê duyệt thành công.
                  </Text>

                  {orderResult.tickets && orderResult.tickets.length > 0 && (
                    <View style={styles.ticketCodesBox}>
                      <Text style={styles.summaryLabel}>MÃ VÉ ĐIỆN TỬ CỦA BẠN:</Text>
                      {orderResult.tickets.map((t, idx) => (
                        <View key={t.ticketCode || idx} style={styles.ticketCodeCard}>
                          <View style={styles.ticketCodeBadge}>
                            <Text style={styles.ticketCodeBadgeText}>
                              Vé #{idx + 1} • {t.seatZone || selectedTier?.tierName}
                            </Text>
                          </View>
                          <Text style={styles.ticketCodeValue}>{t.ticketCode}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
                    <FintechButton
                      title="Xem vé trong Ví"
                      onPress={() => {
                        setIsCheckoutModalOpen(false);
                        router.push('/(tabs)/tickets');
                      }}
                      icon={<Ticket size={18} color={theme.colors.onPrimary} />}
                    />
                    <FintechButton
                      title="Hoàn tất"
                      variant="secondary"
                      onPress={() => setIsCheckoutModalOpen(false)}
                    />
                  </View>
                </View>
              ) : (
                /* Form Nhập Thông Tin Người Nhận Vé */
                <View style={styles.formSection}>
                  {/* Tóm tắt đơn hàng */}
                  <View style={styles.orderSummaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Sự kiện</Text>
                      <Text style={styles.summaryValue} numberOfLines={1}>
                        {eventData.name}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Hạng vé</Text>
                      <Text style={styles.summaryValue}>
                        {selectedTier?.tierName} × {quantity}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Tổng thanh toán</Text>
                      <Text style={[styles.summaryValue, { color: theme.colors.primary, fontSize: 16 }]}>
                        {formatPrice((selectedTier?.price || 0) * quantity)}
                      </Text>
                    </View>
                  </View>

                  {/* Thông báo lỗi nếu có */}
                  {checkoutError && (
                    <View style={styles.submitErrorBox}>
                      <AlertTriangle size={18} color={theme.colors.danger} />
                      <Text style={styles.submitErrorText}>{checkoutError}</Text>
                    </View>
                  )}

                  {/* Các trường thông tin */}
                  <FintechInput
                    label="Họ và tên người nhận vé *"
                    placeholder="Nguyễn Văn A"
                    value={buyerName}
                    onChangeText={(val) => {
                      setBuyerName(val);
                      if (formErrors.name) setFormErrors((e) => ({ ...e, name: undefined }));
                    }}
                    error={formErrors.name}
                    icon={<User size={18} color={theme.colors.primary} />}
                  />

                  <FintechInput
                    label="Email nhận vé điện tử *"
                    placeholder="user@example.com"
                    value={buyerEmail}
                    onChangeText={(val) => {
                      setBuyerEmail(val);
                      if (formErrors.email) setFormErrors((e) => ({ ...e, email: undefined }));
                    }}
                    error={formErrors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon={<Mail size={18} color={theme.colors.primary} />}
                  />

                  <FintechInput
                    label="Số điện thoại nhận vé *"
                    placeholder="0901234567"
                    value={buyerPhone}
                    onChangeText={(val) => {
                      setBuyerPhone(val);
                      if (formErrors.phone) setFormErrors((e) => ({ ...e, phone: undefined }));
                    }}
                    error={formErrors.phone}
                    keyboardType="phone-pad"
                    icon={<Phone size={18} color={theme.colors.primary} />}
                  />

                  {/* Checkbox điều khoản */}
                  <TouchableOpacity
                    style={styles.termsContainer}
                    onPress={() => {
                      setAgreedTerms(!agreedTerms);
                      if (formErrors.terms) setFormErrors((e) => ({ ...e, terms: undefined }));
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.checkboxBox}>
                      {agreedTerms ? (
                        <CheckSquare size={20} color={theme.colors.primary} />
                      ) : (
                        <Square size={20} color={theme.colors.border} />
                      )}
                    </View>
                    <Text style={styles.termsLabel}>
                      Tôi xác nhận thông tin nhận vé chính xác và đồng ý với điều khoản phát hành vé và xác thực danh tính của Ban Tổ Chức.
                    </Text>
                  </TouchableOpacity>
                  {formErrors.terms && <Text style={styles.fieldError}>{formErrors.terms}</Text>}

                  <View style={styles.modalFooter}>
                    <FintechButton
                      title="Xác nhận & Nhận vé"
                      onPress={handleConfirmCheckout}
                      loading={isBuying}
                      icon={<ShieldCheck size={18} color={theme.colors.onPrimary} />}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
