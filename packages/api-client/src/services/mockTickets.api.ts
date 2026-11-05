import type { MockTicketDto, MockTicketsListResponse } from '@ticketshield/types';
import { getMockOrganizerBaseUrl } from './organizerStore.api';

const ORGANIZER_DOWN_MESSAGE =
  'MockOrganizer service is unreachable. Unable to load purchased tickets.';

/**
 * Mock tickets are exposed by MockOrganizer's REST API, not by the AntiBot
 * organizer endpoint. Reuse the shared resolver so Web, Mobile, and the
 * organizer store honor VITE/EXPO_PUBLIC_MOCK_ORGANIZER_API_BASE_URL alike.
 */
const getMockTicketsApiBase = (): string => {
  const base = getMockOrganizerBaseUrl().replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};

const isValidEntryPass = (ticket: MockTicketDto) =>
  (ticket.status || '').trim().toUpperCase() === 'VALID';

export const mockTicketsApi = {
  /**
   * Buyer tickets issued by MockOrganizer.
   * GET /api/v1/mock-tickets/my-tickets?email=&status=VALID
   * Hits :5001 directly — Gateway does not proxy MockOrganizer.
   */
  getMyTickets: async (email: string): Promise<MockTicketDto[]> => {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error('Email is required to load tickets.');
    }

    const params = new URLSearchParams({
      email: trimmed,
      status: 'VALID',
    });
    const url = `${getMockTicketsApiBase()}/mock-tickets/my-tickets?${params.toString()}`;

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new Error(ORGANIZER_DOWN_MESSAGE);
    }

    if (!response.ok) {
      throw new Error(ORGANIZER_DOWN_MESSAGE);
    }

    const body = (await response.json()) as MockTicketsListResponse;
    return (body.data ?? []).filter(isValidEntryPass);
  },
};
