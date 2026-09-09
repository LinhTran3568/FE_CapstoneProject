import { Ticket } from '@ticketshield/types';
import { MOCK_TICKETS } from '../mocks/tickets';
import { delay } from './client';

export const ticketsApi = {
  getMyTickets: async (): Promise<Ticket[]> => {
    await delay();
    return MOCK_TICKETS;
  },

  getById: async (id: string): Promise<Ticket> => {
    await delay();
    const t = MOCK_TICKETS.find((ticket) => ticket.id === id);
    if (!t) throw new Error('Không tìm thấy vé');
    return t;
  },
};
