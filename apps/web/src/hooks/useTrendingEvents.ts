import { useQuery } from '@tanstack/react-query';
import { eventsApi, TrendingEventDto } from '@ticketshield/api-client';

export const trendingEventsQueryKey = (params?: { limit?: number; category?: string; city?: string }) =>
  ['events', 'trending', params?.limit || 6, params?.category || 'ALL', params?.city || 'ALL'] as const;

export const useTrendingEvents = (params?: { limit?: number; category?: string; city?: string }) =>
  useQuery<TrendingEventDto[]>({
    queryKey: trendingEventsQueryKey(params),
    queryFn: () => eventsApi.getTrendingEvents(params),
    staleTime: 30_000,
  });
