import { useQuery } from '@tanstack/react-query';
import { resaleListingsApi, ResaleListingDetailDto, PaginatedList } from '@ticketshield/api-client';

export interface MarketplaceListingsParams {
  keyword?: string;
  eventId?: string;
  organizerId?: string;
  category?: string;
  city?: string;
  dateRange?: string;
  sortBy?: string;
  page?: number;
  size?: number;
}

export const marketplaceListingsQueryKey = (params?: MarketplaceListingsParams) =>
  [
    'resale-listings',
    'marketplace',
    params?.keyword || '',
    params?.eventId || '',
    params?.organizerId || '',
    params?.category || '',
    params?.city || '',
    params?.dateRange || '',
    params?.sortBy || '',
    params?.page || 1,
    params?.size || 20,
  ] as const;

export const useMarketplaceListings = (params?: MarketplaceListingsParams) =>
  useQuery<PaginatedList<ResaleListingDetailDto>>({
    queryKey: marketplaceListingsQueryKey(params),
    queryFn: () => resaleListingsApi.getMarketplaceListings(params),
    staleTime: 4_000,
  });
