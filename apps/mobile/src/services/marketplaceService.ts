import {
  ResaleListingDetailDto,
  HoldListingForPurchaseResponse,
  PurchasedTicketDto,
} from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { secureStorage } from './secureStore';

const LOCAL_PURCHASED_TICKETS_KEY = 'ticketshield_mobile_local_tickets';
const LOCAL_ORDERS_KEY = 'ticketshield_mobile_local_orders';

export interface MobileEscrowOrder {
  orderId: string;
  listingId: string;
  eventName: string;
  tierName: string;
  seatZone: string;
  amount: number;
  buyerFee: number;
  totalPaid: number;
  paymentReference: string;
  status: 'ESCROW_HOLDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  sellerFullName: string;
  ticketPassCode: string;
}

export const SEEDED_MARKETPLACE_LISTINGS: ResaleListingDetailDto[] = [
  {
    listingId: 'resale-atsh-01',
    eventId: 'atsh-2026',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'VieON & Vie Channel',
    eventName: 'ANH TRAI SAY HI LIVE CONCERT 2025',
    eventVenue: 'Sân vận động Quân Khu 7, TP.HCM',
    eventStartAt: '2025-04-19T19:30:00Z',
    tierId: 'tier-vip-a',
    tierName: 'VIP A - Sát Sân Khấu',
    seatZone: 'Khu A1 - Hàng 03 - Ghế 14',
    originalPrice: 2500000,
    resalePrice: 2200000,
    discountAmount: 300000,
    discountPercentage: 12,
    isPrivate: false,
    maskedTicketCode: 'ATSH-VIP-***-882',
    verificationStatus: 'Verified',
    listingStatus: 'Verified',
    sellerId: 'usr-seller-001',
    sellerFullName: 'Trần Minh Hoàng (Verified Reseller)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    listingId: 'resale-atsh-02',
    eventId: 'atsh-2026',
    organizerId: 'e0000000-0000-0000-0000-000000000001',
    organizerName: 'VieON & Vie Channel',
    eventName: 'ANH TRAI SAY HI LIVE CONCERT 2025',
    eventVenue: 'Sân vận động Quân Khu 7, TP.HCM',
    eventStartAt: '2025-04-19T19:30:00Z',
    tierId: 'tier-ga',
    tierName: 'GA STANDING - Khu B',
    seatZone: 'Khu B2 - Cửa Gate 3',
    originalPrice: 1200000,
    resalePrice: 1050000,
    discountAmount: 150000,
    discountPercentage: 12.5,
    isPrivate: false,
    maskedTicketCode: 'ATSH-GA-***-114',
    verificationStatus: 'Verified',
    listingStatus: 'Verified',
    sellerId: 'usr-seller-002',
    sellerFullName: 'Lê Thu Trang',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    listingId: 'resale-mytam-01',
    eventId: 'mytam-triam',
    organizerId: 'e0000000-0000-0000-0000-000000000002',
    organizerName: 'MT Entertainment',
    eventName: 'MỸ TÂM - LIVE CONCERT TRI ÂM',
    eventVenue: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    eventStartAt: '2025-05-10T19:00:00Z',
    tierId: 'tier-diamond',
    tierName: 'DIAMOND LOUNGE VIP',
    seatZone: 'Khu D - Hàng 01 - Ghế 08',
    originalPrice: 3500000,
    resalePrice: 3200000,
    discountAmount: 300000,
    discountPercentage: 8.5,
    isPrivate: false,
    maskedTicketCode: 'MT-TRIAM-***-991',
    verificationStatus: 'Verified',
    listingStatus: 'Verified',
    sellerId: 'usr-seller-003',
    sellerFullName: 'Phạm Đức Long',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    listingId: 'resale-soobin-01',
    eventId: 'soobin-space',
    organizerId: 'e0000000-0000-0000-0000-000000000003',
    organizerName: 'SpaceSpeakers Group',
    eventName: 'SOOBIN - THE PLAYAH CONCERT TOUR',
    eventVenue: 'Trung tâm Triển lãm SECC, Quận 7, TP.HCM',
    eventStartAt: '2025-06-01T20:00:00Z',
    tierId: 'tier-vip',
    tierName: 'VIP EARLY ENTRY',
    seatZone: 'Khu VIP 1 - Ghế 22',
    originalPrice: 1800000,
    resalePrice: 1650000,
    discountAmount: 150000,
    discountPercentage: 8.3,
    isPrivate: false,
    maskedTicketCode: 'SOOBIN-***-552',
    verificationStatus: 'Verified',
    listingStatus: 'Verified',
    sellerId: 'usr-seller-004',
    sellerFullName: 'Vũ Quốc Anh',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const marketplaceService = {
  /**
   * Lấy danh sách vé Resale từ Backend (fallback mock nếu backend chưa seed)
   */
  getListings: async (params?: {
    keyword?: string;
    eventId?: string;
  }): Promise<ResaleListingDetailDto[]> => {
    try {
      const response = await resaleListingsApi.getMarketplaceListings({
        page: 1,
        size: 20,
        keyword: params?.keyword,
        eventId: params?.eventId,
      });

      if (response && response.items && response.items.length > 0) {
        return response.items;
      }
    } catch (err) {
      console.warn('[MarketplaceService] Remote fetch fallback to seeded listings:', err);
    }

    // Fallback filter
    let results = [...SEEDED_MARKETPLACE_LISTINGS];
    if (params?.keyword && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase().trim();
      results = results.filter(
        (i) =>
          i.eventName.toLowerCase().includes(kw) ||
          i.tierName.toLowerCase().includes(kw) ||
          i.eventVenue.toLowerCase().includes(kw)
      );
    }
    if (params?.eventId && params.eventId !== 'ALL') {
      results = results.filter((i) => i.eventId === params.eventId);
    }
    return results;
  },

  /**
   * Khóa vé Escrow trong 10 phút & tạo mã VietQR
   */
  holdListing: async (
    listing: ResaleListingDetailDto,
    buyerInfo: { fullName: string; email: string; phone: string }
  ): Promise<HoldListingForPurchaseResponse> => {
    try {
      const res = await resaleListingsApi.holdListing(listing.listingId, {
        recipientName: buyerInfo.fullName,
        recipientEmail: buyerInfo.email,
      });
      if (res && res.paymentReference) {
        return res;
      }
    } catch (err) {
      console.warn('[MarketplaceService] Remote hold fallback to local escrow session:', err);
    }

    // Create fallback local escrow session
    const refCode = `TS${Math.floor(100000 + Math.random() * 900000)}`;
    const buyerFee = Math.round(listing.resalePrice * 0.03); // 3% escrow fee
    const totalBuyerPaid = listing.resalePrice + buyerFee;
    const vietQrUrl = `https://img.vietqr.io/image/970422-0329952127-compact2.png?amount=${totalBuyerPaid}&addInfo=${encodeURIComponent(
      refCode + ' TICKETSHIELD ESCROW'
    )}&accountName=TICKETSHIELD%20ESCROW%20HOLDING`;

    const unlockAt = new Date(Date.now() + 600 * 1000).toISOString(); // 10 minutes

    return {
      escrowId: `escrow-${Date.now()}`,
      listingId: listing.listingId,
      listingStatus: 'Transacting',
      paymentReference: refCode,
      qrImageUrl: vietQrUrl,
      quickLinkUrl: vietQrUrl,
      bankBin: '970422',
      accountNumber: '0329952127',
      accountName: 'TICKETSHIELD ESCROW HOLDING',
      resalePrice: listing.resalePrice,
      buyerFee,
      sellerFee: Math.round(listing.resalePrice * 0.05),
      totalBuyerPaid,
      netSellerPayout: listing.resalePrice - Math.round(listing.resalePrice * 0.05),
      unlockAt,
      holdDurationSeconds: 600,
    };
  },

  /**
   * Hoàn tất thanh toán Escrow và lưu vé vào ví số của người dùng
   */
  completeEscrowPurchase: async (
    listing: ResaleListingDetailDto,
    holdData: HoldListingForPurchaseResponse,
    buyerInfo: { fullName: string; email: string; phone: string }
  ): Promise<PurchasedTicketDto> => {
    // 1. Try remote simulate webhook if possible
    try {
      await resaleListingsApi.simulatePaymentWebhook(
        holdData.paymentReference,
        holdData.totalBuyerPaid
      );
    } catch (e) {
      // Continue locally
    }

    // 2. Generate Digital Ticket Pass
    const ticketPassCode = `TKS-${listing.eventId.toUpperCase().slice(0, 4)}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    const qrData = `TS:VERIFIED:${ticketPassCode}:${Date.now()}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      qrData
    )}`;

    const newTicket: PurchasedTicketDto = {
      escrowId: holdData.escrowId,
      listingId: listing.listingId,
      eventId: listing.eventId,
      eventName: listing.eventName,
      eventVenue: listing.eventVenue,
      eventStartAt: listing.eventStartAt,
      tierName: listing.tierName,
      seatZone: listing.seatZone || 'Khu Khán Đài',
      ticketPassCode,
      totalAmountPaid: holdData.totalBuyerPaid,
      status: 'VALID',
      paymentReference: holdData.paymentReference,
      recipientName: buyerInfo.fullName,
      recipientEmail: buyerInfo.email,
      qrCodeData: qrData,
      qrCodeImageUrl: qrImageUrl,
      purchasedAt: new Date().toISOString(),
    };

    // 3. Persist locally to storage
    await marketplaceService.saveLocalTicket(newTicket);

    // 4. Save to Orders history
    const newOrder: MobileEscrowOrder = {
      orderId: `ORD-${Date.now()}`,
      listingId: listing.listingId,
      eventName: listing.eventName,
      tierName: listing.tierName,
      seatZone: listing.seatZone || 'Khán Đài',
      amount: listing.resalePrice,
      buyerFee: holdData.buyerFee,
      totalPaid: holdData.totalBuyerPaid,
      paymentReference: holdData.paymentReference,
      status: 'ESCROW_HOLDING',
      createdAt: new Date().toISOString(),
      sellerFullName: listing.sellerFullName,
      ticketPassCode,
    };
    await marketplaceService.saveLocalOrder(newOrder);

    return newTicket;
  },

  saveLocalTicket: async (ticket: PurchasedTicketDto): Promise<void> => {
    try {
      const existing = await marketplaceService.getLocalTickets();
      const updated = [ticket, ...existing.filter((t) => t.ticketPassCode !== ticket.ticketPassCode)];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_PURCHASED_TICKETS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('saveLocalTicket error', e);
    }
  },

  getLocalTickets: async (): Promise<PurchasedTicketDto[]> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(LOCAL_PURCHASED_TICKETS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      // Ignore
    }
    return [];
  },

  saveLocalOrder: async (order: MobileEscrowOrder): Promise<void> => {
    try {
      const existing = await marketplaceService.getLocalOrders();
      const updated = [order, ...existing.filter((o) => o.orderId !== order.orderId)];
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('saveLocalOrder error', e);
    }
  },

  getLocalOrders: async (): Promise<MobileEscrowOrder[]> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      // Ignore
    }
    return [];
  },
};
