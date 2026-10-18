import { DisputeReasonCode } from '@ticketshield/api-client';

/** The reasons a buyer can pick when filing a dispute, shared by the filing form and the progress drawer. */
export const DISPUTE_REASONS = [
  {
    code: DisputeReasonCode.TicketInvalid,
    title: 'Vé không hợp lệ / Không quét được mã',
    desc: 'Mã QR bị từ chối hoặc máy quét tại cổng báo không đúng dữ liệu.',
  },
  {
    code: DisputeReasonCode.DuplicateEntry,
    title: 'Vé trùng lặp / Đã có người quét trước',
    desc: 'Vé đã được người khác sử dụng để vào cổng trước bạn.',
  },
  {
    code: DisputeReasonCode.FakeTicket,
    title: 'Vé giả / Sai thông tin niêm yết',
    desc: 'Khán đài, vị trí ghế hoặc chi tiết sự kiện không đúng cam kết.',
  },
];

export const disputeReasonTitle = (code: number): string =>
  DISPUTE_REASONS.find((reason) => reason.code === code)?.title ?? 'Sự cố với vé';
