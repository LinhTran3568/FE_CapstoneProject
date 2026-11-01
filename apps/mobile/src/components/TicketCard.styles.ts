import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { fontFamilies } from '../theme/typography';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  posterWrap: {
    position: 'relative',
  },
  posterOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.badgeScrim,
    borderWidth: 1,
  },
  statusBadgeReady: {
    borderColor: theme.colors.successBorder,
  },
  statusBadgeWarning: {
    borderColor: theme.colors.warningBorder,
  },
  statusBadgeMuted: {
    borderColor: theme.colors.border,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  passPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  passPillText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.onPrimary,
  },
  body: {
    padding: theme.spacing.lg,
  },
  eventName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  metaText: {
    flexShrink: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  tearLine: {
    position: 'relative',
    marginVertical: theme.spacing.md,
    justifyContent: 'center',
  },
  notchLeft: {
    position: 'absolute',
    left: -theme.spacing.lg - 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
  },
  notchRight: {
    position: 'absolute',
    right: -theme.spacing.lg - 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.background,
  },
  dashLine: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  detailCol: {
    flexShrink: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  ticketCode: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.mono,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});
