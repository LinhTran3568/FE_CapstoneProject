import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text } from './AppText';
import { theme } from '../theme';
import { fontFamilies } from '../theme/typography';
import type { PassItem } from '../utils/ticketView';

const QR_SIZE = 230;

interface TicketPassPagerProps {
  items: PassItem[];
}

function PassQr({ item, showSeat }: { item: PassItem; showSeat: boolean }) {
  return (
    <View style={styles.pass}>
      <View style={styles.qrBox}>
        {item.qrValue ? (
          <QRCode value={item.qrValue} size={QR_SIZE} color="#0C0A09" backgroundColor="#ffffff" />
        ) : (
          <Text style={styles.qrMissing}>Entry code unavailable</Text>
        )}
      </View>
      {item.ticketCode ? (
        <Text style={styles.code} selectable>
          {item.ticketCode}
        </Text>
      ) : null}
      {showSeat ? <Text style={styles.seat}>{item.seatZone}</Text> : null}
    </View>
  );
}

export function TicketPassPager({ items }: TicketPassPagerProps) {
  const [pageWidth, setPageWidth] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  if (items.length === 1) {
    return <PassQr item={items[0]} showSeat={false} />;
  }

  return (
    <View onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
      {pageWidth > 0 && (
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <View style={{ width: pageWidth }}>
              <PassQr item={item} showSeat />
            </View>
          )}
          onMomentumScrollEnd={(event) =>
            setPageIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth))
          }
        />
      )}
      <Text style={styles.position}>
        Ticket {pageIndex + 1} of {items.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pass: {
    alignItems: 'center',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: QR_SIZE,
    minHeight: QR_SIZE,
  },
  qrMissing: {
    fontSize: theme.typography.sizes.sm,
    color: '#333333',
  },
  code: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    fontFamily: fontFamilies.mono,
    color: theme.colors.text,
  },
  seat: {
    marginTop: 4,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  position: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
});
