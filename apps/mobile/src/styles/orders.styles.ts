import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { fontFamilies } from '../theme/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
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
    maxWidth: 300,
  },
  emptyBtn: {
    marginTop: theme.spacing.xl,
    minWidth: 200,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.semibold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  statusBadgeWarning: {
    backgroundColor: theme.colors.warningLight,
  },
  statusBadgeSuccess: {
    backgroundColor: theme.colors.successLight,
  },
  statusBadgeDanger: {
    backgroundColor: theme.colors.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.4,
  },
  statusTextWarning: {
    color: theme.colors.warning,
  },
  statusTextSuccess: {
    color: theme.colors.success,
  },
  statusTextDanger: {
    color: theme.colors.danger,
  },
  eventName: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginTop: 4,
  },
  infoCol: {
    flex: 1,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginTop: 2,
  },
  priceValue: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: 2,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginTop: 2,
  },
  escrowNoticeText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  viewPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  viewPassBtnText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});
