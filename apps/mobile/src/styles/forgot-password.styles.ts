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
    marginBottom: theme.spacing.lg,
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
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  retryRow: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  retryText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
});
