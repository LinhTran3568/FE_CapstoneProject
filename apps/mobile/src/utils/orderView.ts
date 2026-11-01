import type { SellerListingDto } from '@ticketshield/types';

/** Chép từ RevenueTab.tsx của web, giữ nguyên tên để tìm ra ngay khi cần đổi chữ cả 2 bên. */
export const PAYOUT_STATUS_LABEL: Record<string, string> = {
  Pending: 'Pending',
  Processing: 'Sending',
  Success: 'Sent',
  Failed: 'Could not send',
};

export const ESCROW_STATUS_LABEL: Record<string, string> = {
  Pending: 'Awaiting payment',
  Locked: 'On hold',
  Releasing: 'Awaiting receipt',
  Released: 'Paid out',
  Refunded: 'Refunded',
  Disputed: 'In dispute',
  RefundQueued: 'Refunding',
  Expired: 'Expired',
  Cancelled: 'Cancelled',
};

export const labelOf = (map: Record<string, string>, value?: string | null) => {
  if (!value) return '—';
  return map[value] ?? value;
};

const PAYOUT_FAILED_HINT = 'Check the receiving account.';

const PURCHASE_TO_ESCROW_STATUS: Record<string, string> = {
  IN_ESCROW: 'Locked',
  RELEASING: 'Releasing',
  VALID: 'Released',
  DISPUTED: 'Disputed',
  REFUNDED: 'Refunded',
};

/** Chép từ ListingStatusPill của MyListingsPage.tsx. */
const LISTING_PILL_LABEL: Record<string, string> = {
  Verified: 'ON SALE',
  Transacting: 'PROCESSING',
  Sold: 'SOLD',
  Cancelled: 'CANCELLED',
  Expired: 'EXPIRED',
};

export type MoneyTone = 'warning' | 'success' | 'danger' | 'muted';

export interface MoneyLabel {
  label: string;
  tone: MoneyTone;
  hint: string | null;
}

const ESCROW_STATUS_TONE: Record<string, MoneyTone> = {
  Locked: 'warning',
  Releasing: 'warning',
  Released: 'success',
  Disputed: 'warning',
  Refunded: 'danger',
};

const toMoneyLabel = (escrowStatus: string): MoneyLabel => ({
  label: labelOf(ESCROW_STATUS_LABEL, escrowStatus),
  tone: ESCROW_STATUS_TONE[escrowStatus] ?? 'muted',
  hint: null,
});

export function getPurchaseMoneyLabel(status: string): MoneyLabel {
  const normalized = (status || '').trim().toUpperCase();
  return toMoneyLabel(PURCHASE_TO_ESCROW_STATUS[normalized] ?? status);
}

export function getListingPill(status: string): string {
  return LISTING_PILL_LABEL[status] ?? status.toUpperCase();
}

/**
 * Trạng thái giao dịch chỉ có nghĩa khi tin đã bán, vì tin mở bán lại vẫn mang giao dịch cũ.
 * Không chép nhánh "Đã thanh toán" của web: nhánh đó báo đã nhận tiền cả khi tiền chưa về.
 */
export function getListingMoney(
  listing: Pick<SellerListingDto, 'listingStatus' | 'escrowStatus' | 'payoutStatus'>
): MoneyLabel | null {
  if (listing.listingStatus !== 'Sold' || !listing.escrowStatus) return null;
  if (listing.escrowStatus === 'Locked' && listing.payoutStatus === 'Failed') {
    return { label: PAYOUT_STATUS_LABEL.Failed, tone: 'danger', hint: PAYOUT_FAILED_HINT };
  }
  return toMoneyLabel(listing.escrowStatus);
}

export function getComboLabel(
  listing: Pick<SellerListingDto, 'bundleId' | 'bundleTotalTickets'>
): string | null {
  const isBundle = Boolean(
    listing.bundleId || (listing.bundleTotalTickets && listing.bundleTotalTickets >= 2)
  );
  return isBundle ? `COMBO (${listing.bundleTotalTickets || 2} VÉ)` : null;
}
