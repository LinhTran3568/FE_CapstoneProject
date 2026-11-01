import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { Text } from './AppText';
import { theme } from '../theme';
import { formatEventDate } from '../utils/format';

interface OfflineNoticeProps {
  lastUpdatedAt: string | null;
}

export function OfflineNotice({ lastUpdatedAt }: OfflineNoticeProps) {
  const updated = lastUpdatedAt
    ? formatEventDate(lastUpdatedAt, {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      })
    : null;

  return (
    <View style={styles.notice} accessibilityRole="alert">
      <WifiOff size={16} color={theme.colors.warning} />
      <Text style={styles.text}>
        {updated ? `You are offline. Last updated ${updated}.` : 'You are offline.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.warningLight,
    borderWidth: 1,
    borderColor: theme.colors.warningBorder,
  },
  text: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
