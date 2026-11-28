import { useQuery } from '@tanstack/react-query';
import { organizersApi, OrganizerDto } from '@ticketshield/api-client';

export const organizersQueryKey = ['organizers'] as const;

export const useOrganizers = () =>
  useQuery<OrganizerDto[]>({
    queryKey: organizersQueryKey,
    queryFn: () => organizersApi.getOrganizers(),
    staleTime: 5 * 60 * 1000,
  });
