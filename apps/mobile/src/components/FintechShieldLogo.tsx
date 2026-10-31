import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { theme } from '../theme';

interface FintechShieldLogoProps {
  size?: number;
  showSubtitle?: boolean;
}

export const FintechShieldLogo: React.FC<FintechShieldLogoProps> = ({
  size = 64,
  showSubtitle = true,
}) => {
  return (
    <View style={styles.container}>
      {/* 3D Ticket Pass Logo from Assets with Ambient Glow */}
      <View style={[styles.logoGlowWrapper, { width: size * 1.4, height: size * 1.4 }]}>
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
          <View style={styles.aiBadge}>
            <Sparkles size={10} color="#FF6B4A" />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
        {showSubtitle && (
          <Text style={styles.subtitle}>Sàn Chuyển Nhượng Vé Bảo Mật Escrow</Text>
        )}
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
    borderRadius: 999,
    backgroundColor: 'rgba(255, 90, 54, 0.25)',
    shadowColor: '#FF5A36',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleMain: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  titleAccent: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FF6B4A', // TicketShield Signature Orange
    letterSpacing: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 107, 74, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.4)',
    marginLeft: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF6B4A',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
