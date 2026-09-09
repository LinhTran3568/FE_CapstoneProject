import { Escrow } from '@ticketshield/types';
import { MOCK_ESCROWS } from '../mocks/orders';
import { delay } from './client';

export const escrowApi = {
  getByOrderId: async (orderId: string): Promise<Escrow> => {
    await delay();
    const escrow = MOCK_ESCROWS.find((e) => e.orderId === orderId);
    if (!escrow) {
      return {
        id: `esc-${Date.now()}`,
        orderId,
        buyerId: 'usr-buyer-01',
        sellerId: 'usr-seller-01',
        amount: 2400000,
        status: 'FUNDED',
        fundedAt: new Date().toISOString(),
        autoReleaseAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      };
    }
    return escrow;
  },

  confirmEntry: async (escrowId: string): Promise<Escrow> => {
    await delay(600);
    const item = MOCK_ESCROWS.find((e) => e.id === escrowId);
    if (item) {
      item.status = 'RELEASED';
      item.releasedAt = new Date().toISOString();
      return item;
    }
    return {
      id: escrowId,
      orderId: 'ord-8801',
      buyerId: 'usr-buyer-01',
      sellerId: 'usr-seller-01',
      amount: 2400000,
      status: 'RELEASED',
      fundedAt: new Date().toISOString(),
      releasedAt: new Date().toISOString(),
      autoReleaseAt: new Date().toISOString(),
    };
  },
};
