import { StyleSheet } from 'react-native';
import { theme, fontFamilies } from '../theme';

export const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  badgeCap: {
    backgroundColor: 'rgba(255, 107, 74, 0.12)',
    borderColor: 'rgba(255, 107, 74, 0.35)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.bold,
    color: theme.colors.success,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeTextCap: {
    color: theme.colors.primary,
  },
});

