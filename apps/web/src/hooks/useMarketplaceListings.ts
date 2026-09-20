import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi, ResaleListingDetailDto, PaginatedList } from '@ticketshield/api-client';

export const marketplaceListingsQueryKey = (params?: { keyword?: string; eventId?: string; page?: number; size?: number }) =>
  ['resale-listings', 'marketplace', params?.keyword || '', params?.eventId || '', params?.page || 1, params?.size || 20] as const;

export const useMarketplaceListings = (params?: { keyword?: string; eventId?: string; page?: number; size?: number }) =>
  useQuery<PaginatedList<ResaleListingDetailDto>>({
    queryKey: marketplaceListingsQueryKey(params),
    queryFn: () => resaleListingsApi.getMarketplaceListings(params),
    staleTime: 4_000,
    refetchInterval: 5_000,
  });

