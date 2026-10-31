import React from 'react';
import { View, Image } from 'react-native';
import { theme } from '../theme';
import { Text } from './AppText';
import { styles } from './FintechShieldLogo.styles';

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
