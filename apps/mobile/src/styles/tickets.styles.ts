import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const styles = StyleSheet.create({
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
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  exploreBtn: {
    marginTop: theme.spacing.xl,
    minWidth: 200,
  },
  scrollList: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.md,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },
  segmentTabActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.weights.bold,
  },
});
