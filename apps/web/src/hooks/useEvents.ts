import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@ticketshield/api-client';

export const useEvents = (params?: { category?: string; query?: string }) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.getAll(params),
  });
};

export const useEventDetail = (id: string) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
};
