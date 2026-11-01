import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from './AppText';
import { theme } from '../theme';
import { formatPrice } from '../utils/format';
import { styles } from './EventSeatMap.styles';

export interface SeatMapZone {
  key: string;
  name: string;
  originalPrice: number;
  minResalePrice?: number;
  availableListings: number;
  totalQuantity?: number;
  availableQuantity?: number;
  isOfficial: boolean;
  seatZones: string[];
}

interface EventSeatMapProps {
  zones: SeatMapZone[];
  selectedKey?: string;
  onSelect: (key: string) => void;
}

function availabilityMeta(zone: SeatMapZone): string {
  if (zone.isOfficial && typeof zone.totalQuantity === 'number' && typeof zone.availableQuantity === 'number') {
    if (zone.availableQuantity <= 0) return 'Sold out at box office';
    return `${zone.availableQuantity} of ${zone.totalQuantity} seats left`;
  }
  if (zone.availableListings > 0) {
    return `${zone.availableListings} verified resale ${zone.availableListings === 1 ? 'pass' : 'passes'}`;
  }
  return 'Official inventory';
}

function fillPercent(zone: SeatMapZone): number | null {
  if (
    zone.isOfficial &&
    typeof zone.totalQuantity === 'number' &&
    typeof zone.availableQuantity === 'number' &&
    zone.totalQuantity > 0
  ) {
    return Math.min(100, Math.max(3, (zone.availableQuantity / zone.totalQuantity) * 100));
  }
  return null;
}

export function EventSeatMap({ zones, selectedKey, onSelect }: EventSeatMapProps) {
  if (zones.length === 0) return null;

  return (
    <View style={styles.arena}>
      <View style={[styles.arcOuter, styles.noPointer]} />
      <View style={[styles.arcInner, styles.noPointer]} />

      <View style={[styles.stageGlow, styles.noPointer]} />
      <View style={styles.stageBar}>
        <View style={styles.stageDot} />
        <Text style={styles.stageText}>STAGE</Text>
        <View style={styles.stageDot} />
      </View>
      <Text style={styles.stageHint}>Premium zones sit closest to the stage</Text>

      <View style={styles.zones}>
        {zones.map((zone, index) => {
          const isSelected = selectedKey === zone.key;
          const fill = fillPercent(zone);
          const widthPercent = `${Math.min(100, 72 + index * 12)}%` as const;
          const fillColor =
            fill === null
              ? theme.colors.primary
              : fill > 35
                ? theme.colors.success
                : fill > 12
                  ? theme.colors.warning
                  : theme.colors.danger;

          return (
            <TouchableOpacity
              key={zone.key}
              style={[styles.zone, { width: widthPercent }, isSelected && styles.zoneSelected]}
              onPress={() => onSelect(zone.key)}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${zone.name}, ${availabilityMeta(zone)}, ${formatPrice(
                zone.originalPrice
              )}`}
            >
              <View style={styles.zoneHeader}>
                <View style={styles.zoneIdentity}>
                  <Text style={[styles.zoneName, isSelected && styles.zoneNameSelected]} numberOfLines={1}>
                    {zone.name}
                  </Text>
                  <Text style={styles.zoneMeta} numberOfLines={1}>
                    {availabilityMeta(zone)}
                  </Text>
                </View>

                <View style={styles.zonePriceGroup}>
                  {isSelected && (
                    <View style={styles.selectedPill}>
                      <Check size={10} color={theme.colors.onPrimary} strokeWidth={3} />
                    </View>
                  )}
                  <View style={styles.priceBlock}>
                    <Text style={[styles.zonePrice, isSelected && styles.zonePriceSelected]}>
                      {formatPrice(zone.originalPrice)}
                    </Text>
                    {typeof zone.minResalePrice === 'number' && zone.minResalePrice < zone.originalPrice && (
                      <Text style={styles.resaleHint}>resale from {formatPrice(zone.minResalePrice)}</Text>
                    )}
                  </View>
                </View>
              </View>

              {fill !== null && (
                <View style={styles.capacityTrack}>
                  <View style={[styles.capacityFill, { width: `${fill}%`, backgroundColor: fillColor }]} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
        <Text style={styles.legendText}>Available</Text>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
        <Text style={styles.legendText}>Limited</Text>
        <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
        <Text style={styles.legendText}>Selected</Text>
      </View>
    </View>
  );
}
