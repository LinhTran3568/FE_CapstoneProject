import type { PurchasedTicketDto } from '@ticketshield/types';

/** Giữ vé ở tab Upcoming thêm một thời gian sau giờ bắt đầu vì người mua có thể còn đang xếp hàng. */
export const PAST_BUFFER_HOURS = 12;

const HOUR_MS = 60 * 60 * 1000;

const READY_STATUSES = ['IN_ESCROW', 'RELEASING', 'VALID'];
const ENTRY_QR_STATUSES = [...READY_STATUSES, 'DISPUTED'];

export type TicketStatusTone = 'ready' | 'warning' | 'muted';

export interface TicketStatusView {
  label: string;
  tone: TicketStatusTone;
}

export interface PassItem {
  key: string;
  ticketCode: string;
  seatZone: string;
  qrValue: string;
}

const normalizeStatus = (status: string): string => (status || '').trim().toUpperCase();

const eventStartMs = (ticket: PurchasedTicketDto): number | null => {
  const time = new Date(ticket.eventStartAt).getTime();
  return Number.isNaN(time) ? null : time;
};

export function getStatusView(status: string): TicketStatusView {
  const normalized = normalizeStatus(status);
  if (READY_STATUSES.includes(normalized)) return { label: 'Ready for Entry', tone: 'ready' };
  if (normalized === 'DISPUTED') return { label: 'In Dispute', tone: 'warning' };
  if (normalized === 'REFUNDED') return { label: 'Refunded', tone: 'muted' };
  return { label: 'Processing', tone: 'muted' };
}

export function isPastTicket(ticket: PurchasedTicketDto, now: Date): boolean {
  if (normalizeStatus(ticket.status) === 'REFUNDED') return true;
  const start = eventStartMs(ticket);
  if (start === null) return false;
  return now.getTime() > start + PAST_BUFFER_HOURS * HOUR_MS;
}

export function splitTickets(
  tickets: PurchasedTicketDto[],
  now: Date
): { upcoming: PurchasedTicketDto[]; past: PurchasedTicketDto[] } {
  const upcoming = tickets.filter((ticket) => !isPastTicket(ticket, now));
  const past = tickets.filter((ticket) => isPastTicket(ticket, now));

  upcoming.sort(
    (a, b) => (eventStartMs(a) ?? Number.POSITIVE_INFINITY) - (eventStartMs(b) ?? Number.POSITIVE_INFINITY)
  );
  past.sort(
    (a, b) => (eventStartMs(b) ?? Number.NEGATIVE_INFINITY) - (eventStartMs(a) ?? Number.NEGATIVE_INFINITY)
  );

  return { upcoming, past };
}

export function getPassItems(ticket: PurchasedTicketDto): PassItem[] {
  const toItem = (key: string, ticketCode: string, seatZone: string, qrCodeData: string): PassItem => {
    const code = (ticketCode || '').trim();
    return { key, ticketCode: code, seatZone, qrValue: (qrCodeData || '').trim() || code };
  };

  if (ticket.bundleItems && ticket.bundleItems.length > 0) {
    return ticket.bundleItems.map((item) =>
      toItem(item.listingId, item.ticketCode, item.seatZone, item.qrCodeData)
    );
  }
  return [toItem(ticket.listingId, ticket.ticketPassCode, ticket.seatZone, ticket.qrCodeData)];
}

export function canShowEntryQr(ticket: PurchasedTicketDto): boolean {
  if (!ENTRY_QR_STATUSES.includes(normalizeStatus(ticket.status))) return false;
  return getPassItems(ticket).some((item) => item.qrValue.length > 0);
}
