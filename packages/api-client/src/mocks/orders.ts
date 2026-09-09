import { Order, Escrow } from '@ticketshield/types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-8801',
    orderNumber: 'ORD-202609-8801',
    buyerId: 'usr-buyer-01',
    buyerName: 'Nguyễn Văn An',
    listingId: 'lst-301',
    eventId: 'evt-02',
    eventTitle: 'Hà Anh Tuấn Live Concert - Rực Rỡ Sức Sống 2026',
    ticketQuantity: 1,
    unitPrice: 2400000,
    serviceFee: 50000,
    totalAmount: 2450000,
    currency: 'VND',
    status: 'COMPLETED',
    escrowId: 'esc-7701',
    createdAt: '2026-09-05T11:20:00Z',
  },
];

export const MOCK_ESCROWS: Escrow[] = [
  {
    id: 'esc-7701',
    orderId: 'ord-8801',
    buyerId: 'usr-buyer-01',
    sellerId: 'usr-seller-01',
    amount: 2400000,
    status: 'FUNDED',
    fundedAt: '2026-09-05T11:22:00Z',
    autoReleaseAt: '2026-11-16T12:00:00Z',
  },
];
