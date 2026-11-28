import type { PurchasedTicketDto } from '@ticketshield/types';

/** Expand each backend bundle item into its own ticket pass and QR. */
export const expandPurchasedTickets = (tickets: PurchasedTicketDto[]): PurchasedTicketDto[] =>
  tickets.flatMap((ticket) => {
    if (!ticket.bundleItems?.length) return [ticket];

    return ticket.bundleItems.map((item) => ({
      ...ticket,
      listingId: item.listingId || ticket.listingId,
      ticketPassCode: item.ticketCode || item.qrCodeData || ticket.ticketPassCode,
      status: item.status || ticket.status,
      seatZone: item.seatZone || ticket.seatZone,
      qrCodeData: item.qrCodeData || ticket.qrCodeData,
      qrCodeImageUrl: item.qrCodeImageUrl || ticket.qrCodeImageUrl,
      bundleItems: undefined,
    }));
  });

/** Use the exact QR issued by BE; never generate a different client-only token. */
export const getIssuedQrImageUrl = (
  ticket: Pick<PurchasedTicketDto, 'qrCodeImageUrl' | 'qrCodeData' | 'ticketPassCode'>
) => {
  if (ticket.qrCodeImageUrl?.trim()) return ticket.qrCodeImageUrl.trim();
  const payload = ticket.qrCodeData?.trim() || ticket.ticketPassCode?.trim();
  return payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`
    : '';
};
