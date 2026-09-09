import { Event } from '@ticketshield/types';
import { MOCK_EVENTS } from '../mocks/events';
import { delay } from './client';

export const eventsApi = {
  getAll: async (params?: { category?: string; query?: string }): Promise<Event[]> => {
    await delay();
    let result = [...MOCK_EVENTS];
    if (params?.category) {
      result = result.filter((e) => e.category === params.category);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue.name.toLowerCase().includes(q) ||
          e.venue.city.toLowerCase().includes(q)
      );
    }
    return result;
  },

  getById: async (id: string): Promise<Event> => {
    await delay();
    const event = MOCK_EVENTS.find((e) => e.id === id || e.slug === id);
    if (!event) throw new Error('Không tìm thấy sự kiện');
    return event;
  },
};
