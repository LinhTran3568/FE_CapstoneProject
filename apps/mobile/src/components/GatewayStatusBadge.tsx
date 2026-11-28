import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './AppText';
import { Wifi, RefreshCw } from 'lucide-react-native';
import { theme } from '../theme';
import { checkGatewayHealth } from '../lib/apiResolver';
import { useAuthStore } from '../stores/authStore';
import { styles } from './GatewayStatusBadge.styles';

interface GatewayStatusBadgeProps {
  onRefresh?: () => void;
  compact?: boolean;
}

const GatewayStatusBadgeDev: React.FC<GatewayStatusBadgeProps> = ({ onRefresh }) => {
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
      <TouchableOpacity style={styles.pill} onPress={handlePressRefresh} activeOpacity={0.7}>
        <View
          style={[
            styles.dot,
            isOnline === true && styles.dotOnline,
            isOnline === false && styles.dotOffline,
            isOnline === null && styles.dotPending,
          ]}
        />
        <Wifi size={13} color={isOnline ? theme.colors.success : theme.colors.textMuted} />
        <Text style={styles.networkText}>
          {hostDisplay}
          {portDisplay}
        </Text>
        {latency !== null && isOnline && <Text style={styles.latencyText}>{latency}ms</Text>}
        <RefreshCw
          size={13}
          color={theme.colors.textMuted}
          style={isChecking ? styles.spin : undefined}
        />
      </TouchableOpacity>
    </View>
  );
};

export const GatewayStatusBadge: React.FC<GatewayStatusBadgeProps> = (props) => {
  // Developer-only chrome: never ship network host/port/latency to users.
  if (!__DEV__) return null;
  return <GatewayStatusBadgeDev {...props} />;
};
