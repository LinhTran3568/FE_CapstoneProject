import { useQuery } from '@tanstack/react-query';
import { mockTicketsApi } from '@ticketshield/api-client';
import type { MockTicketDto } from '@ticketshield/types';
import { useAuthStore } from '../stores/authStore';

export const myTicketsQueryKey = (email: string) =>
  ['mock-tickets', 'my-tickets', email] as const;

export const useMyTickets = () => {
  const { isAuthenticated, user } = useAuthStore();
  const email = user?.email?.trim() ?? '';

  return useQuery<MockTicketDto[]>({
    queryKey: myTicketsQueryKey(email),
    queryFn: () => mockTicketsApi.getMyTickets(email),
    enabled: isAuthenticated && email.length > 0,
  });
};
