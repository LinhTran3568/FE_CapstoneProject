import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const styles = StyleSheet.create({
  baseButton: {
    minHeight: theme.spacing['5xl'] + 4,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.glow,
  },
  btnSecondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnSuccess: {
    backgroundColor: theme.colors.success,
  },
  btnDanger: {
    backgroundColor: theme.colors.danger,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: theme.colors.onPrimary,
  },
  textSecondary: {
    color: theme.colors.onSecondary,
  },
  textSuccess: {
    color: theme.colors.onSuccess,
  },
  textDanger: {
    color: theme.colors.onDanger,
  },
  textOutline: {
    color: theme.colors.text,
  },
});
