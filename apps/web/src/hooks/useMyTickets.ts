import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi } from '@ticketshield/api-client';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { useAuthStore } from '../stores/authStore';

export const myPurchasedTicketsQueryKey = ['resale-listings', 'my-purchased-tickets'] as const;

const isRefunded = (ticket: PurchasedTicketDto) =>
  (ticket.status || '').trim().toUpperCase() === 'REFUNDED';

export const useMyTickets = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery<PurchasedTicketDto[]>({
    queryKey: myPurchasedTicketsQueryKey,
    queryFn: async () => {
      const tickets = await resaleListingsApi.getMyPurchasedTickets();
      return (tickets ?? []).filter((ticket) => !isRefunded(ticket));
    },
    enabled: isAuthenticated,
  });
};
