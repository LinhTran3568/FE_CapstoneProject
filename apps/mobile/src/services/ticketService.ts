import { PurchasedTicketDto } from '@ticketshield/types';
import { resaleListingsApi } from '@ticketshield/api-client';
import { marketplaceService, MobileEscrowOrder } from './marketplaceService';

export const SEEDED_USER_TICKETS: PurchasedTicketDto[] = [
  {
    escrowId: 'escrow-sample-01',
    listingId: 'resale-atsh-01',
    eventId: 'atsh-2026',
    eventName: 'ANH TRAI SAY HI LIVE CONCERT 2025',
    eventVenue: 'Sân vận động Quân Khu 7, TP.HCM',
    eventStartAt: '2025-04-19T19:30:00Z',
    tierName: 'VIP A - Sát Sân Khấu',
    seatZone: 'Khu A1 - Hàng 03 - Ghế 14',
    ticketPassCode: 'TS-ATSH-VIP-882109',
    totalAmountPaid: 2266000,
    status: 'VALID',
    paymentReference: 'TS882109',
    recipientName: 'Người Dùng TicketShield',
    recipientEmail: 'buyer@ticketshield.vn',
    qrCodeData: 'TS:VERIFIED:TS-ATSH-VIP-882109',
    qrCodeImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=TS-ATSH-VIP-882109',
    purchasedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export const ticketService = {
  /**
   * Lấy danh sách vé đã mua của người dùng
   */
  getUserTickets: async (): Promise<PurchasedTicketDto[]> => {
    try {
      const remote = await resaleListingsApi.getMyPurchasedTickets();
      if (remote && remote.length > 0) {
        return remote;
      }
    } catch (e) {
      // Ignore remote error
    }

    const local = await marketplaceService.getLocalTickets();
    if (local.length > 0) {
      return local;
    }

    return SEEDED_USER_TICKETS;
  },

  /**
   * Lấy chi tiết một vé theo ticketPassCode hoặc listingId
   */
  getTicketById: async (id: string): Promise<PurchasedTicketDto | null> => {
    const all = await ticketService.getUserTickets();
    return (
      all.find(
        (t) => t.ticketPassCode === id || t.listingId === id || t.escrowId === id
      ) || null
    );
  },

  /**
   * Tạo chuỗi Token mã QR xoay vòng chống phe vé (Dynamic Rotating Anti-Scalping Token)
   * Mã thay đổi sau mỗi chu kỳ 30 giây
   */
  generateRotatingToken: (ticketCode: string): { token: string; secondsRemaining: number } => {
    const cycleMs = 30000;
    const now = Date.now();
    const cycleIndex = Math.floor(now / cycleMs);
    const msIntoCycle = now % cycleMs;
    const secondsRemaining = Math.max(1, Math.ceil((cycleMs - msIntoCycle) / 1000));

    // Token kết hợp mã vé, chu kỳ thời gian và checksum
    const token = `TS-TOTP:${ticketCode}:${cycleIndex.toString(36).toUpperCase()}:${Math.sin(cycleIndex).toString(36).slice(2, 6).toUpperCase()}`;

    return { token, secondsRemaining };
  },

  /**
   * Lấy lịch sử đơn hàng
   */
  getUserOrders: async (): Promise<MobileEscrowOrder[]> => {
    const localOrders = await marketplaceService.getLocalOrders();
    if (localOrders.length > 0) {
      return localOrders;
    }

    // Default sample order
    return [
      {
        orderId: 'ORD-982101',
        listingId: 'resale-atsh-01',
        eventName: 'ANH TRAI SAY HI LIVE CONCERT 2025',
        tierName: 'VIP A - Sát Sân Khấu',
        seatZone: 'Khu A1 - Hàng 03 - Ghế 14',
        amount: 2200000,
        buyerFee: 66000,
        totalPaid: 2266000,
        paymentReference: 'TS882109',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        sellerFullName: 'Trần Minh Hoàng',
        ticketPassCode: 'TS-ATSH-VIP-882109',
      },
    ];
  },
};

