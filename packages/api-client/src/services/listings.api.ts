import { TicketListing } from '@ticketshield/types';
import { CreateListingFormData } from '@ticketshield/validation';
import { MOCK_LISTINGS } from '../mocks/listings';
import { MOCK_TICKETS } from '../mocks/tickets';
import { delay } from './client';

export const listingsApi = {
  getAll: async (filters?: {
    eventId?: string;
    verifiedOnly?: boolean;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest';
  }): Promise<TicketListing[]> => {
    await delay();
    let res = [...MOCK_LISTINGS];
    if (filters?.eventId) {
      res = res.filter((l) => l.eventId === filters.eventId);
    }
    if (filters?.verifiedOnly) {
      res = res.filter((l) => l.status === 'VERIFIED');
    }
    if (filters?.maxPrice) {
      res = res.filter((l) => l.resalePrice <= filters.maxPrice!);
    }
    if (filters?.sortBy === 'price_asc') {
      res.sort((a, b) => a.resalePrice - b.resalePrice);
    } else if (filters?.sortBy === 'price_desc') {
      res.sort((a, b) => b.resalePrice - a.resalePrice);
    }
    return res;
  },

  getById: async (id: string): Promise<TicketListing> => {
    await delay();
    const listing = MOCK_LISTINGS.find((l) => l.id === id);
    if (!listing) throw new Error('Không tìm thấy vé sang nhượng');
    return listing;
  },

  createListing: async (data: CreateListingFormData): Promise<TicketListing> => {
    await delay(600);
    const targetTicket = MOCK_TICKETS.find((t) => t.id === data.ticketId) || MOCK_TICKETS[0];
    const newListing: TicketListing = {
      id: `lst-${Date.now()}`,
      ticketId: targetTicket.id,
      sellerId: 'usr-buyer-01',
      sellerName: 'Nguyễn Văn An',
      sellerRating: 5.0,
      sellerTotalSales: 6,
      eventId: targetTicket.eventId,
      eventTitle: targetTicket.eventTitle,
      eventDate: targetTicket.eventDate,
      bannerImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      venueName: targetTicket.venueName,
      seatZone: targetTicket.seatZone,
      seatInfo: data.seatInfo,
      faceValue: targetTicket.originalPrice,
      resalePrice: data.resalePrice,
      status: 'VERIFIED',
      verificationId: `ver-${Date.now()}`,
      createdAt: new Date().toISOString(),
      escrowProtection: true,
    };
    MOCK_LISTINGS.unshift(newListing);
    return newListing;
  },
};
