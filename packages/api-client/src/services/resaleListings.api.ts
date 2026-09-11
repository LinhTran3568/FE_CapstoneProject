import type {
  CancelResaleListingResponse,
  ListingStatus,
  SellerListingDto,
} from '@ticketshield/types';
import { httpClient } from './client';

export const resaleListingsApi = {
  /**
   * Listings published by the signed-in seller, newest first.
   * GET /resale-listings/my-listings[?status=Verified]  (JWT required)
   */
  getMyListings: async (status?: ListingStatus): Promise<SellerListingDto[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return httpClient<SellerListingDto[]>(`/resale-listings/my-listings${query}`, {
      method: 'GET',
    });
  },

  /**
   * Cancel a listing that is still `Verified` (no buyer yet).
   * POST /resale-listings/{id}/cancel  (JWT required, caller must be the seller)
   *
   * The backend unlocks the original ticket at the organizer first. If that
   * unlock fails, nothing is cancelled and this call throws — the listing keeps
   * its current status so the seller can retry.
   */
  cancelListing: async (listingId: string): Promise<CancelResaleListingResponse> => {
    return httpClient<CancelResaleListingResponse>(
      `/resale-listings/${encodeURIComponent(listingId)}/cancel`,
      { method: 'POST' }
    );
  },
};
