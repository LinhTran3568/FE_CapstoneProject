export const MAX_TICKET_CODE_LENGTH = 50;

export interface GateScanRequest {
  scanId: string;
  ticketCode: string;
  gateName: string;
}

export interface GateScanResponse {
  scanId: string;
  result: string;
  ticketCode: string;
  eventName?: string | null;
  seatZone?: string | null;
  scannedAt: string;
  firstScannedAt?: string | null;
  firstGateName?: string | null;
}

export interface GateAccessLogDto {
  id: string;
  ticketCode: string;
  gateName: string;
  scannedAt: string;
  scanResult: string;
}

export type ScanTone = 'success' | 'danger' | 'warning';

export interface ScanResultView {
  tone: ScanTone;
  title: string;
  detail: string | null;
  canRetry: boolean;
}

const UNVERIFIED_VIEW: ScanResultView = {
  tone: 'warning',
  title: 'NOT VERIFIED - TRY AGAIN',
  detail: 'No result received. The ticket has not been rejected.',
  canRetry: true,
};

export function normalizeTicketCode(raw: string): string | null {
  const code = raw.trim();
  if (!code || code.length > MAX_TICKET_CODE_LENGTH) return null;
  return code;
}

export function formatScanTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDuplicateDetail(response: GateScanResponse): string | null {
  const time = response.firstScannedAt ? formatScanTime(response.firstScannedAt) : null;
  if (!time) return null;
  return response.firstGateName
    ? `Previously scanned at ${time} at ${response.firstGateName}`
    : `Previously scanned at ${time}`;
}

// Chỉ 4 mã đã biết mới ra xanh hoặc đỏ. Mọi thứ khác là chưa kiểm tra được.
export function getScanResultView(response: GateScanResponse | null | undefined): ScanResultView {
  switch (response?.result) {
    case 'SUCCESS':
      return {
        tone: 'success',
        title: 'APPROVED - PLEASE ENTER',
        detail: [response.eventName, response.seatZone].filter(Boolean).join(' · ') || null,
        canRetry: false,
      };
    case 'DUPLICATE_ENTRY':
      return {
        tone: 'danger',
        title: 'REJECTED - TICKET ALREADY USED',
        detail: getDuplicateDetail(response),
        canRetry: false,
      };
    case 'REVOKED':
      return {
        tone: 'danger',
        title: 'REJECTED - TICKET TRANSFERRED OR CANCELLED',
        detail: null,
        canRetry: false,
      };
    case 'INVALID_TICKET':
      return { tone: 'danger', title: 'REJECTED - TICKET NOT FOUND', detail: null, canRetry: false };
    default:
      return UNVERIFIED_VIEW;
  }
}

const SCAN_LOG_LABEL: Record<string, string> = {
  SUCCESS: 'Valid',
  DUPLICATE_ENTRY: 'Already used',
  REVOKED: 'Transferred or cancelled',
  INVALID_TICKET: 'Not found',
};

export function getScanLogLabel(scanResult: string): string {
  return SCAN_LOG_LABEL[scanResult] ?? scanResult;
}
