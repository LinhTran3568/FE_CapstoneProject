import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, Sparkles } from 'lucide-react-native';
import { theme } from '../theme';

interface FintechShieldLogoProps {
  size?: number;
  showSubtitle?: boolean;
}

export const FintechShieldLogo: React.FC<FintechShieldLogoProps> = ({
  size = 56,
  showSubtitle = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Outer Glow Halo */}
      <View style={[styles.glowContainer, { width: size * 1.5, height: size * 1.5, borderRadius: (size * 1.5) / 2 }]}>
        <View style={[styles.iconCircle, { width: size * 1.2, height: size * 1.2, borderRadius: (size * 1.2) / 2 }]}>
          <Shield size={size * 0.65} color={theme.colors.primary} strokeWidth={2.2} />
          <View style={styles.sparkleBadge}>
            <Sparkles size={14} color={theme.colors.accent} />
          </View>
        </View>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.titleMain}>TICKET</Text>
          <Text style={styles.titleAccent}>SHIELD</Text>
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>AI</Text>
          </View>
        </View>
        {showSubtitle && (
          <Text style={styles.subtitle}>Sàn Chuyển Nhượng Vé Bảo Mật & Escrow</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
  },
  glowContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.shadows.glow,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleMain: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.text,
    letterSpacing: 1.5,
  },
  titleAccent: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.extrabold,
    color: theme.colors.primary,
    letterSpacing: 1.5,
  },
  aiPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginLeft: 4,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: theme.typography.weights.medium,
  },
});

