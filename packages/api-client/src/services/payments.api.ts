import { Payment } from '@ticketshield/types';
import { delay } from './client';

export const paymentsApi = {
  processPayment: async (orderId: string, method: string, amount: number): Promise<Payment> => {
    await delay(1000);
    return {
      id: `pay-${Date.now()}`,
      orderId,
      amount,
      currency: 'VND',
      method: method as any,
      status: 'SUCCESS',
      transactionReference: `REF-VN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      paidAt: new Date().toISOString(),
    };
  },
};
