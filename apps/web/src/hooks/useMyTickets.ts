import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi } from '@ticketshield/api-client';
import type { PurchasedTicketDto } from '@ticketshield/types';

export const myPurchasedTicketsQueryKey = ['purchased-tickets', 'mine'] as const;

/**
 * Hook to fetch all purchased ticket passes for the authenticated buyer.
 */
export const useMyPurchasedTickets = () =>
  useQuery<PurchasedTicketDto[]>({
    queryKey: myPurchasedTicketsQueryKey,
    queryFn: () => resaleListingsApi.getMyPurchasedTickets(),
    refetchInterval: 5000, // Poll every 5s to refresh newly bought passes
  });
