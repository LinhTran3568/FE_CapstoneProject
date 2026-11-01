import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { fontFamilies } from '../theme/typography';

export const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radii['2xl'],
    borderTopRightRadius: theme.radii['2xl'],
    maxHeight: '92%',
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: fontFamilies.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  sheetScroll: {
    maxHeight: 640,
  },
  sheetScrollContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },

  // Event Card Summary
  sheetEventRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  sheetPoster: {
    width: 68,
  },
  sheetEventInfo: {
    flex: 1,
    gap: 3,
  },
  sheetEventName: {
    fontSize: theme.typography.sizes.base,
    fontFamily: fontFamilies.bold,
    color: theme.colors.text,
    lineHeight: 20,
  },
  sheetEventMeta: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },

  // Seller Snapshot
  sheetSellerCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetSellerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetSellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSellerAvatarText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.onPrimary,
  },
  sheetSellerInfo: {
    flex: 1,
    gap: 3,
  },
  sheetSellerName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  sheetVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  sheetVerifiedPillText: {
    fontSize: 8.5,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.5,
  },
  sheetSellerSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },

  // Face-Value Price Cap Guarantee
  sheetCeilingCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  sheetCeilingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetCeilingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCeilingTextWrap: {
    flex: 1,
  },
  sheetCeilingTitle: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  sheetCeilingSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  sheetCeilingBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  sheetCeilingBadgeText: {
    fontSize: 9.5,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.8,
  },
  sheetCeilingPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetCeilingCol: {
    flex: 1,
  },
  sheetCeilingDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  sheetCeilingLabel: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },
  sheetCeilingValue: {
    fontSize: 13,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  sheetCeilingStrikethrough: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  sheetDiscountBadge: {
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    marginLeft: 8,
  },
  sheetDiscountBadgeText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.success,
  },
  sheetEscrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    padding: 8,
    borderRadius: theme.radii.sm,
  },
  sheetEscrowNoticeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },

  // Price Breakdown Panel
  pricePanel: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  pricePanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricePanelLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  pricePanelValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontFamily: fontFamilies.medium,
  },
  pricePanelDivider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 2,
  },
  pricePanelTotal: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.bold,
    color: theme.colors.text,
  },
  pricePanelTotalValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
  },

  // Recipient Information Form
  formSection: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 12,
  },
  formSectionHeader: {
    gap: 2,
    marginBottom: 4,
  },
  formSectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.bold,
    color: theme.colors.text,
  },
  formSectionSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  idCardToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  idCardToggleText: {
    fontSize: 12,
    fontFamily: fontFamilies.bold,
    color: theme.colors.primary,
  },

  // 5-Minute Hold Countdown Bar
  countdownBar: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 8,
  },
  countdownBarUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  countdownTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.bold,
    color: theme.colors.warning,
  },
  countdownTextUrgent: {
    color: theme.colors.danger,
  },
  countdownHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.warning,
    borderRadius: 2,
  },
  progressBarFillUrgent: {
    backgroundColor: theme.colors.danger,
  },

  // VietQR & Payment Panel
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrHint: {
    fontSize: theme.typography.sizes.xs,
    color: '#333333',
    marginTop: 8,
    fontWeight: theme.typography.weights.medium,
  },
  bankPanel: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
  },
  bankValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  bankAmount: {
    fontSize: theme.typography.sizes.base,
    fontFamily: fontFamilies.bold,
    color: theme.colors.primary,
  },
  bankReference: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.accent,
  },
  bankRowValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  copyBtnText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontFamily: fontFamilies.bold,
  },
  oneTouchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#005baa',
    paddingVertical: 12,
    borderRadius: theme.radii.lg,
    marginTop: 4,
  },
  oneTouchBtnText: {
    color: '#ffffff',
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.bold,
  },
  autoPollingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginTop: 4,
  },
  autoPollingText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success,
    lineHeight: 16,
  },

  // Notes & Messages
  errorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  errorNoteText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    lineHeight: 16,
  },

  // Success Screen
  successBox: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: fontFamilies.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  successSecondary: {
    width: '100%',
    marginTop: theme.spacing.xs,
  },

  // Dev Testing Tool
  devBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 6,
  },
  devHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
