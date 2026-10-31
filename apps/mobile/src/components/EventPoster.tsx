import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { theme } from '../theme';

type Palette = {
  bg: string;
  deep: string;
  glow: string;
  beam: string;
  accent: string;
};

const PALETTES: Palette[] = [
  {
    bg: '#2A0F0A',
    deep: '#120806',
    glow: '#FF6B4A',
    beam: '#FFB59E',
    accent: '#FFD9CD',
  },
  {
    bg: '#2B0E1B',
    deep: '#12070D',
    glow: '#FB7185',
    beam: '#FDA4AF',
    accent: '#FFE4E6',
  },
  {
    bg: '#2A1B06',
    deep: '#120C04',
    glow: '#FBBF24',
    beam: '#FDE68A',
    accent: '#FEF3C7',
  },
  {
    bg: '#251208',
    deep: '#100804',
    glow: '#FDBA74',
    beam: '#FED7AA',
    accent: '#FFEDD5',
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface EventPosterProps {
  seed: string;
  height?: number;
  style?: ViewStyle;
  rounded?: boolean;
}

/**
 * Deterministic, offline "concert poster" artwork.
 *
 * The product has no event photography yet, so every listing gets a generated
 * stage-light scene derived from its id. Same event => same poster, no network.
 */
export const EventPoster: React.FC<EventPosterProps> = ({
  seed,
  height = 160,
  style,
  rounded = false,
}) => {
  const hash = hashString(seed || 'ticketshield');
  const palette = PALETTES[hash % PALETTES.length];
  const uid = `p${hash.toString(36)}`;

  const crowd = Array.from({ length: 14 }, (_, index) => {
    const x = index * 30 - 10;
    const radius = 11 + ((hash >> (index % 12)) % 12);
    const baseY = 200;
    return `M${x - radius} ${baseY} V${baseY - radius} a${radius} ${radius} 0 0 1 ${radius * 2} 0 V${baseY} Z`;
  }).join(' ');

  const sparkles = Array.from({ length: 7 }, (_, index) => {
    const x = 24 + ((hash >> (index * 3)) % 352);
    const y = 20 + ((hash >> (index * 5)) % 90);
    const radius = 1 + ((hash >> index) % 3);
    return <Circle key={index} cx={x} cy={y} r={radius} fill={palette.accent} opacity={0.5} />;
  });

  return (
    <View
      style={[styles.container, { height }, rounded && styles.rounded, style]}
      accessibilityRole="image"
      accessibilityLabel="Event concert stage poster"
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.9" y2="1">
            <Stop offset="0" stopColor={palette.bg} />
            <Stop offset="1" stopColor={palette.deep} />
          </LinearGradient>
          <RadialGradient id={`${uid}-spot`} cx="0.32" cy="0.18" r="0.8">
            <Stop offset="0" stopColor={palette.glow} stopOpacity="0.85" />
            <Stop offset="0.55" stopColor={palette.glow} stopOpacity="0.22" />
            <Stop offset="1" stopColor={palette.glow} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.beam} stopOpacity="0.34" />
            <Stop offset="1" stopColor={palette.beam} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Rect width="400" height="200" fill={`url(#${uid}-bg)`} />
        <Rect width="400" height="200" fill={`url(#${uid}-spot)`} />

        <G opacity={0.55}>
          <Path d="M150 0 L210 0 L80 200 L20 200 Z" fill={`url(#${uid}-beam)`} />
          <Path d="M250 0 L310 0 L380 200 L320 200 Z" fill={`url(#${uid}-beam)`} />
          <Path d="M196 0 L204 0 L290 200 L110 200 Z" fill={`url(#${uid}-beam)`} opacity={0.5} />
        </G>

        <Circle cx="200" cy="86" r="54" stroke={palette.accent} strokeWidth="1" opacity={0.18} fill="none" />
        <Circle cx="200" cy="86" r="76" stroke={palette.accent} strokeWidth="1" opacity={0.1} fill="none" />

        {sparkles}

        <Path d={crowd} fill={palette.deep} opacity={0.85} />
        <Rect x="0" y="196" width="400" height="4" fill={palette.glow} opacity={0.35} />
      </Svg>
      <View style={styles.vignette} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
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
