import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, RefreshCw } from 'lucide-react-native';
import { theme } from '../theme';
import { GatewayInfo, checkGatewayHealth } from '../services/apiResolver';
import { useAuthStore } from '../stores/authStore';

interface GatewayStatusBadgeProps {
  onRefresh?: () => void;
  compact?: boolean;
}

export const GatewayStatusBadge: React.FC<GatewayStatusBadgeProps> = ({ onRefresh, compact = true }) => {
  const gatewayInfo = useAuthStore((state) => state.gatewayInfo);
  const refreshGateway = useAuthStore((state) => state.refreshGateway);

  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const result = await checkGatewayHealth(gatewayInfo?.url);
    setIsOnline(result.ok);
    setLatency(result.latencyMs);
    setIsChecking(false);
  };

  useEffect(() => {
    if (gatewayInfo?.url) {
      runHealthCheck();
    }
  }, [gatewayInfo?.url]);

  const handlePressRefresh = async () => {
    await refreshGateway();
    await runHealthCheck();
    onRefresh?.();
  };

  const hostDisplay = gatewayInfo?.host || 'localhost';
  const portDisplay = gatewayInfo?.port ? `:${gatewayInfo.port}` : '';

  return (
    <View style={styles.pillContainer}>
      <TouchableOpacity
        style={styles.pill}
        onPress={handlePressRefresh}
        activeOpacity={0.7}
      >
        {/* Pulsing Status Dot */}
        <View
          style={[
            styles.dot,
            isOnline === true && styles.dotOnline,
            isOnline === false && styles.dotOffline,
            isOnline === null && styles.dotPending,
          ]}
        />

        <Wifi size={12} color={isOnline ? theme.colors.success : theme.colors.textMuted} />

        <Text style={styles.networkText}>
          {hostDisplay}
          {portDisplay}
        </Text>

        {latency !== null && isOnline && (
          <Text style={styles.latencyText}>{latency}ms</Text>
        )}

        <RefreshCw
          size={11}
          color={theme.colors.textMuted}
          style={isChecking ? styles.spin : undefined}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22, 30, 46, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(38, 51, 77, 0.7)',
    borderRadius: theme.radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...theme.shadows.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOnline: {
    backgroundColor: theme.colors.success,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  dotOffline: {
    backgroundColor: theme.colors.danger,
  },
  dotPending: {
    backgroundColor: theme.colors.warning,
  },
  networkText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  latencyText: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: theme.typography.weights.bold,
  },
  spin: {
    opacity: 0.5,
  },
});
