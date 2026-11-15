// Nhãn trạng thái tiền và tin đăng dùng chung cho web.
// ESCROW_STATUS_LABEL, PAYOUT_STATUS_LABEL, labelOf chép nguyên từ RevenueTab (trang doanh thu người bán).
// Mobile có bản chép cùng tên hằng ở apps/mobile/src/utils/orderView.ts: đổi chữ thì sửa cả 2 nơi.

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

/** Chép từ ListingStatusPill của MyListingsPage. Trạng thái khác viết hoa nguyên văn. */
export const LISTING_STATUS_LABEL: Record<string, string> = {
  Verified: 'ON SALE',
  Transacting: 'PROCESSING',
  Sold: 'SOLD',
  Cancelled: 'CANCELLED',
  Expired: 'EXPIRED',
};

export const VERIFICATION_STATUS_LABEL: Record<string, string> = {
  PendingOtp: 'Awaiting OTP',
  Verified: 'Verified',
  Rejected: 'Rejected',
};

/** Giá trị lạ hiện nguyên văn, không rơi về một nhãn mặc định nào. */
export const labelOf = (map: Record<string, string>, value?: string | null) => {
  if (!value) return '—';
  return map[value] ?? value;
};

export const listingStatusLabel = (status?: string | null) => {
  if (!status) return '—';
  return LISTING_STATUS_LABEL[status] ?? status.toUpperCase();
};
