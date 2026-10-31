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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  backRowText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
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
  cardTitle: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
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
  roleContainer: {
    marginBottom: theme.spacing.md,
  },
  roleLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleSegment: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 3,
    borderRadius: theme.radii.lg,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
  },
  roleOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  roleOptionText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  roleOptionTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  loginText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  loginHighlight: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});
