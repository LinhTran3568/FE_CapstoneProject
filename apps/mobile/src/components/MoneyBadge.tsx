import React from 'react';
import { View } from 'react-native';
import { CheckCircle2, CircleDashed, Clock, XCircle } from 'lucide-react-native';
import { theme } from '../theme';
import type { MoneyLabel, MoneyTone } from '../utils/orderView';
import { Text } from './AppText';
import { styles } from '../styles/orders.styles';

const TONE_VIEW: Record<
  MoneyTone,
  { Icon: typeof Clock; color: string; badge: object; text: object }
> = {
  warning: {
    Icon: Clock,
    color: theme.colors.warning,
    badge: styles.statusBadgeWarning,
    text: styles.statusTextWarning,
  },
  success: {
    Icon: CheckCircle2,
    color: theme.colors.success,
    badge: styles.statusBadgeSuccess,
    text: styles.statusTextSuccess,
  },
  danger: {
    Icon: XCircle,
    color: theme.colors.danger,
    badge: styles.statusBadgeDanger,
    text: styles.statusTextDanger,
  },
  muted: {
    Icon: CircleDashed,
    color: theme.colors.textSecondary,
    badge: styles.statusBadgeMuted,
    text: styles.statusTextMuted,
  },
};

export const MoneyBadge: React.FC<{ money: MoneyLabel }> = ({ money }) => {
  const { Icon, color, badge, text } = TONE_VIEW[money.tone];

  return (
    <View style={[styles.statusBadge, badge]}>
      <Icon size={13} color={color} />
      <Text style={[styles.statusText, text]}>{money.label}</Text>
    </View>
  );
};
