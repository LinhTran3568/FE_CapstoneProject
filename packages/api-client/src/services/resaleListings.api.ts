import type {
  CancelResaleListingResponse,
  ListingStatus,
  ResaleListingDetailDto,
  SellerListingDto,
} from '@ticketshield/types';
import { httpClient } from './client';

export type { ResaleListingDetailDto };

export const resaleListingsApi = {
  /**
   * Public marketplace resale listings.
   * GET /resale-listings?page=1&size=20&keyword=...
   */
  getMarketplaceListings: async (params?: {
    page?: number;
    size?: number;
    keyword?: string;
    eventId?: string;
  }): Promise<ResaleListingDetailDto[]> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.size) searchParams.set('size', params.size.toString());
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.eventId) searchParams.set('eventId', params.eventId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return httpClient<ResaleListingDetailDto[]>(`/resale-listings${query}`, {
      method: 'GET',
    });
  },

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
