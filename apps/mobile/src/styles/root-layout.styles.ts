import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  spinner: {
    marginTop: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
  },
});
