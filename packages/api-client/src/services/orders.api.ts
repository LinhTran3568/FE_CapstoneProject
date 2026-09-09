import { Order } from '@ticketshield/types';
import { CheckoutFormData } from '@ticketshield/validation';
import { MOCK_ORDERS } from '../mocks/orders';
import { MOCK_LISTINGS } from '../mocks/listings';
import { delay } from './client';

export const ordersApi = {
  createOrder: async (data: CheckoutFormData): Promise<Order> => {
    await delay(700);
    const listing = MOCK_LISTINGS.find((l) => l.id === data.listingId) || MOCK_LISTINGS[0];
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      buyerId: 'usr-buyer-01',
      buyerName: data.fullName,
      listingId: listing.id,
      eventId: listing.eventId,
      eventTitle: listing.eventTitle,
      ticketQuantity: 1,
      unitPrice: listing.resalePrice,
      serviceFee: Math.round(listing.resalePrice * 0.02),
      totalAmount: listing.resalePrice + Math.round(listing.resalePrice * 0.02),
      currency: 'VND',
      status: 'COMPLETED',
      escrowId: `esc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_ORDERS.unshift(newOrder);
    return newOrder;
  },

  getOrders: async (): Promise<Order[]> => {
    await delay();
    return MOCK_ORDERS;
  },

  getById: async (id: string): Promise<Order> => {
    await delay();
    const order = MOCK_ORDERS.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return order;
  },
};
