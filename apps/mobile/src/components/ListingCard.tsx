import React from 'react';
import { View } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import type { SellerListingDto } from '@ticketshield/types';
import { theme } from '../theme';
import { formatEventDateTime, formatPrice } from '../utils/format';
import { getComboLabel, getListingMoney, getListingPill } from '../utils/orderView';
import { Text } from './AppText';
import { MoneyBadge } from './MoneyBadge';
import { styles } from '../styles/orders.styles';

const PILL_DOT_COLOR: Record<string, string> = {
  Verified: theme.colors.primary,
  Transacting: theme.colors.warning,
  Sold: theme.colors.success,
};

export const ListingCard: React.FC<{ listing: SellerListingDto }> = ({ listing }) => {
  const money = getListingMoney(listing);
  const combo = getComboLabel(listing);
  const dotColor = PILL_DOT_COLOR[listing.listingStatus] ?? theme.colors.textMuted;

  return (
    <View style={styles.orderCard}>
      <Text style={styles.eventName} numberOfLines={2}>
        {listing.eventName}
      </Text>
      <Text style={styles.listingTier}>{listing.tierName}</Text>

      <View style={styles.metaRow}>
        <Calendar size={14} color={theme.colors.textMuted} />
        <Text style={styles.metaText}>{formatEventDateTime(listing.eventStartAt)}</Text>
      </View>
      <View style={styles.metaRow}>
        <MapPin size={14} color={theme.colors.textMuted} />
        <Text style={[styles.metaText, styles.metaTextShrink]} numberOfLines={1}>
          {listing.eventVenue}
        </Text>
      </View>

      <View style={styles.pillRow}>
        <View style={styles.listingPill}>
          <View style={[styles.listingPillDot, { backgroundColor: dotColor }]} />
          <Text style={styles.listingPillText}>{getListingPill(listing.listingStatus)}</Text>
        </View>
        {combo && (
          <View style={styles.comboPill}>
            <Text style={styles.comboPillText}>{combo}</Text>
          </View>
        )}
        {money && <MoneyBadge money={money} />}
      </View>

      {money?.hint && <Text style={styles.moneyHint}>{money.hint}</Text>}

      <View style={styles.priceBlock}>
        <Text style={styles.resalePrice}>{formatPrice(listing.resalePrice)}</Text>
        <Text style={styles.originalPrice}>Original {formatPrice(listing.originalPrice)}</Text>
      </View>
    </View>
  );
};
