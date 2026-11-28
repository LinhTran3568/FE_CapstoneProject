import { DisputeReasonCode } from '@ticketshield/api-client';

/** The reasons a buyer can pick when filing a dispute, shared by the filing form and the progress drawer. */
export const DISPUTE_REASONS = [
  {
    code: DisputeReasonCode.TicketInvalid,
    title: 'Invalid Ticket / Cannot Scan QR',
    desc: 'QR code was rejected or the gate scanner reported invalid data.',
  },
  {
    code: DisputeReasonCode.DuplicateEntry,
    title: 'Duplicate Ticket / Already Scanned',
    desc: 'The ticket was already scanned by someone else before you entered.',
  },
  {
    code: DisputeReasonCode.FakeTicket,
    title: 'Counterfeit / Incorrect Tier or Seat',
    desc: 'Seat zone, row, or event details do not match the listing commitment.',
  },
];

export const disputeReasonTitle = (code: number): string =>
  DISPUTE_REASONS.find((reason) => reason.code === code)?.title ?? 'Ticket Issue';
