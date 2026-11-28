import type { MyPayoutDto } from '@ticketshield/types';
import { httpClient } from './client';

export const payoutsApi = {
  /**
   * Payouts of the signed-in seller, newest first.
   * GET /api/v1/payouts/my-payouts (JWT required)
   */
  getMyPayouts: async (): Promise<MyPayoutDto[]> => {
    return httpClient<MyPayoutDto[]>('/payouts/my-payouts', {
      method: 'GET',
    });
  },
};
