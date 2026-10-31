import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Server, Wifi, RefreshCw } from 'lucide-react-native';
import { theme } from '../theme';
import { GatewayInfo, checkGatewayHealth } from '../services/apiResolver';
import { useAuthStore } from '../stores/authStore';

interface GatewayStatusBadgeProps {
  onRefresh?: () => void;
}

export const GatewayStatusBadge: React.FC<GatewayStatusBadgeProps> = ({ onRefresh }) => {
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

  const getSourceLabel = (src?: GatewayInfo['source']) => {
    switch (src) {
      case 'lan_auto_detect':
        return 'LAN Auto';
      case 'emulator_alias':
        return 'Emulator Bridge';
      case 'custom_override':
        return 'Custom IP';
      case 'env_config':
        return 'Env Config';
      default:
        return 'Localhost';
    }
  };

  const hostDisplay = gatewayInfo?.host || 'Chưa nhận diện';
  const portDisplay = gatewayInfo?.port ? `:${gatewayInfo.port}` : '';

  return (
    <View style={styles.container}>
      <View style={styles.infoRow}>
        <View style={styles.leftGroup}>
          <View style={styles.iconWrapper}>
            {gatewayInfo?.isLan ? (
              <Wifi size={14} color={theme.colors.primary} />
            ) : (
              <Server size={14} color={theme.colors.secondary} />
            )}
          </View>
          <View>
            <View style={styles.statusLine}>
              <View
                style={[
                  styles.statusDot,
                  isOnline === true && styles.dotOnline,
                  isOnline === false && styles.dotOffline,
                  isOnline === null && styles.dotPending,
                ]}
              />
              <Text style={styles.hostText}>
                {hostDisplay}
                {portDisplay}
              </Text>
              <View style={styles.sourceTag}>
                <Text style={styles.sourceTagText}>
                  {getSourceLabel(gatewayInfo?.source)}
                </Text>
              </View>
            </View>
            <Text style={styles.latencyText}>
              {isChecking
                ? 'Đang kiểm tra kết nối...'
                : isOnline
                ? `Đã kết nối • Độ trễ ${latency}ms`
                : 'Mạng ngoại tuyến / Chờ backend'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handlePressRefresh}
          style={styles.refreshBtn}
          activeOpacity={0.7}
        >
          <RefreshCw
            size={14}
            color={theme.colors.textSecondary}
            style={isChecking ? styles.spinIcon : undefined}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: theme.colors.success,
  },
  dotOffline: {
    backgroundColor: theme.colors.danger,
  },
  dotPending: {
    backgroundColor: theme.colors.warning,
  },
  hostText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  sourceTag: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sourceTagText: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  latencyText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.inputBackground,
  },
  spinIcon: {
    opacity: 0.5,
  },
});

