import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi, ResaleListingDetailDto } from '@ticketshield/api-client';

export const marketplaceListingsQueryKey = (params?: { keyword?: string; eventId?: string }) =>
  ['resale-listings', 'marketplace', params?.keyword || '', params?.eventId || ''] as const;

export const useMarketplaceListings = (params?: { keyword?: string; eventId?: string; page?: number; size?: number }) =>
  useQuery<ResaleListingDetailDto[]>({
    queryKey: marketplaceListingsQueryKey(params),
    queryFn: () => resaleListingsApi.getMarketplaceListings(params),
    staleTime: 10_000,
  });
