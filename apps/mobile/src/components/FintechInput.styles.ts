import { StyleSheet } from 'react-native';
import { theme } from '../theme';
import { fontFamilies } from '../theme/typography';

export const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.spacing['5xl'] + 4,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  iconSlot: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: theme.typography.sizes.base,
    minHeight: theme.spacing['5xl'] + 2,
    paddingVertical: theme.spacing.sm,
  },
  eyeBtn: {
    width: theme.spacing['5xl'] - 4,
    height: theme.spacing['5xl'] - 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.weights.medium,
  },
});
