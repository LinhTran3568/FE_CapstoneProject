import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resaleListingsApi } from '@ticketshield/api-client';
import type { SellerListingDto } from '@ticketshield/types';

/** Cache key for the signed-in seller's listings. Invalidate it after any listing change. */
export const myListingsQueryKey = ['resale-listings', 'mine'] as const;

/** The full-screen error replaces the list only before any list has arrived. */
export const listingsFailedBeforeAnyData = (data: unknown, isError: boolean) =>
  isError && data === undefined;

/**
 * All listings of the signed-in seller (every status).
 * Filtering by status happens on the page so the per-status counts stay available.
 */
export const useMyListings = (refetchInterval?: number, enabled = true) =>
  useQuery({
    queryKey: myListingsQueryKey,
    queryFn: () => resaleListingsApi.getMyListings(),
    refetchInterval: (query) => {
      if (typeof refetchInterval === 'number') return refetchInterval;

      const listings = query.state.data ?? [];
      const hasActiveSettlement = listings.some(
        (l) => l.inSettlementBuffer || l.escrowStatus === 'Locked' || l.listingStatus === 'Transacting'
      );
      if (hasActiveSettlement) return 1500;

      const hasOnSale = listings.some((l) => l.listingStatus === 'Verified');
      if (hasOnSale) return 2500;

      return 4000;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    enabled,
  });

/**
 * Cancel a listing. On success the cached row is switched to `Cancelled` immediately,
 * then the list is refetched from the backend. On error nothing changes locally, so the
 * listing keeps its current status and the seller can retry.
 */
export const useCancelListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => resaleListingsApi.cancelListing(listingId),
    onSuccess: (result) => {
      queryClient.setQueryData<SellerListingDto[]>(myListingsQueryKey, (listings) =>
        listings?.map((listing) =>
          listing.listingId === result.listingId
            ? { ...listing, listingStatus: result.listingStatus }
            : listing
        )
      );
      void queryClient.invalidateQueries({ queryKey: myListingsQueryKey });
    },
  });
};
