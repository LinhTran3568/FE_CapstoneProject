import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockTicketsApi, resaleListingsApi } from '@ticketshield/api-client';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { useAuthStore } from '../stores/authStore';

export const myPurchasedTicketsQueryKey = ['resale-listings', 'my-purchased-tickets'] as const;

const unpaidOrRefundedStatuses = new Set(['PENDING_PAYMENT', 'REFUNDED', 'REFUNDQUEUED']);

const isPaidPurchasedPass = (ticket: PurchasedTicketDto) => {
  const status = (ticket.status || '').trim().toUpperCase();
  return !unpaidOrRefundedStatuses.has(status);
};

/** A sale refunded through a dispute: no ticket any more, but the buyer still needs to read the result. */
const isRefundedWithDispute = (ticket: PurchasedTicketDto) =>
  (ticket.status || '').trim().toUpperCase() === 'REFUNDED' && Boolean(ticket.disputeId);

interface UseMyTicketsOptions {
  /** Also keep refunded sales that have a dispute. Only the "My tickets" page wants them. */
  includeDisputeHistory?: boolean;
}

/**
 * The signed-in buyer's tickets. The cache holds every row the backend returns; each caller
 * filters it with `select`, so the sell page and the profile never see a refunded sale as a ticket.
 */
export const useMyTickets = ({ includeDisputeHistory = false }: UseMyTicketsOptions = {}) => {
  const { isAuthenticated } = useAuthStore();

  const select = useCallback(
    (tickets: PurchasedTicketDto[]) =>
      tickets.filter(
        (ticket) => isPaidPurchasedPass(ticket) || (includeDisputeHistory && isRefundedWithDispute(ticket))
      ),
    [includeDisputeHistory]
  );

  return useQuery<PurchasedTicketDto[], Error, PurchasedTicketDto[]>({
    queryKey: myPurchasedTicketsQueryKey,
    queryFn: async () => {
      const tickets = (await resaleListingsApi.getMyPurchasedTickets()) ?? [];
      const ticketCodes = tickets.flatMap((ticket) => [
        ticket.ticketPassCode,
        ...(ticket.bundleItems || []).map((item) => item.ticketCode),
      ]);
      const liveStatuses = await mockTicketsApi.getTicketStatuses(ticketCodes);

      return tickets.map((ticket) => {
        const bundleItems = ticket.bundleItems?.map((item) => ({
          ...item,
          status: liveStatuses.get(item.ticketCode) || item.status,
        }));
        const organizerStatus = liveStatuses.get(ticket.ticketPassCode);
        return {
          ...ticket,
          status: organizerStatus || ticket.status,
          bundleItems,
        };
      });
    },
    select,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
};
