import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '@ticketshield/api-client';

export const useMyTickets = () => {
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => ticketsApi.getMyTickets(),
  });
};

export const useTicketDetail = (id: string) => {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
  });
};
