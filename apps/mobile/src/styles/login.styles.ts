import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
  },
  gatewaySlot: {
    marginBottom: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerLight,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorBoxText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.danger,
    lineHeight: 18,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 2,
    marginBottom: theme.spacing.lg,
  },
  forgotText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  submitBtn: {
    marginTop: theme.spacing.xs,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  registerHighlight: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  demoSection: {
    marginTop: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  demoHeaderText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  demoSegment: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 3,
    borderRadius: theme.radii.lg,
  },
  demoTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTabActive: {
    backgroundColor: theme.colors.primary,
  },
  demoTabText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  demoTabTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  securityFooterText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
