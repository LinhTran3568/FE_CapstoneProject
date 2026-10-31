import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  rounded: {
    borderRadius: theme.radii.xl,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
});
