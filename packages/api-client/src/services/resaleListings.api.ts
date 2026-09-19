import type {
  CancelResaleListingResponse,
  HoldListingForPurchaseRequest,
  HoldListingForPurchaseResponse,
  ListingStatus,
  PaginatedList,
  ResaleListingDetailDto,
  SellerListingDto,
} from '@ticketshield/types';
import { httpClient } from './client';

export type { ResaleListingDetailDto, PaginatedList, HoldListingForPurchaseRequest, HoldListingForPurchaseResponse };

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
   * Get payment status of a held listing.
   * GET /resale-listings/{id}/payment-status (JWT required)
   */
  getPaymentStatus: async (listingId: string): Promise<import('@ticketshield/types').GetPaymentStatusDto> => {
    return httpClient<import('@ticketshield/types').GetPaymentStatusDto>(
      `/resale-listings/${encodeURIComponent(listingId)}/payment-status`,
      { method: 'GET' }
    );
  },

  /**
   * Simulate SePay VietQR payment webhook (Local Dev Testing).
   * POST /webhooks/sepay
   */
  simulateSePayPayment: async (payload: {
    paymentReference: string;
    transferAmount: number;
    accountNumber?: string;
  }): Promise<any> => {
    return httpClient<any>(`/webhooks/sepay`, {
      method: 'POST',
      headers: {
        Authorization: 'Apikey TicketShieldWebhookKey2026',
      },
      body: JSON.stringify({
        id: Math.floor(Math.random() * 1000000),
        gateway: 'MBBank',
        transactionDate: new Date().toISOString(),
        accountNumber: payload.accountNumber || '0938434102',
        code: null,
        content: payload.paymentReference,
        transferType: 'in',
        transferAmount: payload.transferAmount,
        accumulated: payload.transferAmount,
        subAccount: null,
        referenceCode: `FT${Date.now()}`,
        description: payload.paymentReference,
      }),
    });
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

