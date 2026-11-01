import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Check, Minus, Plus } from 'lucide-react-native';
import { Text } from './AppText';
import { theme } from '../theme';
import { formatPrice } from '../utils/format';
import {
  Svg,
  G,
  Path,
  Circle,
  Rect,
  Polygon,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

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
  selectedQuantities?: Record<string, number>;
  onQuantityChange?: (key: string, quantity: number) => void;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
}

const WIDTH = 340;
const HEIGHT = 215;
const CX = WIDTH / 2;
const CY = 20;

const ZONE_COLORS = ['#FF6B4A', '#F59E0B', '#10B981', '#38BDF8', '#A78BFA'];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcBand(cx: number, cy: number, r1: number, r2: number, start: number, end: number) {
  const s1 = polar(cx, cy, r1, start);
  const e1 = polar(cx, cy, r1, end);
  const s2 = polar(cx, cy, r2, start);
  const e2 = polar(cx, cy, r2, end);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${s1.x.toFixed(1)} ${s1.y.toFixed(1)} A ${r1} ${r1} 0 ${largeArc} 1 ${e1.x.toFixed(1)} ${e1.y.toFixed(1)} L ${e2.x.toFixed(1)} ${e2.y.toFixed(1)} A ${r2} ${r2} 0 ${largeArc} 0 ${s2.x.toFixed(1)} ${s2.y.toFixed(1)} Z`;
}

function availabilityMeta(zone: SeatMapZone): string {
  if (zone.isOfficial && typeof zone.totalQuantity === 'number' && typeof zone.availableQuantity === 'number') {
    if (zone.availableQuantity <= 0) return 'Hết vé ban tổ chức';
    return `Còn ${zone.availableQuantity} / ${zone.totalQuantity} chỗ`;
  }
  if (zone.availableListings > 0) {
    return `${zone.availableListings} vé bán lại đã xác thực`;
  }
  return 'Vé chính thức';
}

function zoneTagText(index: number, count: number): string {
  if (index === 0) return 'VIP · SÁT SÂN KHẤU';
  if (index === count - 1) return 'KHÁN ĐÀI TIÊU CHUẨN';
  return 'KHU VỰC TRUNG TÂM';
}

export function EventSeatMap({
  zones,
  selectedQuantities = {},
  onQuantityChange,
  selectedKey,
  onSelect,
}: EventSeatMapProps) {
  if (zones.length === 0) return null;

  const count = Math.max(1, zones.length);
  const gap = count >= 4 ? 6 : 8;
  const baseRadius = 56;
  const maxRadius = count >= 4 ? 152 : 146;
  const bandHeight = Math.floor((maxRadius - baseRadius - (count - 1) * gap) / count);

  // 3 stadium blocks separated by radial aisles
  const sections = [
    { start: 118, end: 154 },
    { start: 68, end: 112 },
    { start: 26, end: 62 },
  ];

  const stageW = 110;
  const stageH = 16;
  const runwayW = 12;
  const runwayL = 26;
  const thrustTipY = 6 + stageH + runwayL;
  const fohY = 186;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      {/* Stadium / Arena SVG Map */}
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          backgroundColor: '#0C0A09',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 4,
          overflow: 'hidden',
        }}
      >
        <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <Defs>
            {/* Arena Atmosphere */}
            <RadialGradient id="arenaAtmosphere" cx="50%" cy="12%" r="80%">
              <Stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.16" />
              <Stop offset="45%" stopColor="#FF6B4A" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#0C0A09" stopOpacity="0" />
            </RadialGradient>

            {/* Stage Deck Gradient */}
            <LinearGradient id="stageDeckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FF8A70" />
              <Stop offset="60%" stopColor="#FF6B4A" />
              <Stop offset="100%" stopColor="#D9573B" />
            </LinearGradient>

            {/* Catwalk Runway Gradient */}
            <LinearGradient id="catwalkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B4A" />
              <Stop offset="100%" stopColor="#FF8A70" />
            </LinearGradient>

            {/* Stage Light Spotlights */}
            <LinearGradient id="beamLeft" x1="0%" y1="0%" x2="60%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#FF6B4A" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="beamRight" x1="100%" y1="0%" x2="40%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B4A" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#FF6B4A" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Ambient Lighting */}
          <Rect width={WIDTH} height={HEIGHT} fill="url(#arenaAtmosphere)" />

          {/* Stadium Bowl Perimeter */}
          <Path
            d="M 22 45 Q 170 20 318 45 L 326 175 Q 170 215 14 175 Z"
            fill="#14100E"
            stroke="#241D19"
            strokeWidth="1"
            opacity={0.65}
          />

          {/* Spotlights */}
          <Polygon points="120,18 40,165 72,185 138,24" fill="url(#beamLeft)" />
          <Polygon points="220,18 202,24 268,185 300,165" fill="url(#beamRight)" />

          {/* Stage Audio Towers */}
          <Rect
            x={CX - stageW / 2 - 8}
            y={8}
            width={5}
            height={10}
            rx={1}
            fill="#2E2521"
            stroke="#44352D"
            strokeWidth={0.8}
          />
          <Rect
            x={CX + stageW / 2 + 3}
            y={8}
            width={5}
            height={10}
            rx={1}
            fill="#2E2521"
            stroke="#44352D"
            strokeWidth={0.8}
          />

          {/* Main Stage */}
          <Rect
            x={CX - stageW / 2}
            y={6}
            width={stageW}
            height={stageH}
            rx={4}
            fill="url(#stageDeckGrad)"
          />
          <Rect
            x={CX - stageW / 2 + 2}
            y={7}
            width={stageW - 4}
            height={2}
            rx={1}
            fill="#FFFFFF"
            opacity={0.45}
          />

          {/* Catwalk Runway */}
          <Rect
            x={CX - runwayW / 2}
            y={6 + stageH - 1}
            width={runwayW}
            height={runwayL}
            fill="url(#catwalkGrad)"
          />
          {/* Diamond Thrust Stage */}
          <Polygon
            points={`${CX},${thrustTipY + 7} ${CX + 8},${thrustTipY} ${CX},${thrustTipY - 7} ${CX - 8},${thrustTipY}`}
            fill="#FF8A70"
            stroke="#FFD9CD"
            strokeWidth={0.8}
          />

          {/* Stage Label */}
          <SvgText
            x={CX}
            y={17.5}
            fontSize={8.5}
            fontWeight="900"
            fill="#24110B"
            textAnchor="middle"
            letterSpacing={2}
          >
            STAGE
          </SvgText>

          {/* Seating Zones */}
          {zones.map((zone, index) => {
            const qty = selectedQuantities[zone.key] || 0;
            const isSelected = qty > 0 || selectedKey === zone.key;
            const zoneColor = ZONE_COLORS[index % ZONE_COLORS.length];
            const inner = baseRadius + index * (bandHeight + gap);
            const outer = inner + bandHeight;

            // Multi-row seats configuration
            const rowCount = bandHeight >= 32 ? 2 : 1;
            const seatsPerSec = [4, 6, 4];
            const totalSeats = (4 + 6 + 4) * rowCount;

            const availRatio =
              zone.isOfficial && typeof zone.totalQuantity === 'number' && zone.totalQuantity > 0
                ? (zone.availableQuantity || 0) / zone.totalQuantity
                : zone.availableListings > 0
                  ? 1
                  : 0.6;
            const availCount = Math.max(2, Math.round(totalSeats * availRatio));
            let seatIdx = 0;

            return (
              <G
                key={zone.key}
                onPress={() => {
                  const maxAvail = zone.isOfficial && typeof zone.availableQuantity === 'number' ? zone.availableQuantity : 4;
                  if (maxAvail <= 0) return;
                  const nextQty = qty === 0 ? 1 : 0;
                  onQuantityChange?.(zone.key, nextQty);
                  onSelect?.(zone.key);
                }}
              >
                {/* 3 Section blocks per zone with radial aisle gaps */}
                {sections.map((sec, sIndex) => {
                  const secPath = arcBand(CX, CY, inner, outer, sec.start, sec.end);
                  return (
                    <Path
                      key={sIndex}
                      d={secPath}
                      fill={isSelected ? `${zoneColor}26` : `${zoneColor}0A`}
                      stroke={isSelected ? zoneColor : `${zoneColor}44`}
                      strokeWidth={isSelected ? 1.6 : 0.8}
                    />
                  );
                })}

                {/* Stadium Seats */}
                {Array.from({ length: rowCount }).map((_, r) => {
                  const rRadius = inner + (outer - inner) * (rowCount === 1 ? 0.5 : r === 0 ? 0.35 : 0.75);

                  return sections.map((sec, sIdx) => {
                    const sCount = seatsPerSec[sIdx];
                    return Array.from({ length: sCount }).map((__, s) => {
                      seatIdx++;
                      const angle = sec.end - ((sec.end - sec.start) / (sCount - 1)) * s;
                      const pt = polar(CX, CY, rRadius, angle);
                      const isAvail = seatIdx <= availCount;

                      return (
                        <Circle
                          key={`s-${r}-${sIdx}-${s}`}
                          cx={Number(pt.x.toFixed(1))}
                          cy={Number(pt.y.toFixed(1))}
                          r={2.6}
                          fill={isAvail ? (isSelected ? '#FFFFFF' : '#E2E8F0') : '#221C18'}
                          stroke={isAvail ? zoneColor : '#332822'}
                          strokeWidth={isAvail ? 0.9 : 0.5}
                          opacity={isAvail ? 1 : 0.5}
                        />
                      );
                    });
                  });
                })}
              </G>
            );
          })}

          {/* Front of House (FOH) Sound Console */}
          <Rect
            x={CX - 25}
            y={fohY}
            width={50}
            height={11}
            rx={2.5}
            fill="#17120F"
            stroke="#332A25"
            strokeWidth={0.8}
          />
          <SvgText
            x={CX}
            y={fohY + 8}
            fontSize={6}
            fontWeight="800"
            fill="#A18D82"
            textAnchor="middle"
            letterSpacing={1.2}
          >
            FOH · SOUND
          </SvgText>
        </Svg>

        {/* Legend Row inside container */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: '#1F1916',
            width: '100%',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}
            />
            <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Còn trống</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: '#221C18',
                borderWidth: 0.8,
                borderColor: '#382E28',
              }}
            />
            <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Đã bán</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View
              style={{
                width: 14,
                height: 7,
                borderRadius: 2.5,
                backgroundColor: 'rgba(255, 107, 74, 0.25)',
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}
            />
            <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>Khu vực đang chọn</Text>
          </View>
        </View>
      </View>

      {/* Zone list cards below */}
      <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
        {zones.map((zone, index) => {
          const qty = selectedQuantities[zone.key] || 0;
          const isSelected = qty > 0 || selectedKey === zone.key;
          const zoneColor = ZONE_COLORS[index % ZONE_COLORS.length];

          const fillRatio =
            zone.isOfficial && typeof zone.totalQuantity === 'number' && zone.totalQuantity > 0
              ? Math.max(0, Math.min(1, (zone.availableQuantity || 0) / zone.totalQuantity))
              : 0.65;
          const percentRemaining = Math.round(fillRatio * 100);

          const maxAvailable =
            zone.isOfficial && typeof zone.availableQuantity === 'number'
              ? Math.max(0, zone.availableQuantity)
              : 4;
          const maxPerTier = Math.min(4, maxAvailable);
          const isSoldOut =
            zone.isOfficial && typeof zone.availableQuantity === 'number' && zone.availableQuantity <= 0;

          return (
            <View
              key={zone.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isSelected ? zoneColor : theme.colors.border,
                backgroundColor: isSelected ? `${zoneColor}12` : theme.colors.surfaceElevated,
                overflow: 'hidden',
                gap: 12,
              }}
            >
              {/* Left Color Strip Bar */}
              <View
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  borderRadius: 2,
                  backgroundColor: zoneColor,
                }}
              />

              {/* Zone Details */}
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color: isSelected ? '#FFFFFF' : theme.colors.text,
                    }}
                  >
                    {zone.name}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: `${zoneColor}22`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 8.5,
                        fontWeight: '800',
                        color: zoneColor,
                        letterSpacing: 0.5,
                      }}
                    >
                      {zoneTagText(index, zones.length)}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: theme.colors.textMuted }}>
                  {availabilityMeta(zone)}
                </Text>

                {/* Progress bar of available seats */}
                <View
                  style={{
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: theme.colors.surfaceHighlight,
                    marginTop: 2,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${percentRemaining}%`,
                      backgroundColor: zoneColor,
                      borderRadius: 1.5,
                    }}
                  />
                </View>
              </View>

              {/* Price & Quantity Controls */}
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: isSelected ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {formatPrice(zone.originalPrice)}
                </Text>

                {isSoldOut ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: theme.colors.surfaceHighlight,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.textMuted }}>
                      Hết vé
                    </Text>
                  </View>
                ) : qty === 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      onQuantityChange?.(zone.key, 1);
                      onSelect?.(zone.key);
                    }}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: `${zoneColor}22`,
                      borderWidth: 1,
                      borderColor: `${zoneColor}66`,
                    }}
                  >
                    <Plus size={12} color={zoneColor} strokeWidth={2.5} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: zoneColor }}>Chọn vé</Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#14100E',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: zoneColor,
                      padding: 2,
                      gap: 6,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        const next = Math.max(0, qty - 1);
                        onQuantityChange?.(zone.key, next);
                        if (next > 0) onSelect?.(zone.key);
                      }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      }}
                      accessibilityRole="button"
                    >
                      <Minus size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: '#FFFFFF',
                        minWidth: 16,
                        textAlign: 'center',
                      }}
                    >
                      {qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        const next = Math.min(maxPerTier, qty + 1);
                        onQuantityChange?.(zone.key, next);
                        onSelect?.(zone.key);
                      }}
                      disabled={qty >= maxPerTier}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: qty >= maxPerTier ? 'rgba(255, 255, 255, 0.04)' : zoneColor,
                        opacity: qty >= maxPerTier ? 0.4 : 1,
                      }}
                      accessibilityRole="button"
                    >
                      <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
