import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi } from '@ticketshield/api-client';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { useAuthStore } from '../stores/authStore';

export const myPurchasedTicketsQueryKey = ['resale-listings', 'my-purchased-tickets'] as const;

const unpaidOrRefundedStatuses = new Set(['PENDING_PAYMENT', 'REFUNDED', 'REFUNDQUEUED']);

const isPaidPurchasedPass = (ticket: PurchasedTicketDto) => {
  const status = (ticket.status || '').trim().toUpperCase();
  return !unpaidOrRefundedStatuses.has(status);
};

export const useMyTickets = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<PurchasedTicketDto[]>({
    queryKey: myPurchasedTicketsQueryKey,
    queryFn: async () => {
      const tickets = await resaleListingsApi.getMyPurchasedTickets();
      return (tickets ?? []).filter(isPaidPurchasedPass);
    },
    enabled: isAuthenticated,
  });
};
