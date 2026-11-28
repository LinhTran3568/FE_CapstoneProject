import type { OrganizerDto } from '@ticketshield/types';
import { httpClient } from './client';

export type { OrganizerDto };

export const organizersApi = {
  /**
   * Lấy danh sách các Ban tổ chức hợp tác đang hoạt động
   * GET /api/v1/organizers
   */
  getOrganizers: async (): Promise<OrganizerDto[]> => {
    return await httpClient<OrganizerDto[]>('/organizers', {
      method: 'GET',
    });
  },
};
