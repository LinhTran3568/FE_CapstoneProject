import type { TrendingEventDto } from '@ticketshield/types';
import { httpClient } from './client';

export type { TrendingEventDto };

export const eventsApi = {
  /**
   * Lấy danh sách sự kiện nổi bật (Trending) cho Banner Slider trang chủ
   * GET /events/trending?limit=6&category=...&city=...
   */
  getTrendingEvents: async (params?: {
    limit?: number;
    category?: string;
    city?: string;
  }): Promise<TrendingEventDto[]> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.category && params.category !== 'ALL') searchParams.set('category', params.category);
    if (params?.city && params.city !== 'ALL') searchParams.set('city', params.city);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return httpClient<TrendingEventDto[]>(`/events/trending${query}`, {
      method: 'GET',
    });
  },

  /**
   * Lấy danh sách thể loại sự kiện
   * GET /events/categories
   */
  getCategories: async (): Promise<string[]> => {
    return httpClient<string[]>('/events/categories', {
      method: 'GET',
    });
  },
};
