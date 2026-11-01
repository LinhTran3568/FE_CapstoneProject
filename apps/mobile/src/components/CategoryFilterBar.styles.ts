import { StyleSheet } from 'react-native';
import { theme, fontFamilies } from '../theme';

export const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: fontFamilies.medium,
    color: theme.colors.textSecondary,
  },
  pillTextActive: {
    color: theme.colors.onPrimary,
    fontFamily: fontFamilies.bold,
  },
});

