import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { theme } from '../theme';
import { Text } from './AppText';

interface FintechShieldLogoProps {
  size?: number;
  showSubtitle?: boolean;
  subtitle?: string;
}

export const FintechShieldLogo: React.FC<FintechShieldLogoProps> = ({
  size = 64,
  showSubtitle = true,
  subtitle = 'Secure Ticket Exchange & Escrow',
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.logoGlowWrapper, { width: size * 1.3, height: size * 1.3 }]}>
        <View style={styles.glowBackdrop} />
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.titleMain}>TICKET</Text>
          <Text style={styles.titleAccent}>SHIELD</Text>
        </View>
        {showSubtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  logoGlowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBackdrop: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  titleMain: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.text,
    letterSpacing: 1.2,
  },
  titleAccent: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.weights.regular,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
