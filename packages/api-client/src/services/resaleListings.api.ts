import type {
  CancelResaleListingResponse,
  HoldListingForPurchaseRequest,
  HoldListingForPurchaseResponse,
  ListingStatus,
  PaymentStatusDto,
  PaginatedList,
  PurchasedTicketDto,
  ResaleListingDetailDto,
  SellerListingDto,
} from '@ticketshield/types';
import { httpClient } from './client';

export type {
  ResaleListingDetailDto,
  PaginatedList,
  HoldListingForPurchaseRequest,
  HoldListingForPurchaseResponse,
  PurchasedTicketDto,
  PaymentStatusDto,
};

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
  }): Promise<PaginatedList<ResaleListingDetailDto>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.size) searchParams.set('size', params.size.toString());
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.eventId) searchParams.set('eventId', params.eventId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return httpClient<PaginatedList<ResaleListingDetailDto>>(`/resale-listings${query}`, {
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
   * Purchased digital passes for the signed-in buyer.
   * GET /resale-listings/my-purchased-tickets (JWT required)
   */
  getMyPurchasedTickets: async (): Promise<PurchasedTicketDto[]> => {
    return httpClient<PurchasedTicketDto[]>(`/resale-listings/my-purchased-tickets`, {
      method: 'GET',
    });
  },

  /**
   * Hold a listing for purchase (10-minute escrow lock & dynamic VietQR details).
   * POST /resale-listings/{id}/hold  (JWT required)
   */
  holdListing: async (
    listingId: string,
    request?: HoldListingForPurchaseRequest
  ): Promise<HoldListingForPurchaseResponse> => {
    return httpClient<HoldListingForPurchaseResponse>(
      `/resale-listings/${encodeURIComponent(listingId)}/hold`,
      {
        method: 'POST',
        body: JSON.stringify(request || {}),
      }
    );
  },

  /**
   * Poll escrow/listing status after hold (buyer of that escrow only).
   * GET /resale-listings/{id}/payment-status  (JWT required)
   */
  getPaymentStatus: async (listingId: string): Promise<PaymentStatusDto> => {
    return httpClient<PaymentStatusDto>(
      `/resale-listings/${encodeURIComponent(listingId)}/payment-status`,
      { method: 'GET' }
    );
  },

  /**
   * Release hold early by buyer (Cancel hold & revert listing status to VERIFIED immediately).
   * POST /resale-listings/{id}/release-hold  (JWT required)
   */
  releaseHold: async (listingId: string): Promise<{ listingId: string; listingStatus: string; releasedAt: string }> => {
    return httpClient<{ listingId: string; listingStatus: string; releasedAt: string }>(
      `/resale-listings/${encodeURIComponent(listingId)}/release-hold`,
      { method: 'POST' }
    );
  },

  /**
   * Cancel a listing that is still `Verified` (no buyer yet).
   * POST /resale-listings/{id}/cancel  (JWT required, caller must be the seller)
   */
  cancelListing: async (listingId: string): Promise<CancelResaleListingResponse> => {
    return httpClient<CancelResaleListingResponse>(
      `/resale-listings/${encodeURIComponent(listingId)}/cancel`,
      { method: 'POST' }
    );
  },
};

